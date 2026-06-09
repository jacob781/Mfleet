// =============================================================================
// PAGE 12: CERTIFICATION OF VIOLATIONS
// =============================================================================

#import "../styles.typ": *

#let page-certification-violations(data) = {
  pagebreak()
  
  // Header
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(1.5em)
  
  // Title
  align(center)[
    #text(size: 12pt, weight: "bold")[CERTIFICATION OF VIOLATIONS]
  ]
  
  v(1em)
  
  text(size: 10pt, weight: "bold")[
    MOTOR CARRIER INSTRUCTIONS: Each motor carrier shall, at least once every 12 months, require each Independent Contractor it employs to prepare and furnish it with a list of all violations of motor vehicle traffic laws and ordinances (other than violations for parking only) of which the Independent Contractor has been convicted, or on account of which he has forfeited bond or collateral during the preceding 12 months. (Section 391.27)
  ]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[
    Independent Contractors who have provided information required by Section 383.31 need not repeat that information.
  ]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[
    INDEPENDENT CONTRACTOR REQUIREMENTS: Each Independent Contractor shall furnish the list as required by the motor carrier above. If the Independent Contractor has not been convicted of, or forfeited bond or collateral on account of any violation which must be listed, he shall so certify. (Section 391.27)
  ]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[
    I certify that the following is a true and complete list of traffic violations required to be listed (other than those I have provided under Part 383 for which I have been convicted or forfeited bond or collateral during the past 12 months.
  ]
  
  v(0.8em)
  
  // Violations table
  table(
    columns: (0.8fr, 1.5fr, 1.2fr, 1fr),
    stroke: 0.5pt,
    inset: 8pt,
    align: center,
    text(weight: "bold")[Date],
    text(weight: "bold")[Offense],
    text(weight: "bold")[Location],
    text(weight: "bold")[Type of Vehicle Operated],
    ..for i in range(11) {
      ([],[], [], [])
    }
  )
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[
    If no violations are listed above, I certify that I have not been convicted or forfeited bond or collateral on account of any violation (other than those I have provided under Part 383) required to be listed during the past 12 months.
  ]
  
  v(1.5em)
  
  [Independent Contractor 's license \##underlined(data.cdl.number, width: 3in)]
  
  v(0.5em)
  
  [State:#underlined(data.cdl.state, width: 0.8in) Exp. Date:#underlined(format-date(data.cdl.expiration), width: 1.2in)]
  
  v(1em)
  
  grid(
    columns: (1fr, 2fr),
    gutter: 1em,
    [#underlined("", width: 1.5in)\ Date of Certification],
    [#driver-signature(data, width: 3in)\ Independent Contractor's Signature]
  )
}
