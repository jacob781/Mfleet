// =============================================================================
// PAGES 22-33: POLICY ACKNOWLEDGEMENT PAGES
// Reusable template for simple policy pages with header, title, text, signature
// =============================================================================

#import "../styles.typ": *

// Page 22: Passenger Allowance
#let page-passenger-allowance(data) = {
  pagebreak()
  
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(2em)
  
  align(center)[
    #text(size: 18pt, weight: "bold")[PASSENGER ALLOWANCE]
  ]
  
  v(1.5em)
  
  text(size: 10pt)[
    It is mandatory that Independent Contractors inform and request an approval form from Safety Management for any passenger to be allowed in the tractor while under dispatch. Allowing an unauthorized and unqualified Independent Contractor in the vehicle or to operate the vehicle under company's DOT will result in immediate termination.
  ]
  
  v(1em)
  
  [I,#underlined(driver-name(data), width: 3in), have read and understood the requirements stated above. I agree to fulfill the conditions above and will not violate any of the mentioned conditions. I understand that failure to cooperate and follow the instructions given above will result in additional charges which may be deducted from my settlement provided CARRIER provides written notice of said deductions and/or possible termination of the contract.]
  
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

// Page 23: Roadside Inspections
#let page-roadside-inspections(data) = {
  pagebreak()
  
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(2em)
  
  align(center)[
    #text(size: 18pt, weight: "bold")[ROADSIDE INSPECTIONS & VIOLATIONS]
  ]
  
  v(1.5em)
  
  text(size: 10pt)[
    Please be advised that ALL roadside inspections, weight station check-ups and papers received from the police and authorized DOT inspectors are to be immediately reported to the Safety Director and forwarded to the Safety Management no later than 10 days from the preformed inspection.
  ]
  
  v(1em)
  
  [I,#underlined(driver-name(data), width: 3in), have read and understood the requirement to obtain a copy of any roadside inspection and report it to the Safety Management. I understand that failure to comply with this requirement may result with additional charges which may be deducted from my settlement provided CARRIER provides written notice of said deductions and/or possible termination of the contract.]
  
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

// Page 24: License Status & Suspension
#let page-license-suspension(data) = {
  pagebreak()
  
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(2em)
  
  align(center)[
    #text(size: 18pt, weight: "bold")[LICENSE STATUS & SUSPENSION]
  ]
  
  v(1.5em)
  
  text(size: 10pt)[
    Independent Contractors must report all traffic violations and any changes that may appear on their driving records to Safety Management. Independent Contractors must immediately report a warning for suspension or an announced suspension of their driving privileges. Failure to report will result in immediate termination.
  ]
  
  v(1em)
  
  [I,#underlined(driver-name(data), width: 3in), have read and understood the requirement for reporting of traffic violations and CDL suspensions to Safety Management and agree to comply with the conditions stated above.]
  
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

// Page 25: Unresolved Claims & Violations
#let page-unresolved-claims(data) = {
  pagebreak()
  
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(2em)
  
  align(center)[
    #text(size: 18pt, weight: "bold")[UNRESOLVED CLAIMS & VIOLATIONS]
  ]
  
  v(1.5em)
  
  text(size: 10pt)[
    INDEPENDENT CONTRACTOR acknowledges that Shipper's may make claims against CARRIER for loads delivered by INDEPENDENT CONTRACTOR after CARRIER has paid INDEPENDENT CONTRACTOR for said delivery. In the event a claim is timely made by a Shipper under its agreement with CARRIER, CARRIER shall be entitled to deduct from any settlement due INDEPENDENT CONTRACTOR, or in the event any settlement is not due, from INDEPENDENT CONTRACTOR's security deposit, the amount of Shipper's claim and hold said funds until Shipper's claim is resolved. CARRIER shall provide INDEPENDENT CONTRACTOR written notice before deducting said sum.
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    Within thirty (60) days of resolution of Shipper's claim, CARRIER shall return any money deducted by CARRIER which is in excess of INDEPENDENT CARRIER's liability for Shipper's claim.
  ]
  
  v(1em)
  
  [I,#underlined(driver-name(data), width: 3in), have read and understood the conditions stated above and I agree to comply with the requirement mentioned.]
  
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

// Page 26: Accident Reporting
#let page-accident-reporting(data) = {
  pagebreak()
  
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(2em)
  
  align(center)[
    #text(size: 18pt, weight: "bold")[ACCIDENT REPORTING]
  ]
  
  v(1.5em)
  
  text(size: 10pt)[
    Independent Contractors must immediately report accidents to Safety Management and comply with all the requirements and instructions in case of an accident. Both minor and major accidents must be reported to the Safety Management, regardless of time and day of the week. Detailed information of the accident, involving party's insurance and other information, photographs and police report information must be submitted within 8 hours of the time of occurrence. In case of death, bodily injuries, towing, or issuance of citation, the Independent Contractor must take a drug and alcohol test within 8 hours of the time of accident. Failure to comply will result in termination and/or additional charges which may be deducted from my settlement provided CARRIER provides written notice of said deductions and/or possible termination of the contract.
  ]
  
  v(1em)
  
  [I,#underlined(driver-name(data), width: 3in), have read and understood the requirement for reporting accidents to Safety Management and agree to comply with the conditions stated above.]
  
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
