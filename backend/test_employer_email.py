"""Employer verification rows inherit the carrier email the MOTUS lookup resolved,
without ever overwriting one a manager corrected by hand.
Run: python test_employer_email.py   (needs DATABASE_URL; cleans up after itself)
"""

from dotenv import load_dotenv

load_dotenv()

from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session, select  # noqa: E402

import cascade  # noqa: E402
from database import get_engine  # noqa: E402
from dependencies import get_current_user, get_current_user_file  # noqa: E402
from main import app  # noqa: E402
from models import (  # noqa: E402
    Company, DriverAnswers, DriverApplication, EmployerVerification, User,
)

CO = "EmployerEmail Test Co"

HISTORY = [
    {"employer_name": "ACME CARRIER LLC", "employer_email": "dispatch@acme.example"},
    {"employer_name": "NO EMAIL INC"},                      # MOTUS had nothing on file
    {"employer_name": "MANUAL FIX LLC", "employer_email": "info@manual.example"},
]


def _clean(s):
    for co in s.exec(select(Company).where(Company.name == CO)).all():
        for a in s.exec(select(DriverApplication).where(DriverApplication.company_id == co.id)).all():
            cascade.delete_application(s, a)
        s.delete(co)
    s.commit()


def main():
    engine = get_engine()
    with Session(engine) as s:
        _clean(s)
        co = Company(name=CO, address_street="1 A", address_city="B",
                     address_state="TX", address_zip="70000")
        s.add(co)
        user_id = s.exec(select(User)).first().id
        s.commit(); s.refresh(co)
        appl = DriverApplication(company_id=co.id, created_by_id=user_id, manager_config={})
        s.add(appl); s.commit(); s.refresh(appl)
        s.add(DriverAnswers(application_id=appl.id, answers={"employment_history": HISTORY}))
        s.commit()
        app_id = appl.id

    fake = User(id=user_id, email="t@t.t", hashed_password="x", role="admin", is_active=True)
    app.dependency_overrides[get_current_user] = lambda: fake
    app.dependency_overrides[get_current_user_file] = lambda: fake
    client = TestClient(app)

    try:
        rows = client.get(f"/api/applications/{app_id}/employers").json()
        assert [r["employer_name"] for r in rows] == [h["employer_name"] for h in HISTORY], rows
        assert rows[0]["email"] == "dispatch@acme.example", "the MOTUS email must seed the row"
        assert not rows[1]["email"], "nothing on file stays empty"

        # A manager corrects the address (MOTUS often holds a general inbox, not HR).
        fixed = "hr@manual.example"
        client.patch(f"/api/applications/{app_id}/employers/{rows[2]['id']}", json={"email": fixed})
        again = client.get(f"/api/applications/{app_id}/employers").json()
        assert again[2]["email"] == fixed, "a corrected address must survive a re-list"

        # Filling a blank later still works: the driver re-submits with an email.
        with Session(engine) as s:
            row = s.get(DriverAnswers, s.exec(
                select(DriverAnswers).where(DriverAnswers.application_id == app_id)).first().id)
            answers = dict(row.answers)
            answers["employment_history"] = [
                {**HISTORY[0]}, {**HISTORY[1], "employer_email": "late@noemail.example"}, {**HISTORY[2]},
            ]
            row.answers = answers
            s.add(row); s.commit()
        third = client.get(f"/api/applications/{app_id}/employers").json()
        assert third[1]["email"] == "late@noemail.example", third
        assert third[2]["email"] == fixed, "still not clobbered"

        # The ops endpoint the host's monitoring will watch.
        assert client.get("/api/health").json() == {"status": "ok"}
        print("employer email OK")
    finally:
        app.dependency_overrides.clear()
        with Session(engine) as s:
            _clean(s)


if __name__ == "__main__":
    main()
