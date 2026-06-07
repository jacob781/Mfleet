// =============================================================================
// PAGE 13: CERTIFICATION OF COMPLIANCE WITH LICENSE REQUIREMENTS
// =============================================================================

#import "../styles.typ": *

#let page-license-compliance(data) = {
  pagebreak()
  
  // Title
  align(center)[
    #text(size: 12pt, weight: "bold")[CERTIFICATION OF COMPLIANCE WITH INDEPENDENT CONTRACTOR]
    #v(0.2em)
    #text(size: 12pt, weight: "bold")[LICENSE REQUIREMENTS]
  ]
  
  v(0.8em)
  
  text(size: 10pt)[
    MOTOR CARRIER INSTRUCTIONS: The requirements in Part 383 apply to every Independent Contractor who operates in intrastate, interstate, or foreign commerce and operates a vehicle weighing 26,001 pounds or more, can transport more than 15 people, or transports hazardous materials that require placarding.
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    The requirements in Part 391 apply to every Independent Contractor who operates in interstate commerce and operates a vehicle weighing 10,001 pounds or more, can transport more than 15 people, or transports hazardous materials that require placarding.
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    INDEPENDENT CONTRACTOR REQUIREMENTS: Parts 383 and 391 of the Federal Motor Carrier Safety Regulations contain some requirements that you as a Independent Contractor must comply with. These requirements are in effect as of July 1, 1987. They are as follows:
  ]
  
  v(0.5em)
  
  enum(
    numbering: "1.",
    indent: 0.5em,
    body-indent: 0.5em,
    [You, as a commercial vehicle Independent Contractor, may not possess more than one license. The only exception is if a state requires you to have more than one license. This exception is allowed until January 1, 1990.
    
    If you currently have more than one license, you should keep the license from your state of residence and return the additional licenses to the states that issued them. Destroying a license does not close the record in the state that issued it: you must notify the state. If a multiple license bas been lost, stolen, or destroyed, you should close your record by notifying the state of issuance that you no longer want to be licensed by that state.],
    [Sections 392.42 and 383.33 of the Federal Motor Carrier Safety Regulations require that you notify your employer the NEXT BUSINESS DAY of any revocation or suspension of your Independent Contractor's license. In addition, Section 383.31 requires that any time you violate a state or local traffic law (other than parking), you must report it to your employing motor carrier and the state that issued your license within 30 days.],
  )
  
  v(0.8em)
  
  text(size: 10pt, weight: "bold")[
    INDEPENDENT CONTRACTOR CERTIFICATION: I certify that I have read and understand the above requirements. The following license is the only one I will possess:
  ]
  
  v(1em)
  
  [Independent Contractor's License \##underlined(data.cdl.number, width: 3in)]
  
  v(0.5em)
  
  [State:#underlined(data.cdl.state, width: 0.8in) Exp. Date:#underlined(format-date(data.cdl.expiration), width: 1.2in)]
  
  v(1em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Independent Contractor's Signature:#underlined("", width: 2.5in)],
    [Date:#underlined("", width: 1.2in)]
  )
  
  v(0.5em)
  
  [Notes:#underlined("", width: 5in)]
}
