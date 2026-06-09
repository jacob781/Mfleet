// =============================================================================
// PAGES 27-33: MORE POLICY ACKNOWLEDGEMENT PAGES
// =============================================================================

#import "../styles.typ": *

// Page 27: Pre-Trip & Post-Trip Inspections
#let page-pretrip-inspections(data) = {
  pagebreak()
  
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(2em)
  
  align(center)[
    #text(size: 18pt, weight: "bold")[PRE- TRIP & POST TRIP INSPECTIONS]
  ]
  
  v(1.5em)
  
  text(size: 10pt)[
    DOT Rules and Regulations require that every INDEPENDENT CONTRACTOR must complete pre/post trip inspections of any trailer promptly after attaching the trailer to the tractor and before detaching the same trailer at the assigned terminal on a CARRIER's pre-printed inspection form supplied to INDEPENDENT CONTRACTOR a copy of which INDEPENDENT CONTRACTOR acknowledges receiving. INDEPENDENT CONTRACTOR shall be held accountable for any damages and preventable maintenance issues that have not been reported at the time of drop off which may be deducted from INDEPENDENT CONTRACTOR's settlement provided CARRIER has provided written notice of the deduction before it is taken.
  ]
  
  v(1em)
  
  [I#underlined(driver-name(data), width: 3in), have read and understood the requirements stated above. I agree to fulfill the conditions above and will not violate any of the mentioned conditions.]
  
  v(0.5em)
  
  [I understand that failure to cooperate and follow the instructions given above will result in additional charges and possible termination of the contract.]
  
  v(3em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Independent Contractor Signature#underlined("", width: 2.5in)],
    [DATE#underlined("", width: 1.2in)]
  )
  
  v(3em)
  
  [Company Representative#underlined("", width: 3in)]
}

// Page 28: Damages, Towing & Violation
#let page-damages-towing(data) = {
  pagebreak()
  
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(2em)
  
  align(center)[
    #text(size: 18pt, weight: "bold")[DAMAGES,TOWING, & VIOLATION]
  ]
  
  v(1.5em)
  
  text(size: 10pt)[
    INDEPENDENT CONTRACTOR will be held liable for any damages, towing or other inflicted casualties that company suffers due to INDEPENDENT CONTRACTOR error. All damages done by or because of INDEPENDENT CONTRACTORS negligence or inattentiveness will be taken out of INDEPENDENT CONTRACTORS pay or SUBROGATE for damages, towing, and other expenses such as recovery and suffered penalization.
  ]
  
  v(1em)
  
  [I,#underlined(driver-name(data), width: 3in), have read and understood the requirements stated above. I agree to fulfill the conditions above and will not violate any of the mentioned conditions. I understand that failure to cooperate and follow the instructions given above will result in additional charges and possible termination of the contract.]
  
  v(3em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Independent Contractor Signature#underlined("", width: 2.5in)],
    [DATE#underlined("", width: 1.2in)]
  )
  
  v(3em)
  
  [Company Representative#underlined("", width: 3in)]
}

// Page 29: Insurance Consent (Leased IC Agreement)
#let page-insurance-consent(data) = {
  pagebreak()
  
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(0.5em)
  
  align(center)[
    #text(size: 12pt, style: "italic", weight: "bold")[LeasedIndependent Contractor Agreement]
  ]
  
  v(0.5em)
  
  rect(width: 100%, stroke: 0.5pt, inset: 8pt)[
    #text(size: 12pt, weight: "bold")[CONSENT FOR INSURANCE REQUIREMENTS AND CHARGES]
  ]
  
  v(1em)
  
  text(size: 9pt)[
    Independent Contractor that operate commercial motor vehicles under #text(weight: "bold")[#underline[#company-name(data)]] Motor Carrier Authority are required to be covered under valid Bobtail and Physical Damage insurance policies in the amount of at least \$1,000,000.00 (combined single limits covering "bobtail and "dead heading") and are fully responsible for any charges that apply. Independent Contractor as will furnish CARRIER with a Certificate of Insurance naming CARRIER as an additional insured.
  ]
  
  v(0.5em)
  
  text(size: 9pt)[
    Independent Contractor shall maintain in effect insurance coverage for collision, fire, theft, or other catastrophe. Exclusive possession of Equipment by Carrier notwithstanding, Independent Contractor as party having physical control over Equipment agrees to be fully responsible for its safekeeping and CARRIER assumes no liability for fire, theft, or damage to Equipment
  ]
  
  text(size: 9pt)[
    As required by #data.config.company_state State Law Independent Contractor must provide at execution of this Lease Proof of Workman's Compensation Insurance, covering himself as a Independent Contractor if applicable, effective as of the date of this Lease Agreement.
  ]
  
  text(size: 9pt)[
    If Independent Contractor hires Independent Contractors to operate his unit Independent Contractor must obtain his own Workman's Compensation Insurance Policy for that Independent Contractor or any other Independent Contractors of the unit.
  ]
  
  text(size: 9pt)[
    CARRIER assumes no liability for Workman's Compensation claims under this Lease Agreement.
  ]
  
  v(1em)
  
  [I,#underlined(driver-name(data), width: 3in)have read and understood the requirements stated above. I understand that the total charges for all the above insurance are my responsibility and that in the event I fail to make such payments CARRIER is not required to but may advance said payment and any amount advanced payments will be withheld from my WEEKLY /MONTHLY settlements after CARRIER provides written notice of said deductions.]
  
  v(2em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Independent Contractor Signature#underlined("", width: 2.5in)],
    [DATE#underlined("", width: 1.2in)]
  )
}

// Pages 30-31: Independent Contractor Acknowledgement (2 pages)
#let page-ic-acknowledgement(data) = {
  pagebreak()
  
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(0.5em)
  
  align(center)[
    #text(size: 12pt, weight: "bold")[Independent Contractor Acknowledgement]
  ]
  
  v(0.5em)
  
  [Upon completion of the onboarding process will #text(weight: "bold")[#underline[#company-name(data)]] Independent Contractor from this day #underlined("", width: 1.5in) forward agrees to abide to the following terms:]
  
  v(0.5em)
  
  text(size: 9pt)[
    -Independent Contractor is responsible for maintaining his truck to proper FMCSA regulation. If issue with truck not reported to owner in timely fashion Independent Contractor will be held accountable for all repairs & costs pertaining to issue.
  ]
  
  v(0.5em)
  
  text(size: 9pt)[
    -Independent Contractor is responsible for maintaining tire tread & condition. Failure to notify in advance about wear and tear will result in financial penalties from Independent Contractor.
  ]
  
  v(0.5em)
  
  text(size: 9pt)[
    -Independent Contractor is responsible for completing Pre- trip & post – trip inspection.
  ]
  
  v(0.5em)
  
  text(size: 9pt)[
    -Independent Contractor must maintain a lock on his trailer while loaded. If there is a seal attached seal number must be stated on BOL.
  ]
  
  v(0.5em)
  
  text(size: 9pt)[
    -If BOL contains any written statement about product conditions pertain but not limited to damaged/ missing Independent Contractor must report to dispatch immediately.
  ]
  
  v(0.5em)
  
  text(size: 9pt)[
    -Independent Contractor is responsible for the condition of the load inside his trailer. If loaded with closed doors he must notify dispatcher at time of loading to avoid possible claims. If Independent Contractor closes doors himself, he is responsible for taking picture of loaded product & sending to dispatch.
  ]
  
  v(0.5em)
  
  text(size: 9pt)[
    -Independent Contractor is responsible for inspecting his trailer. If damage occurs at shipper/ receiver and is not reported in a timely fashion Independent Contractor will be held liable for damages.
  ]
  
  v(0.5em)
  
  text(size: 9pt)[
    -Independent Contractor understands that he will be held accountable for any load that he accepts past pickup. If load is picked up must be delivered. Failure to deliver load will result in financial penalty in the amount needed to deliver the load.
  ]
  
  v(0.5em)
  
  text(size: 9pt)[
    -Independent Contractor is responsible for securing the load. If Independent Contractor sees load needs more then load bars/ straps he is to immediately contact dispatch and notate issue with broker to avoid possible claim.
  ]
  
  // Page 31 (continued)
  pagebreak()
  
  text(size: 9pt)[
    -Independent Contractor understands that any violation that he receives on the road will amount to financial penalty as it impacts both Independent Contractor & company record.
  ]
  
  v(0.5em)
  
  text(size: 9pt)[
    -Independent Contractor understands that he is to send in all original violation / inspection reports to the company within 15 days. Failure to do so will result in financial penalty.
  ]
  
  v(0.5em)
  
  text(size: 9pt)[
    -Independent Contractor is responsible for submitting ALL BOL's, lumpers, receipts (and any other loading / driving expenses) to accounting within a 2 week period.
  ]
  
  v(0.5em)
  
  // Get configurable deposit values with defaults
  let config = data.at("config", default: (:))
  let deposit-amount = config.at("deposit_amount", default: 2500)
  let deposit-weeks = config.at("deposit_weeks", default: 5)
  let weekly-payment = if deposit-weeks > 0 { calc.round(deposit-amount / deposit-weeks) } else { 0 }
  
  text(size: 9pt)[
    -Independent Contractor understands that he is liable for a deposit amounting in \$#deposit-amount this sum will be collected in a span of #deposit-weeks weeks at a sum of #weekly-payment\$.
  ]
  
  v(0.5em)
  
  text(size: 9pt)[
    -Independent Contractor understands that this deposit is unutilized for compensation towards any claims, damages, penalties Independent Contractor may leave behind after termination. If no claims, damages, financial perjuries are left behind and Independent Contractor gives at least a 2 week notice then deposit will be fully reimbursed to him 45 days after termination.
  ]
  
  v(1em)
  
  [I #underlined(driver-name(data), width: 3in) understand and agree fully to the terms written in this contract.]
  
  v(2em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Independent Contractor Signature#underlined("", width: 2.5in)],
    [Date#underlined("", width: 1.2in)]
  )
}

// Page 32: Hours of Service Requirements
#let page-hours-of-service(data) = {
  pagebreak()
  
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(0.5em)
  
  align(center)[
    #text(size: 12pt, weight: "bold")[Hours of service requirements]
  ]
  
  v(0.5em)
  
  text(size: 9pt)[
    This is to confirm that the Independent Contractor #underlined(driver-name(data), width: 2in), has received and has had training in company and DOT rules and regulations. As required by our company and DOT regulations, I agree to read and familiarize myself with the following handbooks, which are required to be in each vehicle and are available through the company. Hours of service requirements are detailed in CFR 49 Part 395 of FMCSR. These regulations were written to reduce accidents/injuries due to Independent Contractor fatigue. The rules are as follows:
  ]
  
  v(0.5em)
  
  text(size: 9pt)[
    • #underline[*11-Hour Driving Limit:*] You cannot drive again until you have completed a 10-hour break after driving 11 hours since your last 10-hour break
  ]
  
  v(0.3em)
  
  text(size: 9pt)[
    • #underline[*14-Hour Limit:*] You cannot drive again until you have completed a 10-hour break after being on duty for 14 hours since your last 10-hour break
  ]
  
  v(0.3em)
  
  text(size: 9pt)[
    • #underline[*Rest Breaks:*] May drive only if 8 hours or less have passed since the end of Independent Contractor's last off-duty or sleeper berth period of at least 30 minutes.
  ]
  
  v(0.3em)
  
  text(size: 9pt)[
    • #underline[*60 Hour Rules*]: You cannot drive again until you have hours available after having been on duty 60 hours in the past seven days - to be able to be on duty again you must be off duty for at least 34 consecutive hours
  ]
  
  v(0.3em)
  
  text(size: 9pt)[
    • #underline[*70 Hour Rules:*] You cannot drive again until you have hours available after having been on duty 70 hours in the past eight days-to be able to be on duty again you must be off duty for at least 34 consecutive hours.
  ]
  
  v(0.3em)
  
  text(size: 9pt)[
    • #underline[*Falsification:*] You cannot falsify your logs or hide an hours of service violation. All fuel and toll receipts as well as any other documents with a date or time will be checked against logs for accuracy.
  ]
  
  v(0.3em)
  
  text(size: 9pt)[
    The following information must be included in your ELD on the Profile form in addition to the grid:
  ]
  
  v(0.3em)
  
  set enum(numbering: "1.")
  text(size: 9pt)[
    + Date
    + Total miles driving today
    + Truck or tractor and trailer number
    + Name of carrier
    + Independent Contractor's signature/certification
    + 24-hour period starting time (e.g. midnight, 9:00 a.m., noon, 3:00 p.m.)
    + Main office address
    + Remarks
    + Name of co-Independent Contractor
    + Total hours (far right edge of grid)
    + Shipping document number(s), or name of shipper and commodity
    + Pickup (FROM) location and Delivery (TO) destination
  ]
  
  v(1em)
  
  [Independent Contractor Name #underlined(driver-name(data), width: 3in)]
  
  v(0.5em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Independent Contractor Signature#underlined("", width: 2.5in)],
    [Date#underlined("", width: 1.2in)]
  )
  
  v(0.5em)
  
  grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [Safety Department#underlined("", width: 2in)],
    [Date#underlined("", width: 1.2in)]
  )
}

// Page 33: FMCSA Drug & Alcohol Clearinghouse Consent
#let page-fmcsa-clearinghouse(data) = {
  pagebreak()
  
  align(center)[
    #text(size: 16pt, weight: "bold")[General Consent for Limited Queries of the Federal Motor Carrier Safety Administration (FMCSA) Drug and Alcohol Clearinghouse]
  ]
  
  v(2em)
  
  [I,#underlined(driver-name(data), width: 3in), hereby provide consent to #text(weight: "bold")[#underline[#company-name(data)]] to conduct a limited query of the FMCSA Commercial Independent Contractor's License Drug and Alcohol Clearinghouse (Clearinghouse) to determine whether drug or alcohol violation information about me exists in the Clearinghouse.]
  
  v(1em)
  
  [I understand that if the limited query conducted by #text(weight: "bold")[#underline[#company-name(data)]] indicates that drug or alcohol violation information about me exists in the Clearinghouse, FMCSA will not disclose that information to #text(weight: "bold")[#underline[#company-name(data)]] without first obtaining additional specific consent from me.]
  
  v(1em)
  
  [I further understand that if I refuse to provide consent for #text(weight: "bold")[#underline[#company-name(data)]] to conduct a limited query of the Clearinghouse, #text(weight: "bold")[#underline[#company-name(data)]] must prohibit me from performing safety-sensitive functions, including driving a commercial motor vehicle, as required by FMCSA's drug and alcohol program regulations.]
  
  v(4em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Employee Signature#underlined("", width: 2.5in)],
    [Date#underlined("", width: 1.2in)]
  )
}
