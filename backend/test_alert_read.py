"""Alerts read state: shared, keyed by what the alert is about, reset on renewal.
Run: python test_alert_read.py   (needs DATABASE_URL; cleans up after itself)
"""

from datetime import date, timedelta
from io import BytesIO

from dotenv import load_dotenv

load_dotenv()

from PIL import Image  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session, select  # noqa: E402

import cascade  # noqa: E402
from database import get_engine  # noqa: E402
from dependencies import get_current_user, get_current_user_file  # noqa: E402
from main import app  # noqa: E402
from models import AlertRead, Company, Driver, User  # noqa: E402

CO = "Alert Read Test Co"


def _photo():
    buf = BytesIO()
    Image.new("RGB", (40, 30), "green").save(buf, "JPEG")
    return buf.getvalue()


def _clean(s):
    for co in s.exec(select(Company).where(Company.name == CO)).all():
        for d in s.exec(select(Driver).where(Driver.company_id == co.id)).all():
            cascade.delete_driver(s, d)
        s.delete(co)
    s.commit()


def mine(client, driver_id):
    return [a for a in client.get("/api/compliance/alerts").json() if a["driver_id"] == driver_id]


def main():
    engine = get_engine()
    with Session(engine) as s:
        _clean(s)
        co = Company(name=CO, address_street="1 Main St", address_city="Dallas",
                     address_state="TX", address_zip="75001")
        s.add(co); s.commit(); s.refresh(co)
        company_id = co.id
        user_id = s.exec(select(User)).first().id
        # Snapshot: this test calls "mark all", which by definition touches every
        # alert on the board, including ones it did not create. Anything not in this
        # set is ours to remove afterwards.
        before = {r.key for r in s.exec(select(AlertRead)).all()}

    fake = User(id=user_id, email="t@t.t", hashed_password="x", role="admin", is_active=True)
    app.dependency_overrides[get_current_user] = lambda: fake
    app.dependency_overrides[get_current_user_file] = lambda: fake
    client = TestClient(app)

    try:
        did = client.post("/api/drivers", json={
            "company_id": company_id, "first_name": "Rita", "last_name": "Vance",
            "email": "r@v.com", "phone": "2145550199",
        }).json()["id"]

        soon = (date.today() + timedelta(days=7)).isoformat()
        client.post(f"/api/drivers/{did}/documents/cdl", data={"expiry": soon},
                    files={"file": ("cdl.jpg", _photo(), "image/jpeg")})

        rows = mine(client, did)
        assert rows, "the expiring licence should raise an alert"
        cdl = [a for a in rows if a["document_type"] == "CDL"][0]
        assert cdl["key"] and cdl["read_at"] is None, cdl

        # Marking one read is shared state, not a per-session flag.
        assert client.post("/api/compliance/alerts/read", json={"keys": [cdl["key"]]}).status_code == 204
        again = [a for a in mine(client, did) if a["key"] == cdl["key"]][0]
        assert again["read_at"], "read state did not stick"

        # Read rows sink below everything still new.
        everything = client.get("/api/compliance/alerts").json()
        first_read = next(i for i, a in enumerate(everything) if a["read_at"])
        assert all(a["read_at"] for a in everything[first_read:]), "read rows not at the bottom"

        # Undo puts it back.
        assert client.request("DELETE", "/api/compliance/alerts/read",
                              json={"keys": [cdl["key"]]}).status_code == 204
        assert [a for a in mine(client, did) if a["key"] == cdl["key"]][0]["read_at"] is None

        # Mark all takes the whole board, including the missing medical certificate.
        missing = [a for a in mine(client, did) if a["status"] == "Missing"]
        assert missing, "the missing medical cert should be listed"
        assert client.post("/api/compliance/alerts/read", json={"all": True}).status_code == 204
        assert all(a["read_at"] for a in mine(client, did)), "mark all missed some"

        # THE POINT: renewing the licence is a NEW alert about a new date, so it comes
        # back unread instead of inheriting the dismissal of the one it replaced.
        later = (date.today() + timedelta(days=20)).isoformat()
        client.post(f"/api/drivers/{did}/documents/cdl", data={"expiry": later},
                    files={"file": ("cdl2.jpg", _photo(), "image/jpeg")})
        renewed = [a for a in mine(client, did) if a["document_type"] == "CDL"][0]
        assert renewed["key"] != cdl["key"], "the key must move with the date"
        assert renewed["read_at"] is None, "a renewed document must alert again"

        print("alert read OK")
    finally:
        app.dependency_overrides.clear()
        with Session(engine) as s:
            for row in s.exec(select(AlertRead)).all():
                if row.key not in before:
                    s.delete(row)
            s.commit()
            _clean(s)


if __name__ == "__main__":
    main()
