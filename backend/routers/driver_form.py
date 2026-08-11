"""Driver form router: token-based access for drivers to fill and submit.

No login — access is via the unguessable application token. Drafts autosave;
submit validates synchronously (driver sees field errors) and kicks off
background PDF generation (status visible to the manager).
"""

import os
from datetime import date, datetime, timezone
from typing import Annotated, Any, Dict

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from pydantic import ValidationError
from sqlmodel import Session, select
from starlette.background import BackgroundTask

import uploads
from database import get_engine, get_session
from mailer import send_mail
from models import (
    EV_HIRED,
    ApplicationPayload,
    Company,
    ComplianceDocument,
    Driver,
    DriverAnswers,
    DriverApplication,
    DriverEmploymentEvent,
    Truck,
)
from pdf_service import employment_gaps, generate_application_pdf, generate_preview_pdf
from rate_limit import limiter

router = APIRouter(prefix="/api/form", tags=["Driver Form"])

_FILLABLE_STATUSES = {"pending_driver", "draft"}


def _load(token: str, session: Session) -> DriverApplication:
    app = session.exec(
        select(DriverApplication).where(DriverApplication.access_token == token)
    ).first()
    if app is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app


def _load_fillable(token: str, session: Session) -> DriverApplication:
    app = _load(token, session)
    if app.expires_at and app.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_410_GONE, detail="This link has expired")
    if app.status not in _FILLABLE_STATUSES:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="This application has already been submitted"
        )
    return app


def _upsert_compliance(
    session: Session,
    doc_type: str,
    expiry,
    file_path: str | None = None,
    *,
    driver_id: int | None = None,
    truck_id: int | None = None,
) -> None:
    """Create or update the single compliance doc of this type for a driver OR truck,
    so re-submitting a corrected form updates the row instead of duplicating it.
    file_path (when uploaded) is attached here — the same row drives both the expiry
    alert and the stored file reference."""
    owner = (
        ComplianceDocument.driver_id == driver_id
        if driver_id is not None
        else ComplianceDocument.truck_id == truck_id
    )
    existing = session.exec(
        select(ComplianceDocument).where(owner, ComplianceDocument.document_type == doc_type)
    ).first()
    if existing is not None:
        existing.expiry_date = expiry
        if file_path:
            existing.file_path = file_path
        session.add(existing)
    else:
        session.add(
            ComplianceDocument(
                driver_id=driver_id,
                truck_id=truck_id,
                document_type=doc_type,
                issue_date=date.today(),
                expiry_date=expiry,
                file_path=file_path,
            )
        )


def _upsert_trucks(session: Session, company_id: int, equipment: list,
                   owner_driver_id: int | None = None) -> list:
    """Create/update Truck rows from the driver's equipment list, matched by VIN
    within the company so re-submit updates instead of duplicating. Links each to the
    owner-operator (owner_driver_id). Returns the Truck rows; the caller matches each
    back to its equipment entry by VIN to attach that truck's own documents."""
    trucks = []
    for item in equipment:
        vin = (item.vin or "").strip()
        if not vin:
            continue
        truck = session.exec(
            select(Truck).where(Truck.company_id == company_id, Truck.vin == vin)
        ).first()
        if truck is None:
            truck = Truck(company_id=company_id, vin=vin, make="", year=0,
                          plate_number="", state_registered="")
        truck.make = item.make or truck.make
        truck.year = item.year or truck.year
        truck.plate_number = item.plate or truck.plate_number
        truck.state_registered = (item.state or truck.state_registered)[:2]
        if owner_driver_id is not None:
            truck.owner_driver_id = owner_driver_id
        session.add(truck)
        trucks.append(truck)
    if trucks:
        session.commit()
        for t in trucks:
            session.refresh(t)
    return trucks


