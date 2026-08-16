"""Daily job for employer verification packets:

1. Reply detection — scans the connected Gmail inbox for our subject token
   [MFLEET-EV-<id>] and marks those rows received (stops resending).
2. Auto-resend — rows still unanswered after RESEND_AFTER_DAYS and under
   MAX_ATTEMPTS get re-sent (recorded as a "System" attempt).

Run daily (or hourly for faster reply detection):
    python employer_followups.py
"""

import os
from datetime import datetime, timedelta, timezone
from email.utils import parseaddr, parsedate_to_datetime

import requests
from dotenv import load_dotenv
from sqlmodel import Session, select

import google_oauth
import logs
from database import get_engine
from models import DriverApplication, EmployerVerification, GoogleAccount
from routers.employers import send_packet

log = logs.setup("mfleet.followups")

RESEND_AFTER_DAYS = 7
MAX_ATTEMPTS = 3
GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me/messages"
THREADS = "https://gmail.googleapis.com/gmail/v1/users/me/threads"


def _find_reply(hdr: dict, message_ids: list[str], our_email: str):
    """Given our sent Message-IDs, find an inbound reply in the same Gmail thread.
    Returns (from_email, received_datetime) or None. Matches by exact rfc822msgid →
    threadId → any message in the thread NOT from us."""
    for mid in message_ids:
        clean = mid.strip().strip("<>")
        r = requests.get(GMAIL, headers=hdr, params={"q": f"rfc822msgid:{clean}"}, timeout=20)
        if r.status_code != 200 or not r.json().get("messages"):
            continue
        thread_id = r.json()["messages"][0].get("threadId")
        if not thread_id:
            continue
        t = requests.get(f"{THREADS}/{thread_id}", headers=hdr,
                        params={"format": "metadata", "metadataHeaders": ["From", "Date"]}, timeout=20)
        if t.status_code != 200:
            continue
        for m in t.json().get("messages", []):
            headers = m.get("payload", {}).get("headers", [])
            frm = next((h["value"] for h in headers if h["name"].lower() == "from"), "")
            addr = parseaddr(frm)[1].lower()
            if addr and addr != our_email:               # inbound reply (not our own message)
                date = next((h["value"] for h in headers if h["name"].lower() == "date"), "")
                try:
                    when = parsedate_to_datetime(date)
                except Exception:  # noqa: BLE001
                    when = datetime.now(timezone.utc)
                return parseaddr(frm)[1], when
    return None


def _poll_replies(session: Session) -> int:
    """Mark rows received when the employer has replied (matched by Message-ID thread)."""
    acct = session.get(GoogleAccount, 1)
    if not acct or not acct.refresh_token:
        return 0
    try:
        token = google_oauth.get_access_token(acct.refresh_token)
    except Exception as exc:  # noqa: BLE001
        log.warning("gmail: token refresh failed: %s", exc)
        return 0
    hdr = {"Authorization": f"Bearer {token}"}
    our_email = (acct.account_email or os.getenv("MAIL_USERNAME") or "").lower()
    rows = session.exec(
        select(EmployerVerification).where(EmployerVerification.received_at == None)  # noqa: E711
    ).all()
    marked = 0
    for ev in rows:
        mids = [a.get("message_id") for a in (ev.attempts or []) if a.get("message_id")]
        if not mids:
            continue
        reply = _find_reply(hdr, mids, our_email)
        if reply:
            ev.received_from, ev.received_at = reply
            ev.status = "received"
            session.add(ev)
            marked += 1
    if marked:
        session.commit()
    return marked


def _auto_resend(session: Session) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=RESEND_AFTER_DAYS)
    rows = session.exec(
        select(EmployerVerification).where(
            EmployerVerification.status == "sent",
            EmployerVerification.received_at == None,  # noqa: E711
        )
    ).all()
    sent = 0
    for ev in rows:
        if len(ev.attempts or []) >= MAX_ATTEMPTS or not ev.email:
            continue
        if ev.sent_at and ev.sent_at > cutoff:   # sent recently — not due yet
            continue
        app = session.get(DriverApplication, ev.application_id)
        if app is None:
            continue
        try:
            if send_packet(app, ev, session, by="System"):
                sent += 1
        except Exception as exc:  # noqa: BLE001
            log.warning("resend EV %s failed: %s", ev.id, exc)
    return sent


def main() -> int:
    load_dotenv()
    with Session(get_engine()) as session:
        marked = _poll_replies(session)
        resent = _auto_resend(session)
    log.info("replies marked received: %s; packets resent: %s", marked, resent)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
