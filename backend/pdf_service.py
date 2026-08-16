"""Assemble the Typst payload and generate the application PDF (background task)."""

import os
import tempfile
from datetime import date, datetime, timezone
from pathlib import Path

from sqlmodel import Session

import logs
import uploads
from database import get_engine
from fine_schedule import default_fine_schedule, default_fees_schedule
from models import ApplicationPayload, DriverApplication
from pdf_generator.pdf_generator import PDFGenerator

log = logs.setup("mfleet.pdf")


def _output_dir() -> Path:
    d = Path(os.getenv("GENERATED_PDF_DIR", str(Path(__file__).parent / "generated_pdfs")))
    d.mkdir(parents=True, exist_ok=True)
    return d


def _parse_iso(s) -> date | None:
    try:
        return date.fromisoformat(str(s)[:10])
    except (ValueError, TypeError):
        return None


def employment_gaps(history: list | None, application_date, min_gap_days: int = 31) -> list[dict]:
    """Auto-detect employment gaps longer than ~1 month for the DECLARATION OF EMPLOYMENT
    STATUS page: gaps between consecutive jobs, plus a trailing gap up to the application
    date. Entries with unparseable dates are skipped (best-effort)."""
    asof = _parse_iso(application_date) or date.today()
    intervals = []
    for e in history or []:
        s = _parse_iso(e.get("start_date"))
        raw_end = e.get("end_date")
        en = _parse_iso(raw_end)
        # Empty end date = still employed -> treat as ongoing (up to the application
        # date) so a current job doesn't read as a gap. A non-empty but unparseable
        # date is genuinely bad data and the row is skipped.
        if s and not en and not str(raw_end or "").strip():
            en = asof
        if s and en and en >= s:
            intervals.append((s, en))
    if not intervals:
        return []
    intervals.sort()
    gaps = []
    cursor = intervals[0][1]
    for s, en in intervals[1:]:
        if (s - cursor).days > min_gap_days:
            gaps.append((cursor, s))
        cursor = max(cursor, en)
    if (asof - cursor).days > min_gap_days:
        gaps.append((cursor, asof))
    return [{"from": a.isoformat(), "to": b.isoformat()} for a, b in gaps]


def build_payload(application: DriverApplication, answers: dict) -> dict:
    """Merge driver answers + manager config, validate, and add the flat is_owner key."""
    assembled = {**answers, "config": application.manager_config}
    payload = ApplicationPayload(**assembled).model_dump(mode="json")
    payload["is_owner"] = application.driver_is_owner  # Typst reads a flat top-level key
    # Effective date for the agreements ("made/entered into on this day __"): when the
    # MANAGER created the application (not the driver's fill date). MM/DD/YYYY to match
    # the other date lines. Old rows without created_at fall back to the fill date in Typst.
    if getattr(application, "created_at", None):
        payload["application_created_date"] = application.created_at.strftime("%m/%d/%Y")
    # Applications created before per-company fine schedules have no table snapshot;
    # fall back to the standard one so the penalties page still renders fully.
    cfg = payload.get("config") or {}
    if not cfg.get("fine_schedule"):
        cfg["fine_schedule"] = default_fine_schedule()
    if not cfg.get("fees_schedule"):
        cfg["fees_schedule"] = default_fees_schedule()
    payload["config"] = cfg
    # Manager counter-signature goes on the company/carrier signature lines.
    manager_sig = getattr(application, "manager_signature", None)
    if manager_sig:
        payload.setdefault("signatures", {})["carrier"] = manager_sig
    # Resolve uploaded-document references (stored relative) to absolute paths the
    # generator can merge; drop any that no longer exist on disk.
    docs = {}
    for doc_type, rel in (payload.get("documents") or {}).items():
        try:
            p = uploads.resolve(rel)
        except ValueError:
            continue
        if p.exists():
            docs[doc_type] = str(p)
    # Owner-operators: fold each truck's documents (keyed by equipment index) into the
    # same append set so every uploaded truck doc is merged into the signed contract.
    for idx, per in (payload.get("truck_documents") or {}).items():
        for doc_type, rel in (per or {}).items():
            try:
                p = uploads.resolve(rel)
            except ValueError:
                continue
            if p.exists():
                docs[f"{doc_type}_truck{idx}"] = str(p)
    payload["documents"] = docs
    # Employment gaps: the LIST is recomputed here (authoritative — a client can't hide a
    # gap), then each gap picks up the driver's explanation by its "<from>_<to>" key.
    gaps = employment_gaps(payload.get("employment_history"), payload.get("application_date"))
    explanations = (payload.get("employment_declaration") or {}).get("gap_explanations") or {}
    for g in gaps:
        g["explanation"] = explanations.get(f"{g['from']}_{g['to']}", "")
    payload["employment_gaps"] = gaps
    return payload


