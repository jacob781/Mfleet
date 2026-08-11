"""Turning a driver's self-registration into a link with a Driver record.

Kept apart from bot.py so the matching rules can be exercised without Telegram.

Matching is deliberately conservative: it links only on an unambiguous hit, and
anything odd (two same-named drivers, a driver someone else already claimed) is
parked as TG_CONFLICT for a human instead of being guessed at.
"""

from datetime import date
from typing import List, Optional, Tuple

from sqlmodel import Session, select

from models import (
    DRIVER_TERMINATED,
    TG_CONFLICT,
    TG_LINKED,
    Driver,
    TelegramLink,
    Truck,
    TruckDriver,
)


def parse_dob(text: str) -> Optional[date]:
    """MM/DD/YYYY, the format the rest of the system shows. Separators are lenient,
    the order is not: a day-first entry yields month > 12 and is rejected rather
    than silently swapped."""
    digits = "".join(c if c.isdigit() else " " for c in text).split()
    if len(digits) != 3:
        return None
    mm, dd, yyyy = digits
    if len(yyyy) != 4:
        return None
    try:
        return date(int(yyyy), int(mm), int(dd))
    except ValueError:
        return None


def split_name(full: str) -> Tuple[str, str]:
    """"Ivan Petrov" / "Petrov Ivan Sergeevich" -> (first, last). Middle names are
    dropped: only the outer two are compared."""
    parts = [p for p in full.replace(",", " ").split() if p]
    if len(parts) < 2:
        return (parts[0] if parts else ""), ""
    return parts[0], parts[-1]


def find_drivers(session: Session, company_id: Optional[int], full_name: str,
                 dob: Optional[date]) -> List[Driver]:
    """Active drivers of this company whose name matches, either order. When a date
    of birth is on file for a candidate it must agree — that is what makes the match
    trustworthy enough to link without asking anyone."""
    first, last = split_name(full_name)
    if not first or not last:
        return []
    stmt = select(Driver).where(Driver.status != DRIVER_TERMINATED)
    if company_id is not None:
        stmt = stmt.where(Driver.company_id == company_id)
    out = []
    for d in session.exec(stmt).all():
        names = {(d.first_name or "").strip().upper(), (d.last_name or "").strip().upper()}
        if names != {first.upper(), last.upper()}:
            continue
        if d.dob and dob and d.dob != dob:
            continue   # same name, different person
        out.append(d)
    return out


def find_trucks(session: Session, text: str) -> List[Truck]:
    """Resolve what the driver typed: a unit number, or the last 4 of the VIN.

    Searched across ALL companies on purpose — if the truck turns out to belong to a
    different company than the group, that is a data error worth surfacing, and
    scoping the search to the group's company would have hidden it.
    """
    probe = text.strip().upper()
    if not probe:
        return []
    trucks = list(session.exec(select(Truck)).all())
    by_unit = [t for t in trucks if (t.unit_number or "").strip().upper() == probe]
    if by_unit:
        return by_unit
    tail = "".join(c for c in probe if c.isalnum())
    if len(tail) < 4:
        return []
    return [t for t in trucks if (t.vin or "").strip().upper().endswith(tail)]


def assign_truck(session: Session, truck_id: int, driver_id: int) -> None:
    """Idempotent — re-registering must not raise on the composite primary key."""
    exists = session.exec(
        select(TruckDriver).where(
            TruckDriver.truck_id == truck_id, TruckDriver.driver_id == driver_id,
        )
    ).first()
    if exists is None:
        session.add(TruckDriver(truck_id=truck_id, driver_id=driver_id))


def resolve_driver(session: Session, link: TelegramLink, company_id: Optional[int]) -> str:
    """Attach `link` to a Driver, creating one when nobody matches, and set its
    status. Returns a note for the manager (empty when everything was clean).

    The caller commits.
    """
    matches = find_drivers(session, company_id, link.claimed_name or "", link.claimed_dob)

    if len(matches) > 1:
        link.status = TG_CONFLICT
        return f"{len(matches)} drivers share this name — link by hand"

    if len(matches) == 1:
        driver = matches[0]
        taken = session.exec(
            select(TelegramLink).where(
                TelegramLink.driver_id == driver.id,
                TelegramLink.tg_user_id != link.tg_user_id,
                TelegramLink.status == TG_LINKED,
            )
        ).first()
        if taken is not None:
            # Someone already registered as this driver. Never move the link.
            link.status = TG_CONFLICT
            return f"driver already linked to telegram id {taken.tg_user_id}"
        link.driver_id = driver.id
        link.status = TG_LINKED
        return ""

    # Nobody matched: create the driver so reminders can start, and so the manager
    # finds them in the normal list (missing documents already flag them red).
    if company_id is None:
        link.status = TG_CONFLICT
        return "group is not assigned to a company"
    first, last = split_name(link.claimed_name or "")
    driver = Driver(
        company_id=company_id, first_name=first.upper(), last_name=last.upper(),
        email="", phone="", dob=link.claimed_dob, status="Pending",
        notes="Created from Telegram self-registration",
    )
    session.add(driver)
    session.flush()
    link.driver_id = driver.id
    link.status = TG_LINKED
    return "new driver created from Telegram"
