"""Assemble the Typst payload and generate the application PDF (background task)."""

import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from sqlmodel import Session

from database import get_engine
from models import ApplicationPayload, DriverApplication
from pdf_generator.pdf_generator import PDFGenerator


def _output_dir() -> Path:
    d = Path(os.getenv("GENERATED_PDF_DIR", str(Path(__file__).parent / "generated_pdfs")))
    d.mkdir(parents=True, exist_ok=True)
    return d


def build_payload(application: DriverApplication, answers: dict) -> dict:
    """Merge driver answers + manager config, validate, and add the flat is_owner key."""
    assembled = {**answers, "config": application.manager_config}
    payload = ApplicationPayload(**assembled).model_dump(mode="json")
    payload["is_owner"] = application.driver_is_owner  # Typst reads a flat top-level key
    # Manager counter-signature goes on the company/carrier signature lines.
    manager_sig = getattr(application, "manager_signature", None)
    if manager_sig:
        payload.setdefault("signatures", {})["carrier"] = manager_sig
    return payload


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
