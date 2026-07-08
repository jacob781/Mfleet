"""Authentication router: login (JWT), current user, admin-only user management.

No public registration — the first admin is seeded, and admins create further
accounts via POST /api/auth/users.
"""

from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

import security
from database import get_session
from dependencies import get_current_admin, get_current_user
from models import User
from rate_limit import limiter
from schemas import (
    AdminPasswordReset,
    PasswordChange,
    Token,
    UserCreate,
    UserResponse,
    UserUpdate,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

_INVALID_CREDENTIALS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Incorrect email or password",
    headers={"WWW-Authenticate": "Bearer"},
)


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Annotated[Session, Depends(get_session)],
) -> Token:
    # username field carries the email.
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise _INVALID_CREDENTIALS
    if not user.is_active:
        raise _INVALID_CREDENTIALS
    return Token(access_token=security.create_access_token(subject=user.id))


@router.get("/me", response_model=UserResponse)
def read_current_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    return current_user


@router.get("/file-token", response_model=Token)
def issue_file_token(
    current_user: Annotated[User, Depends(get_current_user)],
) -> Token:
    """Mint a short-lived, file-scoped token so the UI can open a document directly
    in a new tab (reload re-hits the server for the current file, no stale blob)."""
    return Token(access_token=security.create_file_token(subject=current_user.id))


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    session: Annotated[Session, Depends(get_session)],
    _admin: Annotated[User, Depends(get_current_admin)],
) -> User:
    existing = session.exec(select(User).where(User.email == user_in.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )
    user = User(
        email=user_in.email,
        hashed_password=security.hash_password(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.get("/users", response_model=List[UserResponse])
def list_users(
    session: Annotated[Session, Depends(get_session)],
    _admin: Annotated[User, Depends(get_current_admin)],
) -> List[User]:
    return list(session.exec(select(User)).all())


def _active_admin_count(session: Session, exclude_id: int | None = None) -> int:
    stmt = select(User).where(User.role == "admin", User.is_active == True)  # noqa: E712
    admins = [u for u in session.exec(stmt).all() if u.id != exclude_id]
    return len(admins)


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UserUpdate,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[User, Depends(get_current_admin)],
) -> User:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")
    data = body.model_dump(exclude_unset=True)
    # Guard: don't let the last active admin demote/deactivate themselves into lockout.
    would_remove_admin = (data.get("role") == "manager") or (data.get("is_active") is False)
    if user.role == "admin" and would_remove_admin and _active_admin_count(session, exclude_id=user.id) == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Cannot remove the last active admin")
    for key, value in data.items():
        setattr(user, key, value)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[User, Depends(get_current_admin)],
) -> None:
    if user_id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account")
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.role == "admin" and _active_admin_count(session, exclude_id=user.id) == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Cannot delete the last active admin")
    session.delete(user)
    session.commit()


@router.post("/users/{user_id}/password", status_code=status.HTTP_204_NO_CONTENT)
def admin_reset_password(
    user_id: int,
    body: AdminPasswordReset,
    session: Annotated[Session, Depends(get_session)],
    _admin: Annotated[User, Depends(get_current_admin)],
) -> None:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")
    user.hashed_password = security.hash_password(body.new_password)
    session.add(user)
    session.commit()


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_my_password(
    body: PasswordChange,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    if not security.verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    current_user.hashed_password = security.hash_password(body.new_password)
    session.add(current_user)
    session.commit()