def generate_employer_packet(
    application: DriverApplication, answers: dict, index: int,
    attempts: list | None = None, received_at=None,
) -> Path:
    """Build the signed verification packet for one prior employer (by index into
    employment_history), stamping the send-attempt log onto the records-request page.
    Returns the stored path. Raises on bad index/compile."""
    payload = build_payload(application, answers)  # validates; includes the driver signature
    history = payload.get("employment_history") or []
    if not 0 <= index < len(history):
        raise ValueError(f"employer index {index} out of range")
    payload["employer_attempts"] = attempts or []
    if received_at is not None:
        payload["employer_received"] = {"date": received_at.strftime("%m/%d/%Y")}
    out = _output_dir() / f"employer_app{application.id}_{index}.pdf"
    if not PDFGenerator().generate_employer_packet(payload, index, out):
        raise RuntimeError("Employer packet generation failed")
    return out


def generate_preview_pdf(application: DriverApplication, answers: dict) -> Path:
    """Generate a one-off preview PDF from the current draft answers into a temp
    file, WITHOUT touching the application's stored pdf status/path. The caller
    must delete the returned file after serving it. Raises pydantic
    ValidationError if the answers are still incomplete."""
    # Always preview the UNSIGNED contract (blank signature lines) — even if a
    # signature was already captured (e.g. a re-opened application): the point is
    # to show what the driver is about to sign before they sign it.
    preview_answers = {k: v for k, v in answers.items() if k != "signatures"}
    payload = build_payload(application, preview_answers)  # validates; signatures empty
    fd, tmp = tempfile.mkstemp(suffix=".pdf", prefix="preview_")
    os.close(fd)
    out = Path(tmp)
    if not PDFGenerator().generate(payload, out):
        out.unlink(missing_ok=True)
        raise RuntimeError("Typst compilation or PDF merge failed")
    return out


def generate_application_pdf(application_id: int) -> None:
    """Background task: build payload, run Typst+merge, record status on the application."""
    with Session(get_engine()) as session:
        app = session.get(DriverApplication, application_id)
        if app is None:
            return
        app.pdf_status = "generating"
        app.pdf_error = None
        session.add(app)
        session.commit()

        answers = app.answers.answers if app.answers else {}
        try:
            payload = build_payload(app, answers)
            out = _output_dir() / f"application_{application_id}.pdf"
            if not PDFGenerator().generate(payload, out):
                raise RuntimeError("Typst compilation or PDF merge failed")
            app.pdf_status = "ready"
            app.pdf_path = str(out)
            app.pdf_error = None
            app.pdf_generated_at = datetime.now(timezone.utc)
        except Exception as exc:  # noqa: BLE001 - record any failure for the manager
            app.pdf_status = "failed"
            app.pdf_error = str(exc)[:1000]
        session.add(app)
        session.commit()

        # On final (counter-signed) approval, mirror the signed packet to Google Drive.
        # Best-effort: a Drive failure never affects the application's PDF status.
        if app.pdf_status == "ready" and app.status == "approved":
            try:
                import google_drive
                google_drive.upload_application(app.id)
            except Exception as exc:  # noqa: BLE001
                log.warning("Drive upload skipped for app %s: %s", app.id, exc)
