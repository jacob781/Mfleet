"""Employment timeline: every hire / termination / reactivation is kept.
Run: python test_employment_events.py   (needs DATABASE_URL; cleans up after itself)
"""

from datetime import date

from dotenv import load_dotenv

load_dotenv()

from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session, delete, select  # noqa: E402

import cascade  # noqa: E402
from database import get_engine, get_session  # noqa: E402
from dependencies import get_current_user  # noqa: E402
from main import app  # noqa: E402
from models import (  # noqa: E402
    EV_HIRED, EV_REACTIVATED, EV_TERMINATED,
    Company, Driver, DriverEmploymentEvent, User,
)

CO = "Employment Test Co"


def _clean(s):
    for co in s.exec(select(Company).where(Company.name == CO)).all():
        for d in s.exec(select(Driver).where(Driver.company_id == co.id)).all():
            cascade.delete_driver(s, d)
        s.delete(co)
    s.commit()


def main():
    engine = get_engine()
    with Session(engine) as s:
        _clean(s)
        co = Company(name=CO, address_street="1 A", address_city="B",
                     address_state="TX", address_zip="70000")
        s.add(co); s.commit(); s.refresh(co)
        company_id = co.id

    # Drive the real endpoints; auth is stubbed so the test stays about the logic.
    fake = User(id=1, email="t@t.t", hashed_password="x", role="admin", is_active=True)
    app.dependency_overrides[get_current_user] = lambda: fake
    client = TestClient(app)

    try:
        r = client.post("/api/drivers", json={
            "company_id": company_id, "first_name": "Ann", "last_name": "Lee",
            "hire_date": "2024-01-15",
        })
        assert r.status_code == 201, r.text
        did = r.json()["id"]

        def kinds():
            return [(e["kind"], e["date"]) for e in client.get(f"/api/drivers/{did}").json()["employment_events"]]

        assert kinds() == [(EV_HIRED, "2024-01-15")], kinds()

        # Terminate -> event + stamped date.
        r = client.patch(f"/api/drivers/{did}", json={"status": "Terminated"})
        assert r.status_code == 200, r.text
        today = date.today().isoformat()
        assert r.json()["termination_date"] == today
        assert kinds() == [(EV_HIRED, "2024-01-15"), (EV_TERMINATED, today)], kinds()

        # Reactivate -> the termination date SURVIVES (this is the whole point).
        r = client.patch(f"/api/drivers/{did}", json={"status": "Active"})
        assert r.status_code == 200, r.text
        assert r.json()["termination_date"] == today, "termination date must not be cleared"
        assert kinds()[-1] == (EV_REACTIVATED, today), kinds()
        # The PATCH response carries the same timeline, so the drawer can redraw from
        # it without a second round trip.
        assert [e["kind"] for e in r.json()["employment_events"]] == [
            EV_HIRED, EV_TERMINATED, EV_REACTIVATED,
        ], r.json()["employment_events"]

        # A second round is recorded too, not collapsed into the first.
        client.patch(f"/api/drivers/{did}", json={"status": "Terminated"})
        client.patch(f"/api/drivers/{did}", json={"status": "Active"})
        seq = [k for k, _ in kinds()]
        assert seq == [EV_HIRED, EV_TERMINATED, EV_REACTIVATED, EV_TERMINATED, EV_REACTIVATED], seq

        # An edit that does not touch status adds nothing.
        client.patch(f"/api/drivers/{did}", json={"phone": "5551112222"})
        assert len(kinds()) == 5, kinds()

        # A manager-supplied termination date wins over today's. The timeline is
        # ordered by event date, so a backdated entry lands in the middle, not last.
        client.patch(f"/api/drivers/{did}", json={"status": "Terminated", "termination_date": "2025-06-30"})
        assert (EV_TERMINATED, "2025-06-30") in kinds(), kinds()
        assert [d for _, d in kinds()] == sorted(d for _, d in kinds()), kinds()
        assert len(kinds()) == 6, kinds()

        # Correcting the hire date moves the existing entry instead of adding one.
        client.patch(f"/api/drivers/{did}", json={"hire_date": "2023-11-01"})
        assert (EV_HIRED, "2023-11-01") in kinds(), kinds()
        assert [k for k, _ in kinds()].count(EV_HIRED) == 1, kinds()
        assert len(kinds()) == 6, kinds()

        # Deleting the driver takes the events with it (FK would fail otherwise).
        assert client.delete(f"/api/drivers/{did}").status_code == 204
        with Session(engine) as s:
            left = s.exec(
                select(DriverEmploymentEvent).where(DriverEmploymentEvent.driver_id == did)
            ).all()
            assert left == [], left
    finally:
        app.dependency_overrides.clear()
        with Session(engine) as s:
            _clean(s)
    print("ok")


if __name__ == "__main__":
    main()
