"""Per-application employer verification packets: list (seeded from the driver's
employment history), edit the employer email, preview the packet, and email it."""

import os
from datetime import datetime, timezone
from email.utils import make_msgid
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlmodel import Session, select

import pdf_service
from database import get_session
from dependencies import get_current_user, get_current_user_file
from mailer import send_mail
from models import DriverApplication, EmployerVerification, User
from schemas import EmployerEmailUpdate, EmployerVerificationResponse

router = APIRouter(prefix="/api/applications/{application_id}/employers", tags=["Employer Verification"])


def _answers(app: DriverApplication) -> dict:
    return (app.answers.answers if app.answers else {}) or {}


def _to_resp(ev: EmployerVerification, history: list) -> EmployerVerificationResponse:
    r = EmployerVerificationResponse.model_validate(ev)
    item = history[ev.employer_index] if 0 <= ev.employer_index < len(history) else {}
    r.phone = (item or {}).get("employer_phone")
    r.has_file = bool(ev.file_path) and os.path.exists(ev.file_path)
    return r


def _load(application_id: int, session: Session) -> DriverApplication:
    app = session.get(DriverApplication, application_id)
    if not app:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app


def _get_ev(application_id: int, ev_id: int, session: Session) -> EmployerVerification:
    ev = session.get(EmployerVerification, ev_id)
    if not ev or ev.application_id != application_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Employer entry not found")
    return ev


@router.get("", response_model=List[EmployerVerificationResponse])
def list_employers(
    application_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> List[EmployerVerificationResponse]:
    """One row per prior employer, seeded from employment_history on first access."""
    app = _load(application_id, session)
    history = _answers(app).get("employment_history") or []
    existing = {
        ev.employer_index: ev
        for ev in session.exec(
            select(EmployerVerification).where(EmployerVerification.application_id == application_id)
        ).all()
    }
    rows = []
    for i, item in enumerate(history):
        ev = existing.get(i)
        if ev is None:
            ev = EmployerVerification(
                application_id=application_id,
                employer_index=i,
                employer_name=(item or {}).get("employer_name"),
            )
            session.add(ev)
        rows.append(ev)
    if any(i not in existing for i in range(len(history))):
        session.commit()
        for ev in rows:
            session.refresh(ev)
    return [_to_resp(ev, history) for ev in sorted(rows, key=lambda e: e.employer_index)]


@router.patch("/{ev_id}", response_model=EmployerVerificationResponse)
def update_employer_email(
    application_id: int,
    ev_id: int,
    body: EmployerEmailUpdate,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> EmployerVerificationResponse:
    app = _load(application_id, session)
    ev = _get_ev(application_id, ev_id, session)
    ev.email = body.email
    session.add(ev)
    session.commit()
    session.refresh(ev)
    return _to_resp(ev, _answers(app).get("employment_history") or [])


def _build_packet(app: DriverApplication, ev: EmployerVerification, session: Session,
                  attempts: list | None = None) -> str:
    """(Re)generate the packet PDF — always fresh, since the attempts log changes."""
    try:
        path = pdf_service.generate_employer_packet(
            app, _answers(app), ev.employer_index,
            attempts if attempts is not None else (ev.attempts or []), ev.received_at,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Could not build packet: {exc}")
    ev.file_path = str(path)
    session.add(ev)
    session.commit()
    return ev.file_path


@router.get("/{ev_id}/pdf")
def employer_packet_pdf(
    application_id: int,
    ev_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user_file)],
) -> FileResponse:
    app = _load(application_id, session)
    ev = _get_ev(application_id, ev_id, session)
    path = _build_packet(app, ev, session)
    return FileResponse(path, media_type="application/pdf",
                        filename=f"employer_verification_{application_id}_{ev.employer_index}.pdf",
                        content_disposition_type="inline")


def _full_name(answers: dict) -> str:
    parts = [answers.get("first_name", ""), answers.get("middle_name", ""), answers.get("last_name", "")]
    return " ".join(p for p in parts if p).strip() or "the applicant"


def send_packet(app: DriverApplication, ev: EmployerVerification, session: Session, by: str) -> bool:
    """Record an attempt, render the packet with it, and email it. A unique Message-ID
    is stored on the attempt so the Gmail poller can match the employer's reply by its
    In-Reply-To/References (no visible token). Persists the attempt only on success.
    Shared by the manual Send endpoint and the auto-resend job."""
    if not ev.email:
        return False
    answers = _answers(app)
    name = _full_name(answers)
    message_id = make_msgid(domain="mfleet.org")
    attempt = {
        "date": datetime.now(timezone.utc).strftime("%m/%d/%Y"),
        "method": "Email",
        "destination": ev.email,
        "by": by,
        "message_id": message_id,
    }
    pending = list(ev.attempts or []) + [attempt]
    path = _build_packet(app, ev, session, attempts=pending)

    ok = send_mail(
        ev.email,
        f"Employment Verification for {name}",
        "Good day!\n\n"
        "I hope this email finds you well. I am writing regarding employment verification "
        f"for your former employee {name}. Could you please review and complete the attached "
        "form at your earliest convenience?\n\n"
        "Thank you.\nMfleet LLC\n",
        attachments=[path],
        message_id=message_id,
    )
    if not ok:
        return False
    ev.attempts = pending  # reassign so JSONB change is detected
    ev.status = "received" if ev.received_at else "sent"
    ev.sent_at = datetime.now(timezone.utc)
    session.add(ev)
    session.commit()
    return True


@router.post("/{ev_id}/send", response_model=EmployerVerificationResponse)
def send_employer_packet(
    application_id: int,
    ev_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> EmployerVerificationResponse:
    app = _load(application_id, session)
    ev = _get_ev(application_id, ev_id, session)
    if not ev.email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Add the employer's email first")
    if not send_packet(app, ev, session, user.full_name or user.email):
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail="Email could not be sent (check MAIL_* settings)")
    session.refresh(ev)
    return _to_resp(ev, _answers(app).get("employment_history") or [])


@router.post("/{ev_id}/received", response_model=EmployerVerificationResponse)
def mark_received(
    application_id: int,
    ev_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> EmployerVerificationResponse:
    """Manually mark the employer's reply as received (stops auto-resend)."""
    app = _load(application_id, session)
    ev = _get_ev(application_id, ev_id, session)
    ev.received_at = datetime.now(timezone.utc)
    ev.status = "received"
    session.add(ev)
    session.commit()
    session.refresh(ev)
    return _to_resp(ev, _answers(app).get("employment_history") or [])