@router.get("/{token}")
@limiter.limit("60/minute")
def get_form(
    request: Request,
    token: str,
    session: Annotated[Session, Depends(get_session)],
) -> dict:
    app = _load_fillable(token, session)
    cfg = app.manager_config or {}
    return {
        "driver_is_owner": app.driver_is_owner,
        "company_name": cfg.get("company_name"),
        "min_age": cfg.get("min_age"),
        "min_years_history": cfg.get("min_years_history"),
        "status": app.status,
        "answers": app.answers.answers if app.answers else {},
        # Penalty tables the manager enabled, so the driver can review them on the
        # documents step before accepting.
        "include_penalties": cfg.get("include_penalties", True),
        "include_fees": cfg.get("include_fees", True),
        "fine_schedule": cfg.get("fine_schedule"),
        "fees_schedule": cfg.get("fees_schedule"),
        # Owner-operator compensation (Supplement B) — shown read-only so the driver
        # sees the rates/fees the manager set. Labels relabeled in the PDF: eld_device
        # -> Service/week, tablet -> Tablet/month, prepass_monthly -> IFTA/week.
        "compensation": {
            "compensation_type": cfg.get("compensation_type"),
            "percentage_rate_non_amazon": cfg.get("percentage_rate_non_amazon") or cfg.get("percentage_rate"),
            "percentage_rate_amazon": cfg.get("percentage_rate_amazon"),
            "weekly_amount": cfg.get("weekly_amount"),
            "loaded_rate": cfg.get("loaded_rate"),
            "empty_rate": cfg.get("empty_rate"),
            "hourly_rate": cfg.get("hourly_rate"),
            "insurance_cargo_liability": cfg.get("insurance_cargo_liability"),
            "eld_device_weekly": cfg.get("eld_device_weekly"),         # Service / week
            "tablet_weekly": cfg.get("tablet_weekly"),                 # Tablet / month
            "prepass_monthly": cfg.get("prepass_monthly"),             # IFTA / week
            "administration_fee_weekly": cfg.get("administration_fee_weekly"),
        },
    }


@router.patch("/{token}")
@limiter.limit("120/minute")
def save_draft(
    request: Request,
    token: str,
    partial: Dict[str, Any],
    session: Annotated[Session, Depends(get_session)],
) -> dict:
    app = _load_fillable(token, session)
    row = app.answers
    if row is None:
        row = DriverAnswers(application_id=app.id, answers={})
        session.add(row)
    row.answers = {**(row.answers or {}), **partial}  # shallow per-section merge
    session.add(row)
    session.commit()
    return {"saved": True}


@router.post("/{token}/employment-gaps")
@limiter.limit("60/minute")
def detect_employment_gaps(
    request: Request,
    token: str,
    body: Dict[str, Any],
    session: Annotated[Session, Depends(get_session)],
) -> dict:
    """Single source of truth for employment-gap dates: the frontend posts the current
    employment history and gets back the gaps to explain. The same helper runs again at
    PDF time (authoritative), so this never has to be trusted — it just drives the UI."""
    _load_fillable(token, session)  # token gate only
    gaps = employment_gaps(body.get("employment_history"), body.get("application_date"))
    return {"gaps": gaps}


@router.post("/{token}/documents/{doc_type}")
@limiter.limit("30/minute")
async def upload_document(
    request: Request,
    token: str,
    doc_type: str,
    file: Annotated[UploadFile, File()],
    session: Annotated[Session, Depends(get_session)],
) -> dict:
    """Driver uploads a required document (medical cert, license, …). Stored on disk
    by id, with the relative path recorded in the draft so it flows to submit (compliance
    file_path), the review screen, and the merged contract."""
    app = _load_fillable(token, session)
    data = await file.read()
    try:
        rel = uploads.save(app.company_id, app.id, doc_type, data)
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    row = app.answers
    if row is None:
        row = DriverAnswers(application_id=app.id, answers={})
    answers = row.answers or {}
    docs = {**(answers.get("documents") or {}), doc_type: rel}
    row.answers = {**answers, "documents": docs}
    session.add(row)
    session.commit()
    return {"saved": True, "doc_type": doc_type, "path": rel}


def _document_path(app: DriverApplication, doc_type: str):
    """Resolve the stored upload for a doc_type, or 404. Shared by the driver
    (token-gated) and manager (login-gated) serve endpoints."""
    rel = ((app.answers.answers if app.answers else {}) or {}).get("documents", {}).get(doc_type)
    if not rel:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Document not uploaded")
    path = uploads.resolve(rel)
    if not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="File missing")
    return path


@router.get("/{token}/documents/{doc_type}")
@limiter.limit("60/minute")
def get_document(
    request: Request,
    token: str,
    doc_type: str,
    session: Annotated[Session, Depends(get_session)],
) -> FileResponse:
    """Serve the driver their own uploaded document back (token-gated, not static)."""
    app = _load(token, session)  # _load, not _load_fillable: viewable after submit too
    return uploads.file_response(_document_path(app, doc_type))


