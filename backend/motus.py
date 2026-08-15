"""MOTUS (FMCSA registration system) carrier lookup.

Given a USDOT number, fetch the carrier's public record from MOTUS and normalize
it into the fields the admin company form and the driver questionnaire need.

Data source (public, no key, no auth): GET https://motus.dot.gov/api/carriers/{dot}
NOTE: the endpoint only answers from US/Canada egress — geo-blocked elsewhere.
"""

import re
import threading
import time
from datetime import datetime, timezone
from typing import Optional

import requests

BASE = "https://motus.dot.gov"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
TIMEOUT = 15

# locations[] addressTypeId values (stable IDs observed in the MOTUS API).
PHYSICAL_ADDRESS_TYPE_ID = "eef9bd53-0da3-4b96-b462-8e2711a009ef"

# Insurance rule: only currently-effective filings with >= this coverage matter.
MIN_COVERAGE = 300_000.0

# USDOT data rarely changes; insurance can, so keep the cache short.
_CACHE_TTL = 3600
_cache: dict = {}
_cache_lock = threading.Lock()


class MotusError(Exception):
    """Lookup failed — the message is safe to surface to the caller."""


class MotusNotFound(MotusError):
    """No carrier found for the given USDOT number."""


def _digits(value: Optional[str]) -> str:
    return re.sub(r"\D", "", value or "")


def _phone(value: Optional[str]) -> Optional[str]:
    d = _digits(value)
    return d[-10:] if d else None


def _legal_name(payload: dict) -> str:
    for name in payload.get("entityNames") or []:
        if name.get("nameType") == "Legal" and name.get("entityName"):
            return name["entityName"].strip()
    return (payload.get("entityName") or "").strip()


def _physical_address(payload: dict) -> Optional[dict]:
    for loc in payload.get("locations") or []:
        if loc.get("addressTypeId") != PHYSICAL_ADDRESS_TYPE_ID:
            continue
        street = " ".join(
            p for p in [loc.get("addressLine1"), loc.get("addressLine2")] if p
        ).strip()
        if not street and not loc.get("city"):
            continue
        return {
            "street": street,
            "city": (loc.get("city") or "").strip(),
            "state": (loc.get("state") or "").strip().upper(),
            "zip": (loc.get("zipCode") or "").strip(),
        }
    return None


def _owner(payload: dict) -> Optional[dict]:
    officers = payload.get("entityOfficers") or []
    if not officers:
        return None
    o = officers[0]
    return {
        "first_name": (o.get("firstName") or "").strip(),
        "last_name": (o.get("lastName") or "").strip(),
        "title": o.get("title"),
        "phone": _phone(o.get("phoneNumber")),
        "email": o.get("email"),
    }


def _mc_number(payload: dict) -> Optional[str]:
    for reg in payload.get("entityRegistrations") or []:
        for link in reg.get("entityRegistrationOperatingAuthorities") or []:
            oa = link.get("entityOperatingAuthority") or {}
            d = _digits(oa.get("docketNumber"))
            if d:
                return d
    return None


def _parse_dt(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def _insurance(payload: dict) -> Optional[dict]:
    """Active filing with >= MIN_COVERAGE, most recent effective date."""
    now = datetime.now(timezone.utc)
    best: Optional[tuple] = None  # (effective_dt, filing)
    for reg in payload.get("entityRegistrations") or []:
        for link in reg.get("entityRegistrationOperatingAuthorities") or []:
            oa = link.get("entityOperatingAuthority") or {}
            for f in oa.get("insuranceFilings") or []:
                try:
                    cov = float(f.get("maxCovAmount") or 0)
                except (TypeError, ValueError):
                    cov = 0.0
                if cov < MIN_COVERAGE:
                    continue
                # Currently effective: cancelled in the past means it is gone.
                cancel = _parse_dt(f.get("cancellationDate"))
                if cancel is not None and cancel <= now:
                    continue
                eff = _parse_dt(f.get("effectiveDate"))
                if eff is None:
                    continue
                if best is None or eff > best[0]:
                    best = (eff, f)
    if best is None:
        return {"status": "none"}
    _, f = best
    return {
        "status": "active",
        "policy_number": f.get("policyNumber"),
        "effective_date": str(f.get("effectiveDate") or "")[:10],
        "max_coverage": float(f.get("maxCovAmount") or 0),
    }


def _normalize(payload: dict) -> dict:
    dot = payload.get("entityDotNumber") or {}
    usdot = _digits(dot.get("dotNumber"))
    phones = payload.get("phoneNumbers") or []
    emails = payload.get("emailAddresses") or []
    return {
        "legal_name": _legal_name(payload),
        "usdot_number": usdot,
        "mc_number": _mc_number(payload),
        "phone": _phone(phones[0].get("phoneNumber")) if phones else None,
        "email": (emails[0].get("emailAddress") or None) if emails else None,
        "owner": _owner(payload),
        "physical_address": _physical_address(payload),
        "insurance": _insurance(payload),
    }


def lookup(usdot: str) -> dict:
    """Fetch + normalize a carrier by USDOT number. Raises MotusNotFound /
    MotusError on failure. Results are cached briefly."""
    usdot = _digits(usdot)
    if not usdot:
        raise MotusNotFound("Enter a USDOT number.")

    cached = _from_cache(usdot)
    if cached is not None:
        return cached

    try:
        resp = requests.get(
            f"{BASE}/api/carriers/{usdot}",
            headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
            timeout=TIMEOUT,
        )
    except requests.RequestException as exc:
        raise MotusError("Could not reach MOTUS. Try again shortly.") from exc

    if resp.status_code == 404:
        raise MotusNotFound(f"No carrier found for USDOT {usdot}.")
    if resp.status_code != 200:
        raise MotusError(f"MOTUS returned an error (status {resp.status_code}).")

    try:
        payload = resp.json()
    except ValueError as exc:
        raise MotusError("MOTUS returned an unexpected response.") from exc

    if not payload.get("entityName") and not payload.get("entityDotNumber"):
        raise MotusNotFound(f"No carrier found for USDOT {usdot}.")

    result = _normalize(payload)
    return _store_cache(usdot, result)


def _from_cache(usdot: str) -> Optional[dict]:
    with _cache_lock:
        hit = _cache.get(usdot)
    if hit and time.monotonic() - hit[0] < _CACHE_TTL:
        return hit[1]
    return None


def _store_cache(usdot: str, value: dict) -> dict:
    with _cache_lock:
        _cache[usdot] = (time.monotonic(), value)
    return value
