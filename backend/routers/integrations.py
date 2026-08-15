"""Admin integrations: Google Drive OAuth connect/disconnect/status.

The connection is app-wide (a single Google account). An admin connects once;
the refresh token is stored encrypted and reused indefinitely. If it ever breaks
(revoked / expired), the admin reconnects from the Settings page.
"""

import os
import secrets
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlmodel import Session

import google_oauth
import motus
from database import get_session
from dependencies import get_current_admin, get_current_user
from models import GoogleAccount, User
from schemas import MotusLookupResponse

router = APIRouter(prefix="/api/integrations/google", tags=["Integrations"])
motus_router = APIRouter(prefix="/api/integrations/motus", tags=["Integrations"])


def _singleton(session: Session) -> GoogleAccount:
    row = session.get(GoogleAccount, 1)
    if row is None:
        row = GoogleAccount(id=1)
        session.add(row)
        session.commit()
        session.refresh(row)
    return row


@router.get("/status")
def google_status(
    session: Annotated[Session, Depends(get_session)],
    _admin: Annotated[User, Depends(get_current_admin)],
) -> dict:
    row = session.get(GoogleAccount, 1)
    return {
        "configured": google_oauth.is_configured(),  # client id/secret/redirect in env
        "connected": bool(row and row.refresh_token),
        "email": row.account_email if row else None,
        "connected_at": row.connected_at.isoformat() if row and row.connected_at else None,
        "drive_folder_id": row.drive_folder_id if row else None,
    }


@router.post("/connect")
def google_connect(
    session: Annotated[Session, Depends(get_session)],
    _admin: Annotated[User, Depends(get_current_admin)],
) -> dict:
    if not google_oauth.is_configured():
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Google client is not configured (set GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI).",
        )
    row = _singleton(session)
    state = secrets.token_urlsafe(24)
    row.pending_state = state
    session.add(row)
    session.commit()
    return {"auth_url": google_oauth.build_auth_url(state)}


@router.get("/callback")
def google_callback(
    state: str,
    session: Annotated[Session, Depends(get_session)],
    code: str | None = None,
    error: str | None = None,
) -> RedirectResponse:
    """Google redirects the browser here after consent. No auth dependency — this is
    guarded by the one-time `state`. On success we store the refresh token."""
    base = os.getenv("FRONTEND_BASE_URL", "")
    done = f"{base}/admin/settings"
    row = session.get(GoogleAccount, 1)
    # Validate the CSRF state regardless of outcome.
    if row is None or not row.pending_state or not secrets.compare_digest(state, row.pending_state):
        return RedirectResponse(f"{done}?google=error", status_code=303)
    row.pending_state = None
    if error or not code:
        session.add(row)
        session.commit()
        return RedirectResponse(f"{done}?google=error", status_code=303)
    try:
        tokens = google_oauth.exchange_code(code)
        refresh = tokens.get("refresh_token")
        if not refresh:
            # No refresh token (already-granted without prompt=consent): keep the old one.
            raise ValueError("no refresh_token in response")
        email = ""
        if tokens.get("access_token"):
            try:
                email = google_oauth.get_email(tokens["access_token"])
            except Exception:  # noqa: BLE001 - email is cosmetic
                pass
        row.refresh_token = refresh
        row.account_email = email or row.account_email
        row.connected_at = datetime.now(timezone.utc)
        session.add(row)
        session.commit()
        return RedirectResponse(f"{done}?google=connected", status_code=303)
    except Exception:  # noqa: BLE001 - surface failure to the settings page
        session.add(row)
        session.commit()
        return RedirectResponse(f"{done}?google=error", status_code=303)


@router.post("/disconnect")
def google_disconnect(
    session: Annotated[Session, Depends(get_session)],
    _admin: Annotated[User, Depends(get_current_admin)],
) -> dict:
    row = session.get(GoogleAccount, 1)
    if row:
        row.refresh_token = None
        row.account_email = None
        row.connected_at = None
        row.pending_state = None
        session.add(row)
        session.commit()
    return {"connected": False}


@motus_router.get("/lookup", response_model=MotusLookupResponse)
def motus_lookup(
    usdot: str,
    _user: Annotated[User, Depends(get_current_user)],
) -> MotusLookupResponse:
    """Look up a carrier by USDOT number (MOTUS). Used to auto-fill the company form."""
    try:
        data = motus.lookup(usdot)
    except motus.MotusNotFound as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(exc))
    except motus.MotusError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=str(exc))
    return MotusLookupResponse(**data)
