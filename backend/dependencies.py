"""Reusable FastAPI dependencies for authentication / authorization."""

from typing import Annotated, Optional

import jwt
from fastapi import Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

import security
from database import get_session
from models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

_credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def _user_from_token(token: Optional[str], session: Session, require_scope: Optional[str] = None) -> User:
    if not token:
        raise _credentials_exception
    try:
        payload = security.decode_access_token(token)
        # Session tokens carry no scope; a file token ("file") must never pass as
        # one — it rides in URLs, so it stays confined to document reads.
        if payload.get("scope") != require_scope:
            raise _credentials_exception
        subject = payload.get("sub")
        if subject is None:
            raise _credentials_exception
        user_id = int(subject)
    except (jwt.PyJWTError, ValueError):
        raise _credentials_exception

    user = session.get(User, user_id)
    if user is None or not user.is_active:
        raise _credentials_exception
    return user


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Annotated[Session, Depends(get_session)],
) -> User:
    """Resolve and validate the current user from a Bearer JWT."""
    return _user_from_token(token, session)


def get_current_user_file(
    session: Annotated[Session, Depends(get_session)],
    header_token: Annotated[Optional[str], Depends(oauth2_scheme_optional)] = None,
    query_token: Annotated[Optional[str], Query(alias="token")] = None,
) -> User:
    """Auth for files opened directly in a browser tab. A download sends the session
    JWT in the Authorization header; a tab navigation can't send headers, so it rides
    a ?token= query param — but that one must be a short-lived, file-scoped token
    (issued by /api/auth/file-token), so a token leaked into a log expires fast and
    only grants document reads. A direct URL is what lets a reload re-hit the server
    for the current file instead of a stale in-memory blob."""
    if header_token:
        return _user_from_token(header_token, session)
    return _user_from_token(query_token, session, require_scope="file")


def get_current_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Require the current user to have the admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user
