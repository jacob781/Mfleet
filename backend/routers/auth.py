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
from schemas import Token, UserCreate, UserResponse

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
