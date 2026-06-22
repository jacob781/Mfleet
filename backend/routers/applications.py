"""Applications router: a manager creates a document-flow request for a driver.

On create, the carrier company's details are snapshotted into manager_config
(JSONB) alongside the manager's settings, then validated against the full Typst
contract (ManagerConfig). A unique access token + apply link is returned.
"""

import copy
import os
from datetime import datetime, timezone
from typing import Annotated, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from pydantic import ValidationError
from sqlmodel import Session, select

from database import get_session
from dependencies import get_current_user
from models import Company, Driver, DriverApplication, ManagerConfig, User
from pdf_service import generate_application_pdf
from schemas import (
    ApplicationCreate,
    ApplicationListItem,
    ApplicationResponse,
    ApplicationStatusUpdate,
    CounterSignRequest,
    DriverSummary,
)

router = APIRouter(prefix="/api/applications", tags=["Applications"])


def _apply_url(token: str) -> str:
    base = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")
    return f"{base}/apply/{token}"


def _company_snapshot(company: Company) -> dict:
    return {
        "company_name": company.name,
        "company_dot": company.dot_number or "",
        "company_mc": company.mc_number or "",
        "company_address": company.address_street,
        "company_city": company.address_city,
        "company_state": company.address_state,
        "company_zip": company.address_zip,
        "company_phone": company.phone or "",
        "company_email": company.email,
        "company_fax": company.fax,
    }


def _to_response(app: DriverApplication, driver: Optional[Driver]) -> ApplicationResponse:
    return ApplicationResponse(
        id=app.id,
        access_token=app.access_token,
        apply_url=_apply_url(app.access_token),
        status=app.status,
        company_id=app.company_id,
        driver_id=app.driver_id,
        driver_is_owner=app.driver_is_owner,
        pdf_status=app.pdf_status,
        pdf_error=app.pdf_error,
        submitted_at=app.submitted_at,
        pdf_generated_at=app.pdf_generated_at,
        created_at=app.created_at,
        updated_at=app.updated_at,
        expires_at=app.expires_at,
        manager_config=app.manager_config,
        driver=DriverSummary.model_validate(driver) if driver else None,
    )


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    body: ApplicationCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ApplicationResponse:
    company = session.get(Company, body.company_id)
    if not company:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Company not found")

    driver: Optional[Driver] = None
    if body.driver_id is not None:
        driver = session.get(Driver, body.driver_id)
        if not driver:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Driver not found")
        if driver.company_id != company.id:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="Driver does not belong to the selected company",
            )

    merged = {**_company_snapshot(company), **body.settings.model_dump()}
    try:
        config = ManagerConfig(**merged)
    except ValidationError as exc:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=[{"loc": e["loc"], "msg": e["msg"]} for e in exc.errors()],
        )

    application = DriverApplication(
        company_id=company.id,
        created_by_id=current_user.id,
        driver_id=body.driver_id,
        driver_is_owner=body.driver_is_owner,
        manager_config=config.model_dump(),
        expires_at=body.expires_at,
    )
    session.add(application)
    session.commit()
    session.refresh(application)
    return _to_response(application, driver)


