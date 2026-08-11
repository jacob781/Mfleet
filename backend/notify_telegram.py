"""Expiry reminders posted into the drivers' Telegram groups.

Called from notify_expiring.py so one nightly cron covers both the manager email
and the driver-facing reminders. Reuses collect_alerts — the bell, the digest and
the bot therefore always agree on what is expiring.

A driver is reached through TelegramLink.home_chat_id (the group he registered in),
so being a member of several groups still yields exactly one message.
"""

from typing import Dict, List, Tuple

from sqlmodel import Session, select

import telegram
from models import TG_LINKED, Driver, TelegramLink, TruckDriver

# The alert lives for 30 days but the cron runs daily, so only speak up on these
# marks. Expired documents nag weekly.
# ponytail: no per-document state table — a skipped cron run silently skips that
# mark. Add a `last_sent_on` row if that ever matters.
THRESHOLDS = {30, 14, 7, 3, 1, 0}

# Driver-facing Russian labels; DOC_TYPES values are the internal English ones.
LABELS = {
    "CDL": "коммерческие водительские права (CDL)",
    "Medical Cert": "медицинская справка",
    "Annual Inspection": "годовой техосмотр трака",
    "Registration": "регистрация трака (cab card)",
}


def is_due(days_left: int | None) -> bool:
    """True on the days we actually message. `None` = a document never uploaded;
    those are the manager's problem and stay out of the group."""
    if days_left is None:
        return False
    if days_left >= 0:
        return days_left in THRESHOLDS
    return -days_left % 7 == 0


def _phrase(days_left: int) -> str:
    if days_left < 0:
        return f"просрочен {-days_left} дн. назад"
    if days_left == 0:
        return "истекает сегодня"
    return f"истекает через {days_left} дн."


def _driver_ids(session: Session, alert) -> List[int]:
    """Whom this alert concerns. A truck's documents are the business of everyone
    driving it — team drivers included."""
    if alert.subject_kind == "driver" and alert.driver_id:
        return [alert.driver_id]
    if alert.subject_kind == "truck" and alert.truck_id:
        return list(session.exec(
            select(TruckDriver.driver_id).where(TruckDriver.truck_id == alert.truck_id)
        ).all())
    return []   # company owner licence — the manager's business, email only


def build_messages(session: Session, alerts) -> Dict[Tuple[int, int, str], List[str]]:
    """Group the due alerts per (chat, telegram user, display name) so a driver with
    three expiring documents gets one message instead of three."""
    links = {
        l.driver_id: l for l in session.exec(
            select(TelegramLink).where(
                TelegramLink.status == TG_LINKED,
                TelegramLink.driver_id.is_not(None),
                TelegramLink.home_chat_id.is_not(None),
            )
        ).all()
    }
    out: Dict[Tuple[int, int, str], List[str]] = {}
    for alert in alerts:
        if not is_due(alert.days_left):
            continue
        for driver_id in _driver_ids(session, alert):
            link = links.get(driver_id)
            if link is None:
                continue   # not registered in Telegram yet — the email digest still lists him
            drv = session.get(Driver, driver_id)
            name = f"{drv.first_name} {drv.last_name}".strip() if drv else (link.tg_name or "водитель")
            label = LABELS.get(alert.document_type, alert.document_type)
            line = (
                f"• {label} — {alert.expiry_date.strftime('%m/%d/%Y')} "
                f"({_phrase(alert.days_left)})"
            )
            out.setdefault((link.home_chat_id, link.tg_user_id, name), []).append(line)
    return out


def send_reminders(session: Session, alerts, dry_run: bool = False) -> int:
    """Post one message per driver. Returns how many were sent (or would be)."""
    sent = 0
    for (chat_id, tg_user_id, name), lines in build_messages(session, alerts).items():
        head = telegram.mention(tg_user_id, name) + ", напоминание о документах:"
        text = head + "\n" + "\n".join(telegram.escape(l) for l in lines)
        if dry_run:
            print(f"[{chat_id}] {text}")
            sent += 1
            continue
        if telegram.send(chat_id, text) is not None:
            sent += 1
    return sent