@router.post("/{token}/trucks/{truck_idx}/documents/{doc_type}")
@limiter.limit("30/minute")
async def upload_truck_document(
    request: Request,
    token: str,
    truck_idx: int,
    doc_type: str,
    file: Annotated[UploadFile, File()],
    session: Annotated[Session, Depends(get_session)],
) -> dict:
    """Owner-operator uploads a document (annual inspection / registration) for one of
    their trucks, keyed by the equipment index. At submit each truck's docs are relocated
    into that truck's folder and linked to its ComplianceDocument."""
    app = _load_fillable(token, session)
    data = await file.read()
    try:
        rel = uploads.save_app_truck(app.company_id, app.id, truck_idx, doc_type, data)
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    row = app.answers
    if row is None:
        row = DriverAnswers(application_id=app.id, answers={})
    answers = row.answers or {}
    trucks = {**(answers.get("truck_documents") or {})}
    trucks[str(truck_idx)] = {**(trucks.get(str(truck_idx)) or {}), doc_type: rel}
    row.answers = {**answers, "truck_documents": trucks}
    session.add(row)
    session.commit()
    return {"saved": True, "truck_index": truck_idx, "doc_type": doc_type, "path": rel}


def _truck_document_path(app: DriverApplication, truck_idx: int, doc_type: str):
    rel = (
        (((app.answers.answers if app.answers else {}) or {}).get("truck_documents", {}) or {})
        .get(str(truck_idx), {})
        .get(doc_type)
    )
    if not rel:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Document not uploaded")
    path = uploads.resolve(rel)
    if not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="File missing")
    return path


@router.get("/{token}/trucks/{truck_idx}/documents/{doc_type}")
@limiter.limit("60/minute")
def get_truck_document(
    request: Request,
    token: str,
    truck_idx: int,
    doc_type: str,
    session: Annotated[Session, Depends(get_session)],
) -> FileResponse:
    """Serve a driver their own uploaded truck document back (token-gated)."""
    app = _load(token, session)
    return uploads.file_response(_truck_document_path(app, truck_idx, doc_type))


@router.post("/{token}/submit")
@limiter.limit("20/minute")
def submit_form(
    request: Request,
    token: str,
    body: Dict[str, Any],
    session: Annotated[Session, Depends(get_session)],
    background: BackgroundTasks,
) -> dict:
    app = _load_fillable(token, session)

    row = app.answers
    stored = (row.answers if row else {}) or {}
    answers = {**stored, **body}

    # Single source of validation: assemble with the manager config and validate.
    try:
        validated = ApplicationPayload(**{**answers, "config": app.manager_config})
    except ValidationError as exc:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=[{"loc": e["loc"], "msg": e["msg"]} for e in exc.errors()],
        )

    # Persist final answers (encrypted at rest).
    if row is None:
        row = DriverAnswers(application_id=app.id, answers=answers)
    else:
        row.answers = answers
    session.add(row)

    # Create the driver on first submit; on re-submit update it with any corrections.
    if app.driver_id is None:
        driver = Driver(
            company_id=app.company_id,
            first_name=validated.first_name,
            middle_name=validated.middle_name or None,
            last_name=validated.last_name,
            email=validated.email,
            phone=validated.phone,
            ssn=validated.ssn,
            dob=validated.dob,
            status="Pending",
        )
        session.add(driver)
        session.commit()
        session.refresh(driver)
        # Open the employment record here too, not just for hand-added drivers.
        session.add(DriverEmploymentEvent(
            driver_id=driver.id, kind=EV_HIRED, date=driver.hire_date,
        ))
        app.driver_id = driver.id
    else:
        driver = session.get(Driver, app.driver_id)
        if driver is not None:
            driver.first_name = validated.first_name
            driver.middle_name = validated.middle_name or None
            driver.last_name = validated.last_name
            driver.email = validated.email
            driver.phone = validated.phone
            driver.ssn = validated.ssn
            driver.dob = validated.dob
            session.add(driver)

    # Compliance documents drive future expiry alerts (Stage 3) — one row per
    # type per driver, updated (not duplicated) on re-submit. Attach any file the
    # driver uploaded (stored in the draft under "documents") to the same row.
    docs = answers.get("documents") or {}
    _upsert_compliance(session, "CDL", validated.cdl.expiration, docs.get("cdl"), driver_id=app.driver_id)
    _upsert_compliance(session, "Medical Cert", validated.medical.expiration_date, docs.get("medical_cert"), driver_id=app.driver_id)

    # Owner-operators: their equipment becomes real Truck rows, and the truck-side
    # documents (annual inspection, registration) hang off the primary truck so they
    # surface in the fleet view and expiry alerts. Expiries come from the form.
    if app.driver_is_owner and validated.equipment:
        trucks = _upsert_trucks(session, app.company_id, validated.equipment, owner_driver_id=app.driver_id)
        # Each equipment entry carries its own documents (keyed by equipment index).
        # Match index → Truck row by VIN, then link that truck's docs to its own row.
        by_vin = {t.vin: t for t in trucks}
        truck_docs = {k: dict(v) for k, v in (answers.get("truck_documents") or {}).items()}
        truck_exp = validated.truck_document_expiries or {}
        changed = False
        for idx, item in enumerate(validated.equipment):
            truck = by_vin.get((item.vin or "").strip())
            if truck is None:
                continue
            per = truck_docs.get(str(idx)) or {}
            exp = truck_exp.get(str(idx)) or {}
            for doc_type, label in (("annual_inspection", "Annual Inspection"),
                                    ("registration", "Registration")):
                file_rel = per.get(doc_type)
                if file_rel:
                    # Relocate into the truck's folder so ALL of a truck's documents live
                    # in one place; keep the answers path in sync for the PDF merge.
                    file_rel = uploads.move_to_truck(file_rel, truck.id, doc_type)
                    per[doc_type] = file_rel
                    changed = True
                if exp.get(doc_type):
                    _upsert_compliance(session, label, exp[doc_type], file_rel, truck_id=truck.id)
            truck_docs[str(idx)] = per
        if changed:
            # Persist the relocated paths so the background PDF task reads them from the DB.
            row.answers = {**answers, "truck_documents": truck_docs}
            session.add(row)

    app.status = "pending_review"
    app.submitted_at = datetime.now(timezone.utc)
    app.pdf_status = "generating"
    session.add(app)
    session.commit()

    background.add_task(generate_application_pdf, app.id)
    background.add_task(notify_manager_submitted, app.id)
    return {"status": app.status, "pdf_status": "generating"}


