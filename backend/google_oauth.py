"""Google OAuth (authorization-code, offline) for the Drive integration.

We persist only the long-lived refresh token; access tokens are fetched on demand
and live in memory. Plain REST via `requests` — no Google client library needed for
the connect flow. The actual Drive upload (folder structure) is a separate step that
will call get_access_token() and the Drive REST API.
"""

import os
from urllib.parse import urlencode

import requests

AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo"

# drive.file = only files this app creates (least privilege); gmail.readonly to detect
# employer replies; email/openid for the connected account label.
SCOPES = (
    "openid email "
    "https://www.googleapis.com/auth/drive.file "
    "https://www.googleapis.com/auth/gmail.readonly"
)


def is_configured() -> bool:
    return bool(os.getenv("GOOGLE_CLIENT_ID") and os.getenv("GOOGLE_CLIENT_SECRET")
                and os.getenv("GOOGLE_REDIRECT_URI"))


def build_auth_url(state: str) -> str:
    params = {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "redirect_uri": os.getenv("GOOGLE_REDIRECT_URI"),
        "response_type": "code",
        "scope": SCOPES,
        "access_type": "offline",      # ask for a refresh token
        "prompt": "consent",           # force refresh_token on every (re)connect
        "include_granted_scopes": "true",
        "state": state,
    }
    return f"{AUTH_ENDPOINT}?{urlencode(params)}"


def exchange_code(code: str) -> dict:
    """Swap the auth code for tokens. Returns the token JSON (access_token,
    refresh_token, expires_in, ...). Raises requests.HTTPError on failure."""
    resp = requests.post(TOKEN_ENDPOINT, data={
        "code": code,
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "redirect_uri": os.getenv("GOOGLE_REDIRECT_URI"),
        "grant_type": "authorization_code",
    }, timeout=15)
    resp.raise_for_status()
    return resp.json()


def get_access_token(refresh_token: str) -> str:
    """Mint a fresh access token from the stored refresh token (called per upload)."""
    resp = requests.post(TOKEN_ENDPOINT, data={
        "refresh_token": refresh_token,
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "grant_type": "refresh_token",
    }, timeout=15)
    resp.raise_for_status()
    return resp.json()["access_token"]


def get_email(access_token: str) -> str:
    resp = requests.get(USERINFO_ENDPOINT,
                        headers={"Authorization": f"Bearer {access_token}"}, timeout=15)
    resp.raise_for_status()
    return resp.json().get("email", "")
