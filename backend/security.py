"""
Authentication primitives: password hashing (bcrypt) and JWT access tokens (PyJWT).

These are foundation utilities consumed by the auth router in the API phase.
Secrets are read lazily from the environment so importing this module is safe
even before configuration is loaded.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import bcrypt
import jwt

ALGORITHM = "HS256"
_DEFAULT_TOKEN_EXPIRE_MINUTES = 60


# --- Passwords ---------------------------------------------------------------

def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt (per-hash random salt)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Check a plaintext password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# --- JWT ---------------------------------------------------------------------

def _secret() -> str:
    secret = os.getenv("SECRET_KEY")
    if not secret:
        raise RuntimeError("SECRET_KEY is not set; cannot issue or verify JWTs.")
    return secret


def _expire_minutes() -> int:
    return int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(_DEFAULT_TOKEN_EXPIRE_MINUTES)))


def create_access_token(subject: Any, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT carrying `sub` and an expiry claim."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=_expire_minutes())
    )
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, _secret(), algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT; raises jwt.PyJWTError on invalid/expired tokens."""
    return jwt.decode(token, _secret(), algorithms=[ALGORITHM])
