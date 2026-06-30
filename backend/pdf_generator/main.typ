// =============================================================================
// MAIN.TYP - Driver Application PDF Generator (REBUILT)
// =============================================================================

#import "styles.typ": *

// Load payload from command line
#let raw_payload = sys.inputs.at("payload", default: "{}")
#let data = json(bytes(raw_payload))

// Page setup
#set page(
  paper: "us-letter",
  margin: page-margin,
)

#set text(
  font: main-font,
  size: body-size,
)

// =============================================================================
// PAGE MODULES
// =============================================================================

#import "pages/p01_personal_info.typ": page-personal-info
#import "pages/p02_driving_history.typ": page-driving-history
#import "pages/p03_qualifications.typ": page-qualifications
#import "pages/p04_05_employment_record.typ": page-employment-record
#import "pages/p06_07_employer_verification.typ": page-employer-verification
#import "pages/p08_driving_record_auth.typ": page-driving-record-auth
#import "pages/p09_seven_day_log.typ": page-seven-day-log
#import "pages/p10_safety_training.typ": page-safety-training
#import "pages/p11_fair_credit_consent.typ": page-fair-credit-consent
#import "pages/p12_certification_violations.typ": page-certification-violations
#import "pages/p13_license_compliance.typ": page-license-compliance
#import "pages/p14_employment_declaration.typ": page-employment-declaration
#import "pages/p15_16_confidentiality_nda.typ": page-confidentiality-nda
#import "pages/p17_workers_comp_waiver.typ": page-workers-comp-waiver
#import "pages/p18_no_return_vehicle.typ": page-no-return-vehicle
#import "pages/p19_20_leased_contractor.typ": page-leased-contractor-agreement

// Sprint 4: Equipment & Additional Policies
#import "pages/p21_equipment_supplement.typ": page-equipment-supplement
#import "pages/p22_26_policy_pages.typ": page-passenger-allowance, page-roadside-inspections, page-license-suspension, page-unresolved-claims, page-accident-reporting
#import "pages/p27_33_policy_pages.typ": page-pretrip-inspections, page-damages-towing, page-insurance-consent, page-ic-acknowledgement, page-hours-of-service, page-fmcsa-clearinghouse

// Sprint 5: Financial & Additional Forms
#import "pages/p50_direct_deposit.typ": page-direct-deposit
#import "pages/p51_53_penalties.typ": page-penalties-intro
#import "pages/p58_fines_fees.typ": page-fines-fees
#import "pages/p54_55_dash_camera_policy.typ": page-dash-camera-policy
#import "pages/p56_57_hold_harmless.typ": page-hold-harmless
#import "pages/p60_incident_protocol.typ": page-incident-protocol

// Sprint 5: Owner-Only Pages (Lease Agreement)
#import "pages/p34_47_lease_agreement.typ": page-lease-agreement
#import "pages/p48_supplement_b.typ": page-supplement-b

// =============================================================================
// DOCUMENT GENERATION
// =============================================================================

// Page 1: Personal Information
#page-personal-info(data)

// Page 2: Driving History
#page-driving-history(data)

// Page 3: Qualifications
#page-qualifications(data)

// Pages 4-5: Employment Record
#page-employment-record(data)

// Pages 6-7: Employer Verification (per employer)
#page-employer-verification(data)

// Page 8: Driving Record Authorization
#page-driving-record-auth(data)

// Page 9: Seven Day Work Statement
#page-seven-day-log(data)

// Page 10: Safety Training
#page-safety-training(data)

// Page 11: Fair Credit + Alcohol Consent
#page-fair-credit-consent(data)

// Page 12: Certification of Violations
#page-certification-violations(data)

// Page 13: License Compliance
#page-license-compliance(data)

// Page 14: Employment Declaration
#page-employment-declaration(data)

// Pages 15-16: Confidentiality NDA
#page-confidentiality-nda(data)

// Page 17: Workers' Compensation Waiver
#page-workers-comp-waiver(data)

// Page 18: No Return Vehicle Policy
#page-no-return-vehicle(data)

// Pages 19-20: Leased Independent Contractor Agreement
#page-leased-contractor-agreement(data)

// =============================================================================
// SPRINT 4: EQUIPMENT & ADDITIONAL POLICIES (Pages 21-33)
// =============================================================================

// Page 21: Equipment Supplement
#page-equipment-supplement(data)

// Page 22: Passenger Allowance
#page-passenger-allowance(data)

// Page 23: Roadside Inspections
#page-roadside-inspections(data)

// Page 24: License Status & Suspension
#page-license-suspension(data)

// Page 25: Unresolved Claims
#page-unresolved-claims(data)

// Page 26: Accident Reporting
#page-accident-reporting(data)

// Page 27: Pre-Trip & Post-Trip Inspections
#page-pretrip-inspections(data)

// Page 28: Damages, Towing & Violation
#page-damages-towing(data)

// Page 29: Insurance Consent
#page-insurance-consent(data)

// Pages 30-31: Independent Contractor Acknowledgement
#page-ic-acknowledgement(data)

// Page 32: Hours of Service Requirements
#page-hours-of-service(data)

// Page 33: FMCSA Clearinghouse Consent
#page-fmcsa-clearinghouse(data)

// =============================================================================
// SPRINT 5: LEASE AGREEMENT & COMPENSATION (Pages 34-48)
// Pages 34-47: OWNER ONLY - Only included if driver is owner
// =============================================================================

// Check if driver is owner
#let is-owner = data.at("is_owner", default: false)

// Pages 34-47: Lease Agreement (OWNER ONLY)
#if is-owner {
  page-lease-agreement(data)
}

// Page 48: Supplement B - Schedule of Compensation (always present)
#page-supplement-b(data)

// =============================================================================
// SPRINT 5: FINANCIAL & ADDITIONAL FORMS
// Order: [Penalties] -> W-9 -> Direct Deposit -> Dash Camera -> Hold Harmless -> Incident
// The W-9 (fw9.pdf) is spliced in by pdf_generator.py at the anchor page below.
// =============================================================================

// Penalties (Schedule A) — optional, manager-toggled, placed BEFORE the W-9.
#let include-penalties = data.at("config", default: (:)).at("include_penalties", default: true)
#if include-penalties {
  page-penalties-intro(data)
}

// Compact FINES AND FEES SCHEDULE — separate manager toggle.
#let include-fees = data.at("config", default: (:)).at("include_fees", default: true)
#if include-fees {
  page-fines-fees(data)
}

// W-9 insertion anchor: the merge step replaces THIS throwaway page with the
// 6-page IRS W-9 PDF. Marker must stay unique and on its own page.
#pagebreak()
#text(fill: white)[W9INSERTANCHORPAGE]

// Page 50: Direct Deposit Agreement Form
#page-direct-deposit(data)

// Pages 54-55: Dash Camera Policy
#page-dash-camera-policy(data)

// Pages 56-57: Hold Harmless Agreement
#page-hold-harmless(data)

// Page 60: Incident Response Protocol
#page-incident-protocol(data)
