"""Truck lifecycle: terminate/reactivate, the event log, and alerts going quiet.
Run: python test_truck_lifecycle.py   (needs DATABASE_URL; cleans up after itself)
"""

from datetime import date, timedelta

from dotenv import load_dotenv

load_dotenv()

from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session, select  # noqa: E402

import cascade  # noqa: E402
from database import get_engine  # noqa: E402
from dependencies import get_current_user, get_current_user_file  # noqa: E402
from main import app  # noqa: E402
from models import Company, Truck, TruckEvent, User  # noqa: E402

CO = "Truck Lifecycle Test Co"


def _clean(s):
    for co in s.exec(select(Company).where(Company.name == CO)).all():
        for t in s.exec(select(Truck).where(Truck.company_id == co.id)).all():
            cascade.delete_truck(s, t)
        s.delete(co)
    s.commit()


def main():
    engine = get_engine()
    with Session(engine) as s:
        _clean(s)
        co = Company(name=CO, address_street="1 Main St", address_city="Dallas",
                     address_state="TX", address_zip="75001")
        s.add(co); s.commit(); s.refresh(co)
        company_id = co.id

    fake = User(id=1, email="t@t.t", hashed_password="x", role="admin", is_active=True)
    app.dependency_overrides[get_current_user] = lambda: fake
    app.dependency_overrides[get_current_user_file] = lambda: fake
    client = TestClient(app)

    try:
        tid = client.post("/api/trucks", json={
            "company_id": company_id, "make": "Volvo", "year": 2021,
            "vin": "4V4NC9EJ0MN999999", "plate_number": "LIFE001",
            "state_registered": "TX", "unit_number": "900",
        }).json()["id"]

        # A new truck is in service, and its timeline opens with that.
        assert client.get(f"/api/trucks/{tid}").json()["status"] == "Active"
        assert [e["kind"] for e in client.get(f"/api/trucks/{tid}").json()["events"]] == ["added"]

        # An expiring document alerts while the truck is on the road.
        soon = (date.today() + timedelta(days=5)).isoformat()
        client.post(f"/api/trucks/{tid}/documents/annual_inspection",
                    data={"expiry": soon},
                    files={"file": ("i.pdf", b"%PDF-1.4 x", "application/pdf")})
        alerts = client.get("/api/compliance/alerts").json()
        assert any(a["truck_id"] == tid for a in alerts), "truck should alert while active"

        # Taking it off the road stamps the date and writes the event.
        r = client.patch(f"/api/trucks/{tid}", json={"status": "Terminated"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "Terminated"
        assert r.json()["termination_date"] == date.today().isoformat()
        assert [e["kind"] for e in client.get(f"/api/trucks/{tid}").json()["events"]] \
            == ["added", "terminated"]

        # ...and it goes quiet: neither the expiry nor the missing registration nags.
        alerts = client.get("/api/compliance/alerts").json()
        assert not any(a["truck_id"] == tid for a in alerts), "retired truck still alerting"

        # It stays in the list, though — retired is not deleted.
        assert any(t["id"] == tid for t in client.get(f"/api/trucks?company_id={company_id}").json())
        assert [t["id"] for t in client.get(f"/api/trucks?truck_status=Terminated").json()
                if t["id"] == tid] == [tid]

        # Back in service: the date is kept as the record of the last termination,
        # and the timeline gains a third entry rather than losing the second.
        r = client.patch(f"/api/trucks/{tid}", json={"status": "Active"})
        assert r.json()["status"] == "Active"
        assert r.json()["termination_date"] == date.today().isoformat(), "history was erased"
        assert [e["kind"] for e in client.get(f"/api/trucks/{tid}").json()["events"]] \
            == ["added", "terminated", "reactivated"]
        assert any(a["truck_id"] == tid for a in client.get("/api/compliance/alerts").json())

        # Correcting the date moves the existing entry instead of inventing a second
        # termination.
        client.patch(f"/api/trucks/{tid}", json={"status": "Terminated"})
        fixed = (date.today() - timedelta(days=10)).isoformat()
        client.patch(f"/api/trucks/{tid}", json={"termination_date": fixed})
        events = client.get(f"/api/trucks/{tid}").json()["events"]
        terminations = [e for e in events if e["kind"] == "terminated"]
        # Both rounds are kept — that is what the log is for — and only the latest one
        # moved to the corrected date.
        assert len(terminations) == 2, events
        assert terminations[0]["date"] == fixed, events
        assert terminations[1]["date"] == date.today().isoformat(), events

        # Deleting the truck takes its timeline with it.
        client.delete(f"/api/trucks/{tid}")
        with Session(engine) as s:
            assert s.exec(select(TruckEvent).where(TruckEvent.truck_id == tid)).all() == []

        print("truck lifecycle OK")
    finally:
        app.dependency_overrides.clear()
        with Session(engine) as s:
            _clean(s)


if __name__ == "__main__":
    main()
