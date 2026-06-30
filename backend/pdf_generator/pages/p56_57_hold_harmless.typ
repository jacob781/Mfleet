// =============================================================================
// PAGES 56-57: HOLD HARMLESS AGREEMENT
// =============================================================================

#import "../styles.typ": *

#let page-hold-harmless(data) = {
  pagebreak()
  
  align(center)[
    #text(size: 16pt, weight: "bold")[HOLD HARMLESS AGREEMENT]
  ]
  
  v(1em)
  
  [This Hold Harmless Agreement ("Agreement") is made and entered into on this #underlined(agreement-date(data), width: 1.5in), by and between:]
  
  v(1em)
  
  text(size: 11pt, weight: "bold")[Motor Carrier:]
  
  v(0.5em)
  
  grid(
    columns: (1in, 1fr),
    row-gutter: 0.8em,
    [Name:], [#underlined(company-name(data), width: 3in)],
    [USDOT \#:], [#underlined(data.config.company_dot, width: 2in)],
    [MC \#:], [#underlined(data.config.company_mc, width: 2in)],
    [Address:], [#underlined(data.config.company_address + ", " + data.config.company_city + ", " + data.config.company_state + " " + data.config.company_zip, width: 4in)],
  )
  
  v(0.5em)
  
  [AND]
  
  v(0.5em)
  
  text(size: 11pt, weight: "bold")[Independent Contractor:]
  
  v(0.5em)
  
  // Label column wide enough to keep the long CDL label to ~2 lines; values
  // bottom-aligned so a one-line value sits on the last line of a wrapping label.
  grid(
    columns: (2.2in, 1fr),
    row-gutter: 0.8em,
    align: (x, _) => if x == 0 { left + top } else { left + bottom },
    [Name:], [#underlined(driver-name(data), width: 3in)],
    [Address:], [#underlined(data.address.street + ", " + data.address.city + ", " + data.address.state + " " + data.address.zip, width: 4in)],
    [Phone:], [#underlined(data.phone, width: 2in)],
    [Independent Contractor's License/CDL \#:], [#underlined(data.cdl.number, width: 2in)],
  )
  
  v(1em)
  
  text(size: 11pt, weight: "bold")[RECITALS]
  
  v(0.5em)
  
  text(size: 10pt)[
    WHEREAS, the Independent Contractor has entered into an agreement with the Motor Carrier to provide transportation or related services using a vehicle owned or operated by the Contractor;
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    WHEREAS, the parties desire to allocate certain risks between them and provide indemnification for liabilities that may arise out of the performance of such services;
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    NOW, THEREFORE, in consideration of the mutual covenants and promises contained herein, the parties agree as follows:
  ]
  
  v(1em)
  
  text(size: 11pt, weight: "bold")[1. HOLD HARMLESS & INDEMNIFICATION]
  
  v(0.5em)
  
  text(size: 10pt)[
    The Independent Contractor agrees to indemnify, defend, and hold harmless the Motor Carrier, its officers, agents, employees, successors, and assigns from and against any and all claims, damages, losses, liabilities, judgments, fines, penalties, costs, and expenses (including attorney's fees) arising from:
  ]
  
  v(0.3em)
  
  list(
    marker: [•],
    indent: 1em,
    [Personal injury, bodily injury, or death to any person;],
    [Damage to property (including third-party or company property);],
    [Any violation of laws, regulations, or ordinances;],
    [Any negligent or intentional act or omission by the Contractor or their agents;],
    [Any accident, incident, or event occurring during the performance of contracted services.],
  )
  
  // Page 57 (continued)
  pagebreak()
  
  text(size: 11pt, weight: "bold")[2. INSURANCE]
  
  v(0.5em)
  
  text(size: 10pt)[
    The Independent Contractor agrees to maintain at their own expense, during the term of this Agreement, the following insurance coverages:
  ]
  
  v(0.3em)
  
  // Get configurable insurance options
  let config = data.at("config", default: (:))
  let include-auto-liability = config.at("include_auto_liability", default: false)
  let include-cargo = config.at("include_cargo", default: false)
  
  // Build insurance list dynamically
  let insurance-items = ()
  
  // Non-trucking Liability - always included
  insurance-items.push([Non-trucking Liability Insurance with limits not less than \$1,000,000;])
  
  // Occupational Accident - always included
  insurance-items.push([Occupational Accident or Workers' Compensation Insurance;])
  
  // Auto Liability - only if manager enables
  if include-auto-liability {
    insurance-items.push([Auto Liability Insurance with limits not less than \$1,000,000;])
  }
  
  // Cargo Insurance - only if manager enables
  if include-cargo {
    insurance-items.push([Cargo Insurance (if hauling goods);])
  }
  
  // Physical damage - always shown as optional
  insurance-items.push([Physical damage coverage (optional). Motor Carrier is not responsible for Physical damage coverage.])
  
  // Any other insurance - always included
  insurance-items.push([Any other insurance required by law or by the Motor Carrier agreement. Proof of such insurance shall be provided to the Motor Carrier upon request.])
  
  list(
    marker: [•],
    indent: 1em,
    ..insurance-items
  )
  
  v(0.5em)
  
  text(size: 11pt, weight: "bold")[3. NO EMPLOYMENT RELATIONSHIP]
  
  v(0.5em)
  
  text(size: 10pt)[
    Nothing in this Agreement shall be construed to create an employer-employee relationship. The Contractor shall act as an #text(weight: "bold")[independent contractor] and is responsible for their own taxes, permits, and compliance obligations.
  ]
  
  v(0.5em)
  
  text(size: 11pt, weight: "bold")[4. TERM AND TERMINATION]
  
  v(0.5em)
  
  text(size: 10pt)[
    This Agreement shall remain in effect for the duration of the working relationship between the parties and shall survive the termination of such relationship as to any claims arising out of services performed during the effective period.
  ]
  
  v(0.5em)
  
  text(size: 11pt, weight: "bold")[5. GOVERNING LAW]
  
  v(0.5em)
  
  // Get company state from config
  let company-state = config.at("company_state", default: "")
  
  text(size: 10pt)[
    This Agreement shall be governed by and construed in accordance with the laws of the State of #underlined(company-state, width: 1.5in).
  ]
  
  v(1em)
  
  text(size: 10pt, weight: "bold")[IN WITNESS WHEREOF, the parties have executed this Hold Harmless Agreement as of the date first written above.]
  
  v(1.5em)
  
  text(size: 10pt, weight: "bold")[Motor Carrier Representative:]
  
  v(0.5em)
  
  grid(
    columns: (0.7in, 1fr),
    row-gutter: 0.8em,
    [Name:], [#underlined(company-name(data), width: 2.5in)],
    [Title:], [#underlined(carrier-title, width: 2.5in)],
    [Signature:], [#carrier-signature(data, width: 2.5in)],
    [Date:], [#underlined(carrier-date(data), width: 2in)],
  )
  
  v(1em)
  
  text(size: 10pt, weight: "bold")[Independent Contractor:]
  
  v(0.5em)
  
  grid(
    columns: (0.8in, 1fr),
    row-gutter: 0.8em,
    [Name:], [#underlined(driver-name(data), width: 3in)],
    [Signature:], [#driver-signature(data, width: 3in)],
    [Date:], [#underlined(fill-date(data), width: 2in)],
  )
}
