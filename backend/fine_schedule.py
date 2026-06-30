"""Default fine/penalty schedule (Schedule A) for the contract penalties page.

This is the canonical table seeded onto every Company (Company.fine_schedule).
Managers may edit a company's copy; the per-application PDF uses a snapshot taken
at creation time. Kept as plain data so the Typst page renders from it and the
admin UI can edit it. Amounts/points/text are all free-form strings on purpose —
the table carries text like "$5000, Termination" and "IC pays all charges".
"""

from copy import deepcopy
from typing import Any, Dict


def _r(violation: str, points: str, first: str, second: str = "") -> Dict[str, str]:
    return {"violation": violation, "points": points, "first": first, "second": second}


# rate_per_point is informational (printed in the "CHARGEBACKS - $N per each point"
# header). The per-row amounts are stored explicitly so any row can deviate.
DEFAULT_FINE_SCHEDULE: Dict[str, Any] = {
    "rate_per_point": 100,
    # Separate rewards table printed on the same page (DOT clean-inspection bonuses).
    "rewards": {
        "title": "DOT Inspections",
        "intro": "Inspections are listed as full inspection, walk around, and driver only. Clean inspections will be rewarded as below:",
        "rows": [
            {"label": "Level 1 – a full inspection", "amount": "$500"},
            {"label": "Level 2 – a walk-around inspection", "amount": "$350"},
            {"label": "Level 3 – a driver-only inspection", "amount": "$250"},
        ],
    },
    "sections": [
        {
            "title": "ELD VIOLATIONS",
            "rows": [
                _r("Driving beyond 14 hour duty period", "7", "$700"),
                _r("Driving beyond 11 hour driving limit", "7", "$700"),
                _r("Driving beyond 8 hour limit since last off-duty/sleeper period (30 min)", "7", "$700"),
                _r("60/70 - hour rule violation", "7", "$700"),
                _r("False report of Independent Contractor's record of duty status", "7", "$700"),
                _r("ELD - No record of duty status (ELD Required)", "5", "$500"),
                _r("Independent Contractor's record of duty status not current", "5", "$500"),
                _r("Failing to retain previous 7 days records of duty status", "5", "$500"),
                _r("Failing to note malfunction requiring use of paper log", "5", "$500"),
                _r("Onboard recording device failure: failed to reconstruct info", "5", "$500"),
                _r("Failed to assume or decline unassigned driving time", "5", "$500"),
                _r("Record of Duty Status violation (general form and manner)", "1", "$100"),
                _r("Failed to make annotations when applicable", "1", "$100"),
                _r("Failed to have sufficient supply of blank records", "1", "$100"),
                _r("Failed to certify accuracy of ELD information", "1", "$100"),
                _r("ELD/TABLET not mounted in fixed position", "1", "$100"),
                _r("Failing to maintain ELD instruction sheet", "1", "$100"),
                _r("Failed to maintain ELD malfunction reporting requirements", "1", "$100"),
            ],
        },
        {
            "title": "UNSAFE DRIVING VIOLATIONS",
            "rows": [
                _r("Speeding 15 mph or more over the speed limit", "50", "$5000, Termination"),
                _r("Speeding 11-14 mph over the speed limit", "30", "$3000, Termination"),
                _r("School zone speeding", "20", "$2,000", "$4000, Term"),
                _r("Construction zone speeding", "20", "$2,000", "$4000, Term"),
                _r("Speeding 6-10 mph over the speed limit", "10", "$1,000", "$2000, Term"),
                _r("Using hand-held mobile telephone while operating CMV", "10", "$1,000"),
                _r("Reckless driving", "10", "$1,000", "$2000, Term"),
                _r("Operating CMV while ill/fatigued", "10", "$1,000", "$2000, Term"),
                _r("Failing to use seat belt while operating CMV", "7", "$700"),
                _r("Driving in No trucks zone", "6", "$600"),
                _r("Speeding 1-5 mph over the speed limit", "5", "$500", "$1000, Term"),
                _r("Failure to Maintain Lane", "5", "$500"),
                _r("Improper lane change", "5", "$500"),
                _r("Improper turn", "5", "$500"),
                _r("Failure to obey traffic control device", "5", "$500"),
                _r("Failure to Yield right of way", "5", "$500"),
                _r("Distracted/Inattentive driving", "5", "$500"),
                _r("Following too close", "5", "$500"),
                _r("Failure to stop at weight station", "5", "$500"),
                _r("Lane Restriction violation", "3", "$300"),
                _r("Unlawfully parking and/or leaving vehicle in roadway", "1", "$100"),
                _r("Parking where prohibited or restricted", "1", "$100"),
            ],
        },
        {
            "title": "DRUGS/ALCOHOL VIOLATIONS",
            "rows": [
                _r("Driving under influence of drugs/alcohol/medicine", "40", "$4000, Termination"),
                _r("Consuming intoxicating beverage within 4 hours before operating", "20", "$2000, Termination"),
                _r("Possession of intoxicating beverage while on duty/driving", "20", "$2000, Termination"),
            ],
        },
        {
            "title": "DRIVING FITNESS VIOLATIONS",
            "rows": [
                _r("Unauthorized passenger/Independent Contractor on board CMV", "30", "$3000, Termination"),
                _r("Operating CMV without a CDL", "8", "$800"),
                _r("Driving CMV while CDL is suspended", "8", "$800"),
                _r("Operating CMV without proper endorsements", "8", "$800"),
                _r("Cannot understand highway signs/signals in English", "5", "$500"),
                _r("Cannot read/speak English sufficiently for official inquiries", "4", "Warning"),
                _r("Operating CMV without required CAB documents/permits", "3", "$300"),
                _r("Failing to carry valid medical examiner's certificate", "1", "$100"),
            ],
        },
        {
            "title": "VEHICLE MAINTENANCE VIOLATIONS",
            "rows": [
                _r("Unauthorized cargo load", "30", "$3000, Termination"),
                _r("Flat tire or fabric exposed", "8", "$800"),
                _r("Tire-ply or belt material exposed", "8", "$800"),
                _r("Tire-flat and/or audible air leak", "8", "$800"),
                _r("Tire-front tread depth less than 2/32 inch", "8", "$800"),
                _r("Axle positioning parts defective/missing", "7", "$700"),
                _r("Air suspension pressure loss", "7", "$700"),
                _r("Steering system components worn/welded/missing", "6", "$600"),
                _r("Inoperable head lamps", "6", "$600"),
                _r("Inoperable tail lamp", "6", "$600"),
                _r("Inoperative turn signal", "6", "$600"),
                _r("Operating CMV without proper load securement", "5", "$500"),
                _r("BRAKES OUT OF SERVICE (20%+ defective)", "5", "$500"),
                _r("Operating CMV without proof of periodic inspection", "4", "$400"),
                _r("Brake hose/tubing chafing and/or kinking", "4", "$400"),
                _r("Brake connections with leaks or constrictions", "4", "$400"),
                _r("Brake Tubing/Hose Adequacy - Connections to Power Unit", "4", "$400"),
                _r("Inadequate brakes for safe stopping", "4", "$400"),
                _r("Clamp/Roto type brake out-of-adjustment", "4", "$400"),
                _r("Inoperative/defective brakes", "4", "$400"),
                _r("Defective brake limiting device", "4", "$400"),
                _r("CMV automatic airbrake adjustment fails to compensate", "4", "$400"),
                _r("No/Defective ABS Malfunction Indicator", "4", "$400"),
                _r("Brakes (general)", "4", "$400"),
                _r("Brake system pressure loss", "4", "$400"),
                _r("No/defective lighting devices or reflective material", "3", "$300"),
                _r("Mud flaps retroreflective sheeting requirements", "3", "$300"),
                _r("Requirements for reflectors", "3", "$300"),
                _r("Tire underinflated", "3", "$300"),
                _r("Oil and/or grease leak", "3", "$300"),
                _r("No/discharged/unsecured fire extinguisher", "2", "$200"),
                _r("Inoperable Required Lamp", "2", "$200"),
                _r("No/insufficient warning devices", "2", "$200"),
                _r("Inspection/repair/maintenance of parts & accessories", "2", "$200"),
                _r("Hubs - oil/grease leaking", "2", "$200"),
                _r("Wheel seal leaking", "2", "$200"),
                _r("Wheel (Mud) Flaps missing or defective", "1", "$100"),
                _r("Damaged or discolored windshield", "1", "$100"),
                _r("Windshield - Obstructed", "1", "$100"),
                _r("Windshield wipers inoperative/defective", "1", "$100"),
            ],
        },
        {
            "title": "MISCELLANEOUS VIOLATIONS",
            "rows": [
                _r("Hit and Run accident - property damage", "30", "$3000, Termination"),
                _r("Use of radar detector/laser jammers while operating CMV", "20", "$2000, Termination"),
                _r("Failure to submit DOT inspections", "5", "$500"),
                _r("Amazon Relay truckload rejection", "5", "$500"),
                _r("Not following Amazon 8 Yard Rules", "5", "$500"),
                _r("Disrespectful behaviour towards company employee", "5", "$500"),
                _r("Not following any company rules", "5", "$500"),
                _r("Late delivery/failing load count/dispatcher disobedience", "3", "$300"),
                _r("Any OUT OF SERVICE violation", "3", "$300"),
                _r("Contractors involved in fighting during duty", "3", "$300"),
                _r("Legal weight violation", "", "IC pays all charges"),
                _r("Toll violation", "", "IC pays all charges"),
            ],
        },
    ],
}


