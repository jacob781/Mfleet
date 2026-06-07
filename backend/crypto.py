"""
Field-level encryption for sensitive data at rest (SSN, banking, form drafts).

Uses Fernet (AES-128-CBC + HMAC) with a key supplied via the
FIELD_ENCRYPTION_KEY environment variable. The key is read lazily so importing
this module never fails — only actual encrypt/decrypt operations require it.

Generate a key with:
    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""

import json
import os
from typing import Any, Optional

from cryptography.fernet import Fernet
from sqlalchemy.types import Text, TypeDecorator

_fernet: Optional[Fernet] = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        key = os.getenv("FIELD_ENCRYPTION_KEY")
        if not key:
            raise RuntimeError(
                "FIELD_ENCRYPTION_KEY is not set; cannot encrypt/decrypt sensitive data."
            )
        try:
            _fernet = Fernet(key.encode("utf-8") if isinstance(key, str) else key)
        except (ValueError, TypeError) as exc:
            raise RuntimeError(
                "FIELD_ENCRYPTION_KEY is invalid; expected a url-safe base64 32-byte Fernet key."
            ) from exc
    return _fernet


def encrypt(value: str) -> str:
    """Encrypt a plaintext string into a Fernet token (str)."""
    return _get_fernet().encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt(token: str) -> str:
    """Decrypt a Fernet token back into the original plaintext string."""
    return _get_fernet().decrypt(token.encode("utf-8")).decode("utf-8")


class EncryptedString(TypeDecorator):
    """SQLAlchemy column type that transparently encrypts/decrypts a string."""

    impl = Text
    cache_ok = True

    def process_bind_param(self, value: Optional[str], dialect) -> Optional[str]:
        if value is None:
            return None
        return encrypt(str(value))

    def process_result_value(self, value: Optional[str], dialect) -> Optional[str]:
        if value is None:
            return None
        return decrypt(value)


class EncryptedJSON(TypeDecorator):
    """SQLAlchemy column type that stores a JSON-serializable value encrypted.

    Serializes to JSON, encrypts the JSON text, and stores it as Text. Use for
    sensitive structured data (e.g. the driver's in-progress form answers, which
    contain SSN and banking details).
    """

    impl = Text
    cache_ok = True

    def process_bind_param(self, value: Optional[Any], dialect) -> Optional[str]:
        if value is None:
            return None
        return encrypt(json.dumps(value, default=str))

    def process_result_value(self, value: Optional[str], dialect) -> Optional[Any]:
        if value is None:
            return None
        return json.loads(decrypt(value))
