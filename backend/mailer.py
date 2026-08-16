"""Tiny SMTP helper reusing the MAIL_* env already used by the contact form.
Supports optional file attachments (used for employer verification packets)."""

import os
import smtplib
from email.message import EmailMessage
from pathlib import Path

import logs

log = logs.setup("mfleet.mail")


def send_mail(to_addr: str | None, subject: str, body: str,
              attachments: list[str] | None = None, message_id: str | None = None,
              from_label: str = "Mfleet", reply_to: str | None = None) -> bool:
    sender = os.getenv("MAIL_USERNAME")
    password = os.getenv("MAIL_PASSWORD")
    server = os.getenv("MAIL_SERVER")
    port = int(os.getenv("MAIL_PORT", 587))
    if not (sender and password and server and to_addr):
        print("send_mail: missing MAIL_* settings or recipient — skipped")
        return False

    msg = EmailMessage()
    msg["From"] = f"{from_label} <{sender}>"
    msg["To"] = to_addr
    msg["Subject"] = subject
    if reply_to:
        msg["Reply-To"] = reply_to
    if message_id:
        msg["Message-ID"] = message_id  # so replies (In-Reply-To/References) can be matched
    msg.set_content(body)

    for path in attachments or []:
        p = Path(path)
        if not p.exists():
            continue
        msg.add_attachment(
            p.read_bytes(),
            maintype="application", subtype="pdf", filename=p.name,
        )

    try:
        with smtplib.SMTP(server, port) as s:
            s.starttls()
            s.login(sender, password)
            s.send_message(msg)
        return True
    except Exception as exc:  # noqa: BLE001 - best-effort, never fatal
        log.warning("send_mail failed: %s", exc)
        return False
