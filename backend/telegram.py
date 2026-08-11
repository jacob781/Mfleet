"""Telegram Bot API send helper.

Deliberately plain `requests` and not aiogram: the nightly reminder runs from cron
(notify_expiring.py) and must not depend on the bot process being up. aiogram is
only used by bot.py, which serves the interactive registration.
"""

import os

import requests

API = "https://api.telegram.org/bot{token}/{method}"


def _token() -> str | None:
    return os.getenv("TELEGRAM_BOT_TOKEN")


def call(method: str, **params) -> dict | None:
    """POST to the Bot API. Returns the `result` payload, or None on any failure —
    a reminder that cannot be delivered must never take the digest down with it."""
    token = _token()
    if not token:
        print("telegram: TELEGRAM_BOT_TOKEN not set — skipped")
        return None
    try:
        r = requests.post(API.format(token=token, method=method), json=params, timeout=20)
        data = r.json()
    except Exception as exc:  # noqa: BLE001 - best-effort, never fatal
        print(f"telegram: {method} failed: {exc}")
        return None
    if not data.get("ok"):
        print(f"telegram: {method} rejected: {data.get('description')}")
        return None
    return data.get("result")


def mention(user_id: int, name: str) -> str:
    """Clickable mention that works even when the user has no @username."""
    return f'<a href="tg://user?id={user_id}">{escape(name)}</a>'


def escape(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def send(chat_id: int, text: str, **params) -> dict | None:
    return call("sendMessage", chat_id=chat_id, text=text, parse_mode="HTML", **params)
