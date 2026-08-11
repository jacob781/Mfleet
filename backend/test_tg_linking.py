"""Matching rules for Telegram self-registration.
Run: python test_tg_linking.py   (needs DATABASE_URL; makes and removes its own rows)
"""

from datetime import date

from dotenv import load_dotenv

load_dotenv()

from sqlmodel import Session, delete, select  # noqa: E402

import tg_linking  # noqa: E402
from database import get_engine  # noqa: E402
from models import (  # noqa: E402
    TG_CONFLICT, TG_LINKED, Company, Driver, TelegramLink, Truck, TruckDriver,
)

CO = "TGLink Test Co"


def test_parse_dob():
    assert tg_linking.parse_dob("03/25/1980") == date(1980, 3, 25)
    assert tg_linking.parse_dob("3-5-1990") == date(1990, 3, 5)
    # Day-first is rejected, not silently swapped — 25 is not a month.
    assert tg_linking.parse_dob("25.12.1980") is None
    assert tg_linking.parse_dob("hello") is None
    assert tg_linking.parse_dob("03/25/80") is None


def test_split_name():
    assert tg_linking.split_name("Ivan Petrov") == ("Ivan", "Petrov")
    assert tg_linking.split_name("Ivan Sergeevich Petrov") == ("Ivan", "Petrov")
    assert tg_linking.split_name("Petrov") == ("Petrov", "")


def _clean(s):
    for co in s.exec(select(Company).where(Company.name == CO)).all():
        for d in s.exec(select(Driver).where(Driver.company_id == co.id)).all():
            s.exec(delete(TruckDriver).where(TruckDriver.driver_id == d.id))
            s.exec(delete(TelegramLink).where(TelegramLink.driver_id == d.id))
            s.delete(d)
        for t in s.exec(select(Truck).where(Truck.company_id == co.id)).all():
            s.exec(delete(TruckDriver).where(TruckDriver.truck_id == t.id))
            s.delete(t)
        s.delete(co)
    s.exec(delete(TelegramLink).where(TelegramLink.tg_user_id.in_([901, 902, 903])))
    s.commit()


def main():
    test_parse_dob()
    test_split_name()

    with Session(get_engine()) as s:
        _clean(s)
        co = Company(name=CO, address_street="1 A", address_city="B",
                     address_state="TX", address_zip="70000")
        s.add(co); s.commit(); s.refresh(co)
        drv = Driver(company_id=co.id, first_name="IVAN", last_name="PETROV",
                     email="", phone="", dob=date(1980, 3, 25), status="Active")
        trk = Truck(company_id=co.id, make="Volvo", year=2021, vin="4V4NC9EH5MN123456",
                    plate_number="XYZ9999", state_registered="TX", unit_number="207")
        s.add(drv); s.add(trk); s.commit(); s.refresh(drv); s.refresh(trk)

        # Truck by unit number, and by the last 4 of the VIN.
        assert [t.id for t in tg_linking.find_trucks(s, "207")] == [trk.id]
        assert [t.id for t in tg_linking.find_trucks(s, "3456")] == [trk.id]
        assert tg_linking.find_trucks(s, "0000") == []

        # Exact name + matching DOB links to the existing driver.
        link = TelegramLink(tg_user_id=901, claimed_name="Ivan Petrov",
                            claimed_dob=date(1980, 3, 25))
        s.add(link)
        note = tg_linking.resolve_driver(s, link, co.id)
        s.commit()
        assert link.driver_id == drv.id and link.status == TG_LINKED, (link.status, note)
        assert note == "", note

        # A second account claiming the same driver must NOT steal the link.
        link2 = TelegramLink(tg_user_id=902, claimed_name="Ivan Petrov",
                             claimed_dob=date(1980, 3, 25))
        s.add(link2)
        note = tg_linking.resolve_driver(s, link2, co.id)
        s.commit()
        assert link2.status == TG_CONFLICT and link2.driver_id is None, link2.status
        assert "already linked" in note, note

        # An unknown person gets a fresh Pending driver.
        link3 = TelegramLink(tg_user_id=903, claimed_name="Oleg Sidorov",
                             claimed_dob=date(1990, 1, 2))
        s.add(link3)
        note = tg_linking.resolve_driver(s, link3, co.id)
        s.commit()
        assert link3.status == TG_LINKED and link3.driver_id, link3.status
        created = s.get(Driver, link3.driver_id)
        assert created.first_name == "OLEG" and created.status == "Pending"
        assert "new driver" in note, note

        # Same name but a different DOB is a different person -> also created new.
        assert tg_linking.find_drivers(s, co.id, "Ivan Petrov", date(1999, 9, 9)) == []

        # Truck assignment is idempotent.
        tg_linking.assign_truck(s, trk.id, drv.id)
        tg_linking.assign_truck(s, trk.id, drv.id)
        s.commit()
        rows = s.exec(select(TruckDriver).where(TruckDriver.truck_id == trk.id)).all()
        assert len(rows) == 1, rows

        _clean(s)
    print("ok")


if __name__ == "__main__":
    main()
