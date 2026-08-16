"""Weekly MOTUS insurance re-check: what it picks up, what it reports, and — most
importantly — that it stops bothering MOTUS when MOTUS stops answering.
Run: python test_insurance_scan.py   (needs DATABASE_URL; no network; cleans up)
"""

from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv

load_dotenv()

from sqlmodel import Session, select  # noqa: E402

import insurance_scan  # noqa: E402
import motus  # noqa: E402
from database import get_engine  # noqa: E402
from models import Company  # noqa: E402

PREFIX = "InsScan Test"
ACTIVE = {"insurance": {"status": "active", "policy_number": "P-1",
                        "effective_date": "2026-01-01", "max_coverage": 1_000_000.0}}
NONE = {"insurance": {"status": "none"}}


def _clean(s):
    for co in s.exec(select(Company).where(Company.name.like(f"{PREFIX}%"))).all():
        s.delete(co)
    s.commit()


def _company(name, dot, checked_at):
    return Company(name=f"{PREFIX} {name}", dot_number=dot, address_street="1 A",
                   address_city="B", address_state="TX", address_zip="70000",
                   insurance_checked_at=checked_at)


def main():
    insurance_scan.DELAY_SECONDS = 0        # no politeness pause in a test
    engine = get_engine()
    old = datetime.now(timezone.utc) - timedelta(days=30)
    fresh = datetime.now(timezone.utc) - timedelta(hours=2)
    calls = []

    with Session(engine) as s:
        _clean(s)
        s.add_all([_company("stale", "1000001", old),
                   _company("fresh", "1000002", fresh),
                   _company("nodot", None, None)])
        s.commit()

    try:
        with Session(engine) as s:
            mine = lambda rows: [c for c in rows if c.name.startswith(PREFIX)]  # noqa: E731

            # --- who is due --------------------------------------------------
            names = [c.name for c in mine(insurance_scan.due(s, every=False, limit=100))]
            assert names == [f"{PREFIX} stale"], names
            every = [c.name for c in mine(insurance_scan.due(s, every=True, limit=100))]
            assert sorted(every) == [f"{PREFIX} fresh", f"{PREFIX} stale"], every
            assert insurance_scan.due(s, every=True, limit=1), "limit must still return work"

            # --- a first look records the snapshot ---------------------------
            def ok(dot):
                calls.append(dot)
                return ACTIVE

            motus.lookup = ok
            due = mine(insurance_scan.due(s, every=True, limit=100))
            changes, checked, aborted = insurance_scan.scan(s, due, dry_run=False)
            assert checked == 2 and not aborted, (checked, aborted)
            assert len(calls) == 2, calls
            assert all("now insured" in c for c in changes), changes

            stale = s.exec(select(Company).where(Company.name == f"{PREFIX} stale")).first()
            assert stale.insurance_status == "active" and stale.insurance_max_coverage == 1_000_000.0
            assert stale.insurance_checked_at > old, "the check must stamp its own time"

            # Nothing changed since -> nothing to report, but still re-checked.
            changes, checked, _ = insurance_scan.scan(s, [stale], dry_run=False)
            assert changes == [] and checked == 1, (changes, checked)

            # --- coverage disappears: the line the manager must not miss -----
            motus.lookup = lambda dot: NONE
            changes, _, _ = insurance_scan.scan(s, [stale], dry_run=False)
            assert len(changes) == 1 and "LOST COVERAGE" in changes[0], changes

            # --- a wrong USDOT is not MOTUS being unwell ---------------------
            def missing(dot):
                calls.append(dot)
                raise motus.MotusNotFound("nope")

            motus.lookup = missing
            calls.clear()
            changes, checked, aborted = insurance_scan.scan(s, due * 3, dry_run=False)
            assert not aborted, "a bad DOT number must not stop the run"
            assert checked == 0 and len(calls) == 6, (checked, calls)

            # --- MOTUS refusing: stop, do not hammer -------------------------
            def down(dot):
                calls.append(dot)
                raise motus.MotusError("502")

            motus.lookup = down
            calls.clear()
            changes, checked, aborted = insurance_scan.scan(s, due * 10, dry_run=False)
            assert aborted, "consecutive failures must abort the run"
            assert len(calls) == insurance_scan.GIVE_UP_AFTER, calls

            # --- dry run leaves the record alone -----------------------------
            motus.lookup = lambda dot: ACTIVE
            insurance_scan.scan(s, [stale], dry_run=True)
        with Session(engine) as s:
            after = s.exec(select(Company).where(Company.name == f"{PREFIX} stale")).first()
            assert after.insurance_status == "none", "a dry run must not write"
        print("insurance scan OK")
    finally:
        with Session(engine) as s:
            _clean(s)


if __name__ == "__main__":
    main()
