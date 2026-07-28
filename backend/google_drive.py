"""Upload the signed contract to Google Drive after counter-signing.

Uses the stored refresh token (per-upload access token) and the Drive REST API
directly via `requests` — no Google client library. Scope is `drive.file`, so the
app only ever sees/manages the folders and files it created itself (idempotent).

Folder structure (under the account's My Drive, or GOOGLE_DRIVE_FOLDER_ID if set):
    Mfleet / <Company> / <Last, First> — app #<id> / contract_app_<id>.pdf
"""

import json
import os

import requests
from sqlmodel import Session

import google_oauth
from database import get_engine
from models import Company, Driver, DriverApplication, GoogleAccount

FILES_URL = "https://www.googleapis.com/drive/v3/files"
UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files"
FOLDER_MIME = "application/vnd.google-apps.folder"


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _esc(name: str) -> str:
    # Escape backslash + single quote for the Drive `q` query string.
    return name.replace("\\", "\\\\").replace("'", "\\'")


def ensure_folder(token: str, name: str, parent_id: str | None) -> str:
    """Find the folder by name (under parent) or create it. Returns its id.
    With drive.file scope the search only matches folders this app created."""
    q = f"mimeType='{FOLDER_MIME}' and name='{_esc(name)}' and trashed=false"
    if parent_id:
        q += f" and '{parent_id}' in parents"
    r = requests.get(FILES_URL, headers=_headers(token),
                     params={"q": q, "fields": "files(id,name)", "spaces": "drive"}, timeout=20)
    r.raise_for_status()
    found = r.json().get("files", [])
    if found:
        return found[0]["id"]
    meta = {"name": name, "mimeType": FOLDER_MIME}
    if parent_id:
        meta["parents"] = [parent_id]
    r = requests.post(FILES_URL, headers=_headers(token), json=meta, timeout=20)
    r.raise_for_status()
    return r.json()["id"]


def _find_file(token: str, name: str, parent_id: str) -> str | None:
    q = f"name='{_esc(name)}' and '{parent_id}' in parents and trashed=false"
    r = requests.get(FILES_URL, headers=_headers(token),
                     params={"q": q, "fields": "files(id)", "spaces": "drive"}, timeout=20)
    r.raise_for_status()
    found = r.json().get("files", [])
    return found[0]["id"] if found else None


def upload_file(token: str, path: str, name: str, parent_id: str, mime: str = "application/pdf") -> str:
    """Create the file, or replace its content if one with the same name exists
    in this folder (so re-uploads don't pile up duplicates)."""
    existing = _find_file(token, name, parent_id)
    with open(path, "rb") as f:
        if existing:  # PATCH media of the existing file — keeps id/link, drops old content
            r = requests.patch(f"{UPLOAD_URL}/{existing}", headers={**_headers(token), "Content-Type": mime},
                               params={"uploadType": "media"}, data=f, timeout=120)
            r.raise_for_status()
            return existing
        meta = {"name": name, "parents": [parent_id]}
        parts = {
            "metadata": ("metadata", json.dumps(meta), "application/json"),
            "file": (name, f, mime),
        }
        r = requests.post(UPLOAD_URL, headers=_headers(token),
                         params={"uploadType": "multipart"}, files=parts, timeout=120)
    r.raise_for_status()
    return r.json()["id"]


def upload_application(application_id: int) -> None:
    """Mirror an approved application's signed PDF into the Drive folder tree.
    No-op (returns) if Drive isn't connected or the PDF is missing."""
    with Session(get_engine()) as session:
        acct = session.get(GoogleAccount, 1)
        if not acct or not acct.refresh_token:
            return  # Drive not connected — silently skip
        app = session.get(DriverApplication, application_id)
        if not app or not app.pdf_path or not os.path.exists(app.pdf_path):
            return
        company = session.get(Company, app.company_id)
        driver = session.get(Driver, app.driver_id) if app.driver_id else None
        pdf_path = app.pdf_path
        company_name = company.name if company else f"company_{app.company_id}"
        label = (
            f"{driver.last_name}, {driver.first_name} — app #{app.id}"
            if driver else f"app #{app.id}"
        )
        refresh_token = acct.refresh_token

    token = google_oauth.get_access_token(refresh_token)
    root = acct.drive_folder_id or os.getenv("GOOGLE_DRIVE_FOLDER_ID") or None
    mfleet = ensure_folder(token, "Mfleet", root)
    comp = ensure_folder(token, company_name, mfleet)
    folder = ensure_folder(token, label, comp)
    upload_file(token, pdf_path, f"contract_app_{application_id}.pdf", folder)
