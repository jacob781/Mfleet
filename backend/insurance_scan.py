"""Weekly carrier-insurance re-check against MOTUS.

A carrier's insurance can be cancelled between one look and the next, and nobody
tells us — so once a week every company with a USDOT number is looked up again, the
snapshot on the company record is refreshed, and anything that CHANGED is emailed to
the manager. A run where nothing changed sends nothing.

Being a good guest on somebody else's server is the point here, not speed:

* one lookup at a time, DELAY_SECONDS apart, never in parallel;
* companies checked within STALE_AFTER_DAYS are skipped, so re-running the script
  (or a manager refreshing a company by hand) costs MOTUS nothing;
* MAX_PER_RUN caps a single run no matter how the fleet grows;
* GIVE_UP_AFTER consecutive failures aborts the whole run. If MOTUS is unwell or
  starts refusing us, hammering it is exactly how a block gets earned — the right
  move is to stop and try again next week.

Usage:  python insurance_scan.py [--dry-run] [--all] [--limit N]
"""

import argparse
import os
import random
import sys
import time
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Tuple

from dotenv import load_dotenv
from sqlmodel import Session, select

import logs
import mailer
import motus
from database import get_engine
from models import Company

log = logs.setup("mfleet.insurance")

DELAY_SECONDS = 4.0        # between lookups; jittered so the pattern is not a metronome
MAX_PER_RUN = 250
STALE_AFTER_DAYS = 6       # a weekly cron with a day of slack
GIVE_UP_AFTER = 3          # consecutive failures -> stop the run


def _snapshot(company: Company) -> tuple:
    return (
        company.insurance_status,
        company.insurance_policy_number,
        company.insurance_effective_date,
        company.insurance_max_coverage,
    )


def _describe(before: tuple, after: tuple) -> Optional[str]:
    """One line for the digest, or None when nothing worth reporting changed."""
    was_status, was_policy, _, was_cover = before
    now_status, now_policy, _, now_cover = after
    if was_status == "active" and now_status != "active":
        return "LOST COVERAGE — no active filing at or above the minimum any more"
    if was_status != "active" and now_status == "active":
        return f"now insured — ${(now_cover or 0):,.0f}, policy {now_policy or '—'}"
    if was_status == "active" and now_status == "active":
        if was_policy != now_policy:
            return f"policy replaced: {was_policy or '—'} -> {now_policy or '—'}"
        if (was_cover or 0) != (now_cover or 0):
            return f"coverage changed: ${(was_cover or 0):,.0f} -> ${(now_cover or 0):,.0f}"
    return None


def _apply(company: Company, data: dict) -> None:
    ins = data.get("insurance") or {}
    company.insurance_status = ins.get("status")
    company.insurance_policy_number = ins.get("policy_number")
    eff = ins.get("effective_date")
    company.insurance_effective_date = date.fromisoformat(eff) if eff else None
    cover = ins.get("max_coverage")
    company.insurance_max_coverage = float(cover) if cover is not None else None
    company.insurance_checked_at = datetime.now(timezone.utc)


def due(session: Session, every: bool, limit: int) -> List[Company]:
    """Companies with a USDOT number whose snapshot is old enough to re-check."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=STALE_AFTER_DAYS)
    rows = [c for c in session.exec(select(Company)).all() if (c.dot_number or "").strip()]
    if not every:
        rows = [c for c in rows if c.insurance_checked_at is None or c.insurance_checked_at < cutoff]
    # Oldest first, so an aborted run resumes where it hurt least.
    rows.sort(key=lambda c: c.insurance_checked_at or datetime.min.replace(tzinfo=timezone.utc))
    return rows[:limit]


def scan(session: Session, companies: List[Company], dry_run: bool) -> Tuple[List[str], int, bool]:
    """Look each company up, record the change. Returns (digest lines, checked, aborted)."""
    changes: List[str] = []
    checked = 0
    failures = 0

    for i, company in enumerate(companies):
        if i:
            # Jitter is proportional, so a test can turn the whole wait off with one knob.
            time.sleep(DELAY_SECONDS * random.uniform(1.0, 1.4))
        try:
            data = motus.lookup(company.dot_number)
        except motus.MotusNotFound:
            # Not a transport failure: the DOT number is simply wrong or retired. It
            # says nothing about MOTUS's health, so it does not count toward giving up.
            log.warning("company %s: USDOT %s not found in MOTUS", company.id, company.dot_number)
            continue
        except motus.MotusError as exc:
            failures += 1
            log.warning("company %s: lookup failed (%s) [%d/%d]",
                        company.id, exc, failures, GIVE_UP_AFTER)
            if failures >= GIVE_UP_AFTER:
                log.error("giving up this run after %d consecutive failures", failures)
                return changes, checked, True
            continue

        failures = 0
        before = _snapshot(company)
        _apply(company, data)
        after = _snapshot(company)
        checked += 1
        note = _describe(before, after)
        if note:
            changes.append(f"  {company.name} (USDOT {company.dot_number}): {note}")
            log.info("company %s insurance changed: %s", company.id, note)
        if dry_run:
            session.expunge(company)
        else:
            session.add(company)
            session.commit()

    return changes, checked, False


def main() -> int:
    load_dotenv()
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="look up, print, save nothing")
    parser.add_argument("--all", action="store_true", help="ignore the freshness window")
    parser.add_argument("--limit", type=int, default=MAX_PER_RUN)
    args = parser.parse_args()

    with Session(get_engine()) as session:
        companies = due(session, args.all, min(args.limit, MAX_PER_RUN))
        if not companies:
            log.info("no companies due for an insurance check")
            return 0
        log.info("checking %d compan%s, %.1fs apart",
                 len(companies), "y" if len(companies) == 1 else "ies", DELAY_SECONDS)
        changes, checked, aborted = scan(session, companies, args.dry_run)

    log.info("checked %d, changes %d%s", checked, len(changes), ", ABORTED" if aborted else "")
    if not changes:
        return 1 if aborted else 0

    body = "Carrier insurance changes found in the weekly MOTUS check:\n\n" + "\n".join(changes)
    if args.dry_run:
        print(body)
        return 0

    receiver = os.getenv("MAIL_TO")
    losses = sum(1 for c in changes if "LOST COVERAGE" in c)
    subject = (f"Mfleet: {losses} carrier(s) lost insurance coverage" if losses
               else f"Mfleet: {len(changes)} carrier insurance change(s)")
    if not mailer.send_mail(receiver, subject, body, from_label="Mfleet Alerts"):
        log.error("failed to send the insurance digest (check MAIL_* settings)")
        return 1
    log.info("sent insurance digest to %s", receiver)
    return 1 if aborted else 0


if __name__ == "__main__":
    raise SystemExit(main())
