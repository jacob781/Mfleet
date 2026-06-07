"""Shared rate limiter instance.

Defined in its own module so both the FastAPI app (main.py) and the routers
use the same Limiter without a circular import.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
