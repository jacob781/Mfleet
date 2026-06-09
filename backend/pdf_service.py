"""Assemble the Typst payload and generate the application PDF (background task)."""

import os
from datetime import datetime, timezone
from pathlib import Path

from sqlmodel import Session

from database import get_engine
from models import ApplicationPayload, DriverApplication
from pdf_generator.pdf_generator import PDFGenerator


def _output_dir() -> Path:
    d = Path(os.getenv("GENERATED_PDF_DIR", str(Path(__file__).parent / "generated_pdfs")))
    d.mkdir(parents=True, exist_ok=True)
    return d


def build_payload(application: DriverApplication, answers: dict) -> dict:
    """Merge driver answers + manager config, validate, and add the flat is_owner key."""
    assembled = {**answers, "config": application.manager_config}
    payload = ApplicationPayload(**assembled).model_dump(mode="json")
    payload["is_owner"] = application.driver_is_owner  # Typst reads a flat top-level key
    return payload


def generate_application_pdf(application_id: int) -> None:
    """Background task: build payload, run Typst+merge, record status on the application."""
    with Session(get_engine()) as session:
        app = session.get(DriverApplication, application_id)
        if app is None:
            return
        app.pdf_status = "generating"
        app.pdf_error = None
        session.add(app)
        session.commit()

        answers = app.answers.answers if app.answers else {}
        try:
            payload = build_payload(app, answers)
            out = _output_dir() / f"application_{application_id}.pdf"
            if not PDFGenerator().generate(payload, out):
                raise RuntimeError("Typst compilation or PDF merge failed")
            app.pdf_status = "ready"
            app.pdf_path = str(out)
            app.pdf_error = None
            app.pdf_generated_at = datetime.now(timezone.utc)
        except Exception as exc:  # noqa: BLE001 - record any failure for the manager
            app.pdf_status = "failed"
            app.pdf_error = str(exc)[:1000]
        session.add(app)
        session.commit()