@router.get("", response_model=List[ApplicationListItem])
def list_applications(
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
    status_filter: Optional[str] = Query(default=None, alias="status"),
    company_id: Optional[int] = None,
) -> List[ApplicationListItem]:
    stmt = select(DriverApplication)
    if status_filter:
        stmt = stmt.where(DriverApplication.status == status_filter)
    if company_id is not None:
        stmt = stmt.where(DriverApplication.company_id == company_id)
    apps = session.exec(stmt).all()
    return [
        ApplicationListItem(
            id=a.id,
            access_token=a.access_token,
            apply_url=_apply_url(a.access_token),
            status=a.status,
            company_id=a.company_id,
            driver_id=a.driver_id,
            driver_is_owner=a.driver_is_owner,
            pdf_status=a.pdf_status,
            created_at=a.created_at,
            expires_at=a.expires_at,
        )
        for a in apps
    ]


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> ApplicationResponse:
    application = session.get(DriverApplication, application_id)
    if not application:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Application not found")
    driver = session.get(Driver, application.driver_id) if application.driver_id else None
    return _to_response(application, driver)


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
def update_status(
    application_id: int,
    body: ApplicationStatusUpdate,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> ApplicationResponse:
    application = session.get(DriverApplication, application_id)
    if not application:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Application not found")
    application.status = body.status
    session.add(application)
    session.commit()
    session.refresh(application)
    driver = session.get(Driver, application.driver_id) if application.driver_id else None
    return _to_response(application, driver)


@router.post("/{application_id}/countersign", response_model=ApplicationResponse)
def countersign(
    application_id: int,
    body: CounterSignRequest,
    background_tasks: BackgroundTasks,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> ApplicationResponse:
    """Manager counter-signs (company/carrier side): stores the signature,
    approves the application, and regenerates the PDF with BOTH signatures."""
    application = session.get(DriverApplication, application_id)
    if not application:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Application not found")
    if application.answers is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="The driver has not submitted this application yet.",
        )
    application.manager_signature = {
        "image_base64": body.image_base64,
        "signer_first_name": body.signer_first_name,
        "timestamp_et": body.timestamp_et,
        "date": body.date,
    }
    application.manager_signed_at = datetime.now(timezone.utc)
    application.status = "approved"
    application.pdf_status = "generating"
    application.pdf_error = None
    session.add(application)
    session.commit()
    session.refresh(application)
    background_tasks.add_task(generate_application_pdf, application.id)
    driver = session.get(Driver, application.driver_id) if application.driver_id else None
    return _to_response(application, driver)


@router.post("/{application_id}/regenerate-pdf", response_model=ApplicationResponse)
def regenerate_pdf(
    application_id: int,
    background_tasks: BackgroundTasks,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> ApplicationResponse:
    """Re-run PDF generation from the driver's already-saved answers.

    Use when generation failed for a server-side reason (e.g. a template/tooling
    issue) — the driver does NOT need to re-fill anything.
    """
    application = session.get(DriverApplication, application_id)
    if not application:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Application not found")
    if application.answers is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="The driver has not submitted this application yet.",
        )
    application.pdf_status = "generating"
    application.pdf_error = None
    session.add(application)
    session.commit()
    session.refresh(application)
    background_tasks.add_task(generate_application_pdf, application.id)
    driver = session.get(Driver, application.driver_id) if application.driver_id else None
    return _to_response(application, driver)


def _mask_tail(value, keep: int = 4, prefix: str = "••••") -> str:
    s = str(value or "")
    return prefix + s[-keep:] if len(s) > keep else s


def _sanitize_answers(answers: dict) -> dict:
    """Return the driver's submitted answers with sensitive fields masked and
    raw signature images dropped — safe to show a logged-in manager."""
    a = copy.deepcopy(answers or {})
    if isinstance(a.get("ssn"), str):
        a["ssn"] = _mask_tail(a["ssn"], 4, "•••-••-")
    banking = a.get("banking")
    if isinstance(banking, dict):
        for k in ("account_number", "routing_number"):
            if k in banking:
                banking[k] = _mask_tail(banking[k])
    w9 = a.get("w9")
    if isinstance(w9, dict) and "tin" in w9:
        w9["tin"] = _mask_tail(w9["tin"], 4, "•••••")
    sigs = a.get("signatures")
    if isinstance(sigs, dict):
        # Keep only which sections were signed (drop base64 image data).
        a["signatures"] = {k: True for k in sigs}
    return a


@router.get("/{application_id}/answers", response_model=dict)
def get_application_answers(
    application_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> dict:
    application = session.get(DriverApplication, application_id)
    if not application:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Application not found")
    if application.answers is None:
        return {}
    return _sanitize_answers(application.answers.answers or {})


@router.get("/{application_id}/pdf")
def download_pdf(
    application_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> FileResponse:
    application = session.get(DriverApplication, application_id)
    if not application:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Application not found")
    if application.pdf_status != "ready" or not application.pdf_path or not os.path.exists(application.pdf_path):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"PDF not available (status: {application.pdf_status})",
        )
    return FileResponse(
        application.pdf_path,
        media_type="application/pdf",
        filename=f"application_{application_id}.pdf",
    )
