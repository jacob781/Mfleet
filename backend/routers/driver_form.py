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
    HTTPException,
    Request,
    status,
)
from fastapi.responses import FileResponse
from pydantic import ValidationError
from sqlmodel import Session, select
from starlette.background import BackgroundTask

from database import get_session
from models import (
    ApplicationPayload,
    ComplianceDocument,
    Driver,
    DriverAnswers,
    DriverApplication,
)
from pdf_service import generate_application_pdf, generate_preview_pdf
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


def _upsert_compliance(session: Session, driver_id: int, doc_type: str, expiry) -> None:
    """Create or update the single compliance doc of this type for the driver,
    so re-submitting a corrected form updates the row instead of duplicating it."""
    existing = session.exec(
        select(ComplianceDocument).where(
            ComplianceDocument.driver_id == driver_id,
            ComplianceDocument.document_type == doc_type,
        )
    ).first()
    if existing is not None:
        existing.expiry_date = expiry
        existing.status = "Valid"
        session.add(existing)
    else:
        session.add(
            ComplianceDocument(
                driver_id=driver_id,
                document_type=doc_type,
                issue_date=date.today(),
                expiry_date=expiry,
                status="Valid",
            )
        )


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
    # type per driver, updated (not duplicated) on re-submit.
    _upsert_compliance(session, app.driver_id, "CDL", validated.cdl.expiration)
    _upsert_compliance(session, app.driver_id, "Medical Cert", validated.medical.expiration_date)

    app.status = "pending_review"
    app.submitted_at = datetime.now(timezone.utc)
    app.pdf_status = "generating"
    session.add(app)
    session.commit()

    background.add_task(generate_application_pdf, app.id)
    return {"status": app.status, "pdf_status": "generating"}


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
