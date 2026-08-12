"""Document versioning: a renewed licence must not destroy the old one.
Run: python test_doc_versions.py   (needs DATABASE_URL; cleans up after itself)
"""

from datetime import date
from io import BytesIO

from dotenv import load_dotenv

load_dotenv()

from PIL import Image  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session, select  # noqa: E402

import cascade  # noqa: E402
import uploads  # noqa: E402
from database import get_engine  # noqa: E402
from dependencies import get_current_user, get_current_user_file  # noqa: E402
from main import app  # noqa: E402
from routers.driver_form import _upsert_compliance  # noqa: E402
from models import Company, ComplianceDocument, Driver, User  # noqa: E402

CO = "DocVersion Test Co"


def _photo(colour: str) -> bytes:
    buf = BytesIO()
    Image.new("RGB", (60, 40), colour).save(buf, "JPEG")
    return buf.getvalue()


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

    fake = User(id=1, email="t@t.t", hashed_password="x", role="admin", is_active=True)
    app.dependency_overrides[get_current_user] = lambda: fake
    app.dependency_overrides[get_current_user_file] = lambda: fake   # file downloads
    client = TestClient(app)

    try:
        did = client.post("/api/drivers", json={
            "company_id": company_id, "first_name": "Bob", "last_name": "Rae",
        }).json()["id"]

        def post(data, photo=None):
            files = {"file": ("dl.jpg", photo, "image/jpeg")} if photo else None
            return client.post(f"/api/drivers/{did}/documents/cdl", data=data, files=files)

        # --- first licence -------------------------------------------------
        r = post({"expiry": "2027-05-01", "issue": "2023-05-01",
                  "number": "TX-111", "address": "1 Old St"}, _photo("red"))
        assert r.status_code == 200, r.text
        v1 = r.json()
        assert v1["issue_date"] == "2023-05-01" and v1["document_number"] == "TX-111"
        assert v1["superseded_at"] is None

        # --- correction, no file: edits in place, no new version -----------
        r = post({"expiry": "2027-06-01"})
        assert r.json()["id"] == v1["id"], "editing must not fork a version"
        assert r.json()["expiry_date"] == "2027-06-01"
        assert len(client.get(f"/api/drivers/{did}/documents/cdl/history").json()) == 1

        # --- renewal WITH a file: new version, old one kept ----------------
        r = post({"expiry": "2031-04-01", "issue": "2026-04-01", "number": "TX-222"},
                 _photo("blue"))
        v2 = r.json()
        assert v2["id"] != v1["id"], "a new file must start a new version"
        assert v2["superseded_at"] is None

        hist = client.get(f"/api/drivers/{did}/documents/cdl/history").json()
        assert len(hist) == 2, hist
        # Newest first, ordered by the date printed on the licence.
        assert [h["issue_date"] for h in hist] == ["2026-04-01", "2023-05-01"], hist
        assert hist[1]["superseded_at"] is not None, "the old one is marked superseded"

        # The old file is still on disk and still downloadable.
        with Session(engine) as s:
            old = s.get(ComplianceDocument, v1["id"])
            new = s.get(ComplianceDocument, v2["id"])
            assert old.file_path != new.file_path, (old.file_path, new.file_path)
            assert uploads.resolve(old.file_path).exists(), "old licence photo was destroyed"
            assert uploads.resolve(new.file_path).exists()
        assert client.get(f"/api/compliance/documents/{v1['id']}/file").status_code == 200

        # --- the current-version views only show the new one ---------------
        cur = client.get(f"/api/drivers/{did}/documents").json()
        assert [c["id"] for c in cur] == [v2["id"]], cur
        # Alerts must not fire twice for one driver's licence.
        alerts = client.get("/api/compliance/alerts").json()
        mine = [a for a in alerts if a.get("driver_id") == did and a["document_type"] == "CDL"]
        assert len(mine) <= 1, mine

        # --- details carry over when a renewal restates nothing ------------
        r = post({"expiry": "2035-01-01"}, _photo("green"))
        assert r.json()["document_number"] == "TX-222", "unstated details must carry over"
        assert r.json()["address"] == "1 Old St"

        # --- what the driver's own application submits -----------------------
        # Same code path as the manager's card: a renewed licence must not overwrite
        # the one on record, and a re-submit of the same application must not fork it.
        with Session(engine) as s:
            def submit(path, expiry, state):
                _upsert_compliance(s, "CDL", date.fromisoformat(expiry), path,
                                   driver_id=did, number="TX-333", issuing_state=state)
                s.commit()

            def history():
                return client.get(f"/api/drivers/{did}/documents/cdl/history").json()

            before = history()
            submit("company_1/app_1/cdl.jpg", "2036-01-01", "TX")
            after_new = history()
            assert len(after_new) == len(before) + 1, "a licence from an application is a new version"
            # The one in force leads the list even without an issue date printed on it.
            assert after_new[0]["superseded_at"] is None and after_new[0]["issuing_state"] == "TX"
            assert any(h["id"] == before[0]["id"] and h["superseded_at"] for h in after_new[1:]), \
                "the manager's copy is kept, marked superseded"

            # Re-submitting the same application resends the same path: a correction.
            submit("company_1/app_1/cdl.jpg", "2036-02-02", "TN")
            again = history()
            assert len(again) == len(after_new), "a re-submit must not fork a version"
            assert again[0]["expiry_date"] == "2036-02-02" and again[0]["issuing_state"] == "TN"

            # A driver who renews mid-hire sends a different file → another version.
            submit("company_1/app_2/cdl.jpg", "2040-03-03", "TN")
            renewed = history()
            assert len(renewed) == len(again) + 1, renewed
            assert renewed[0]["expiry_date"] == "2040-03-03"
            assert any(h["expiry_date"] == "2036-02-02" for h in renewed[1:]), \
                "the older licence stays readable"

        # Deleting the driver removes every version.
        assert client.delete(f"/api/drivers/{did}").status_code == 204
        with Session(engine) as s:
            left = s.exec(
                select(ComplianceDocument).where(ComplianceDocument.driver_id == did)
            ).all()
            assert left == [], left
    finally:
        app.dependency_overrides.clear()
        with Session(engine) as s:
            _clean(s)
    print("ok")


if __name__ == "__main__":
    main()