def default_fine_schedule() -> Dict[str, Any]:
    """A fresh deep copy of the default schedule (safe to store/mutate)."""
    return deepcopy(DEFAULT_FINE_SCHEDULE)


# Compact operational "FINES AND FEES SCHEDULE" — a flat violation -> flat-fee list,
# separate from the detailed Schedule A above. Editable per company (values only); the
# governed-speeds paragraph beside it stays static in the Typst page.
DEFAULT_FEES_SCHEDULE: Dict[str, Any] = {
    "title": "FINES AND FEES SCHEDULE",
    "rows": [
        {"violation": "Failure to sign the bill of lading with date, signature, name of the company, and number of PCS or PLTS", "fee": "$50"},
        {"violation": "Failure to report/turn in roadside inspection or ticket on time", "fee": "$500"},
        {"violation": "Failure to notify the company of a CDL suspension", "fee": "$500"},
        {"violation": "Allowing a not qualified or unauthorized person to drive (primary driver must agree to take all responsibility for an unauthorized driver for any incidents or accidents that may occur on the road)", "fee": "$1000"},
        {"violation": "Failure to report an accident immediately", "fee": "$1000"},
        {"violation": "Failure to report an accident involving tow or injury", "fee": "$1000"},
        {"violation": "Failure to report an accident requiring drug & alcohol test (if the driver refuses to do drug and alcohol test license will be suspended)", "fee": "$1500"},
        {"violation": "Towing costs for illegal/improper parking", "fee": "Driver Liability"},
        {"violation": "Citation for overweight trailer", "fee": "Driver Liability"},
        {"violation": "Late billing of loads", "fee": "$50 + loss of pay"},
        {"violation": "Failure to turn in POD", "fee": "$25 each + charge as the same as load, if we can't find the POD"},
        {"violation": "Failure to report trailer damage", "fee": "$100 + driver will be charged for repairs"},
        {"violation": "Tickets received for unreported trailer defects or damage", "fee": "Driver pays the ticket"},
        {"violation": "Any illegal parking tickets", "fee": "Driver pays the ticket"},
        {"violation": "Fines for expired permits, or annual truck/trailer inspections", "fee": "Driver pays"},
        {"violation": "Pass weight station on purpose", "fee": "$500"},
        {"violation": "Other violations", "fee": "$35/point + lawyer fee"},
        {"violation": "Late Pick-up and Late deliveries", "fee": "$150 each"},
    ],
}


def default_fees_schedule() -> Dict[str, Any]:
    """A fresh deep copy of the default compact fees schedule (safe to store/mutate)."""
    return deepcopy(DEFAULT_FEES_SCHEDULE)