def notify_manager_submitted(application_id: int) -> None:
    """Email the team inbox (MAIL_TO) that a driver has submitted an application.
    Best-effort: never raises (runs as a background task)."""
    with Session(get_engine()) as session:
        app = session.get(DriverApplication, application_id)
        if app is None:
            return
        driver = session.get(Driver, app.driver_id) if app.driver_id else None
        company = session.get(Company, app.company_id)
        who = f"{driver.first_name} {driver.last_name}" if driver else "A driver"
        where = f" — {company.name}" if company else ""
        kind = "Owner-operator" if app.driver_is_owner else "Company driver"
        send_mail(
            os.getenv("MAIL_TO"),
            f"New submission: application #{app.id}{where}",
            f"{who} ({kind}) has submitted application #{app.id}{where} "
            f"and it is ready for review.\n\n"
            f"Open the Mfleet admin panel to review the answers and documents, "
            f"then counter-sign to approve.\n",
        )


@router.get("/{token}/preview")
@limiter.limit("10/minute")
def form_preview(
    request: Request,
    token: str,
    session: Annotated[Session, Depends(get_session)],
) -> FileResponse:
    """Render the full assembled contract from the current draft so the driver
    can see exactly what they're about to sign (signature lines blank). Does not
    submit or change the application's stored PDF."""
    app = _load_fillable(token, session)
    answers = app.answers.answers if app.answers else {}
    try:
        path = generate_preview_pdf(app, answers)
    except ValidationError as exc:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=[{"loc": e["loc"], "msg": e["msg"]} for e in exc.errors()],
        )
    except Exception as exc:  # noqa: BLE001 - surface generation failure to the driver
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Preview generation failed: {exc}",
        )
    return FileResponse(
        str(path),
        media_type="application/pdf",
        filename="preview.pdf",
        background=BackgroundTask(path.unlink, missing_ok=True),
    )


@router.get("/{token}/status")
@limiter.limit("120/minute")
def form_status(
    request: Request,
    token: str,
    session: Annotated[Session, Depends(get_session)],
) -> dict:
    app = _load(token, session)
    return {"status": app.status, "pdf_status": app.pdf_status}


@router.get("/{token}/pdf")
def form_pdf(
    token: str,
    session: Annotated[Session, Depends(get_session)],
) -> FileResponse:
    app = _load(token, session)
    if app.pdf_status != "ready" or not app.pdf_path or not os.path.exists(app.pdf_path):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"Document not ready (status: {app.pdf_status})",
        )
    return FileResponse(
        app.pdf_path,
        media_type="application/pdf",
        filename="driver_application.pdf",
    )
