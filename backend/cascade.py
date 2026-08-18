"""Cascade-delete helpers: remove an entity and all its dependent rows + files in
FK-safe order. Kept in one place so drivers/companies routers share the same logic.

Callers own the transaction — these functions only stage deletes; commit afterwards.
"""
import os

from sqlmodel import Session, select

import uploads
from models import (
    ComplianceDocument,
    DriverAnswers,
    DriverApplication,
    DriverEmploymentEvent,
    EmployerVerification,
    Truck,
    TruckEvent,
)


def delete_truck(session: Session, truck: Truck) -> None:
    """Delete a truck, its compliance documents, and its file folder."""
    for doc in session.exec(
        select(ComplianceDocument).where(ComplianceDocument.truck_id == truck.id)
    ).all():
        session.delete(doc)
    for ev in session.exec(
        select(TruckEvent).where(TruckEvent.truck_id == truck.id)
    ).all():
        session.delete(ev)
    uploads.remove_dir(f"trucks/truck_{truck.id}")
    session.delete(truck)


def delete_application(session: Session, app: DriverApplication) -> None:
    """Delete an application, its employer verifications, answers (draft), generated
    PDF, and upload folder. (DriverAnswers also cascades via the relationship, but we
    delete it explicitly to be safe and to keep the order obvious.)"""
    for ev in session.exec(
        select(EmployerVerification).where(EmployerVerification.application_id == app.id)
    ).all():
        session.delete(ev)
    ans = session.exec(
        select(DriverAnswers).where(DriverAnswers.application_id == app.id)
    ).first()
    if ans:
        session.delete(ans)
    if app.pdf_path and os.path.exists(app.pdf_path):
        try:
            os.remove(app.pdf_path)
        except OSError:
            pass
    uploads.remove_dir(f"company_{app.company_id}/app_{app.id}")
    session.delete(app)


def delete_driver(session: Session, driver) -> None:
    """Delete a driver with their owned trucks, applications, and compliance docs."""
    for truck in session.exec(
        select(Truck).where(Truck.owner_driver_id == driver.id)
    ).all():
        delete_truck(session, truck)
    for app in session.exec(
        select(DriverApplication).where(DriverApplication.driver_id == driver.id)
    ).all():
        delete_application(session, app)
    for doc in session.exec(
        select(ComplianceDocument).where(ComplianceDocument.driver_id == driver.id)
    ).all():
        session.delete(doc)
    for ev in session.exec(
        select(DriverEmploymentEvent).where(DriverEmploymentEvent.driver_id == driver.id)
    ).all():
        session.delete(ev)
    uploads.remove_dir(f"drivers/driver_{driver.id}")
    session.delete(driver)
