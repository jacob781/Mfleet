"""Self-check for compliance expiry-status logic. Run: python test_doc_status.py"""
from datetime import date, timedelta

from models import EXPIRY_SOON_DAYS, ApplicationPayload, doc_status


def test_doc_status():
    t = date(2026, 6, 30)
    assert doc_status(t - timedelta(days=1), t) == "Expired"
    assert doc_status(t, t) == "Expiring Soon"                       # expires today
    assert doc_status(t + timedelta(days=EXPIRY_SOON_DAYS), t) == "Expiring Soon"  # boundary
    assert doc_status(t + timedelta(days=EXPIRY_SOON_DAYS + 1), t) == "Valid"


def test_blank_expiries_dropped():
    # Untouched date inputs arrive as "" and must not reach date parsing.
    out = ApplicationPayload._drop_blank_expiries(
        {"document_expiries": {"registration": "", "annual_inspection": "2026-12-01"}}
    )
    assert out["document_expiries"] == {"annual_inspection": "2026-12-01"}


if __name__ == "__main__":
    test_doc_status()
    test_blank_expiries_dropped()
    print("OK")
