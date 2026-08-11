"""Daily expiry-reminder digest.

Run by a cron / systemd timer once a day. Collects every driver/truck compliance
document expiring within EXPIRY_SOON_DAYS (or already expired) and emails a single
digest to MAIL_TO, reusing the SMTP settings already in .env. No new dependency, no
in-process scheduler — the web service stays untouched.

Usage:  python notify_expiring.py [--days N] [--dry-run]
"""

import argparse
import os
import sys

from dotenv import load_dotenv
from sqlmodel import Session

import mailer
import notify_telegram
from database import get_engine
from models import EXPIRY_SOON_DAYS
from routers.compliance import collect_alerts


def _format(alerts) -> str:
    lines = ["Documents expiring soon or expired:\n"]
    for a in alerts:
        when = (
            f"expired {-a.days_left}d ago"
            if a.days_left < 0
            else f"expires in {a.days_left}d"
        )
        lines.append(
            f"  [{a.subject_kind}] {a.subject} — {a.document_type}: "
            f"{a.expiry_date.isoformat()} ({when})"
        )
    return "\n".join(lines)


def main() -> int:
    load_dotenv()
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=EXPIRY_SOON_DAYS)
    parser.add_argument("--dry-run", action="store_true", help="print, don't send")
    args = parser.parse_args()

    with Session(get_engine()) as session:
        alerts = collect_alerts(session, args.days)

        if not alerts:
            print("No expiring documents — nothing to send.")
            return 0

        # Drivers hear about their own documents in their Telegram group; the manager
        # gets the full digest by email below either way.
        count = notify_telegram.send_reminders(session, alerts, dry_run=args.dry_run)
        print(f"Telegram: {count} driver reminder(s).")

    body = _format(alerts)
    if args.dry_run:
        print(body)
        return 0

    receiver = os.getenv("MAIL_TO")
    subject = f"Mfleet: {len(alerts)} document(s) need attention"
    if not mailer.send_mail(receiver, subject, body, from_label="Mfleet Alerts"):
        print("Error: failed to send digest (check MAIL_* settings).", file=sys.stderr)
        return 1
    print(f"Sent digest with {len(alerts)} alert(s) to {receiver}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
