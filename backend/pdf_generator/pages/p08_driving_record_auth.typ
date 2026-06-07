// =============================================================================
// PAGE 8: AUTHORIZATION FOR DRIVING RECORD CHECK
// =============================================================================

#import "../styles.typ": *

#let page-driving-record-auth(data) = {
  pagebreak()
  
  // Header
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(1.5em)
  
  // Title
  align(center)[
    #text(size: 12pt, weight: "bold")[AUTHORIZATION FOR DRIVING RECORD CHECK]
  ]
  
  v(1em)
  
  text(size: 11pt)[
    By signing below I authorize you to release the information requested to *#underline[#company-name(data)]* as directed by the Federal Motor Carrier Safety Administration Regulations. I hereby release you from any liability which might be the result of providing this information.
  ]
  
  v(1em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Independent Contractor Signature #underlined("", width: 3in)],
    [Date:#underlined("", width: 1.2in)]
  )
  
  v(1.5em)
  
  enum(
    numbering: "1.",
    indent: 1em,
    [By signing below, I certify that the information requested is to be used for a "permissible purpose", as defined by provision of the Fair Credit Reporting Act, Section 604 and 607],
    [I also certify that should the individual be named hereafter be denied contract as a result of information received through this request, the source of the information will be identified in compliance with Section 615(a) of the Act.],
  )
  
  v(1.5em)
  
  [Company: *#underline[#company-name(data)]*]
  
  v(1em)
  
  [Independent Contractor name:#underlined(driver-name(data), width: 4in)]
  
  v(0.5em)
  
  [Address:#underlined(data.address.street, width: 5in)]
  
  v(0.5em)
  
  grid(
    columns: (2fr, 1fr, 0.5fr),
    gutter: 0.5em,
    [City:#underlined(data.address.city, width: 2.5in)],
    [State:#underlined(data.address.state, width: 1in)],
    [Zip:#underlined(data.address.zip, width: 0.7in)]
  )
  
  v(0.5em)
  
  grid(
    columns: (2fr, 1fr, 1fr),
    gutter: 0.5em,
    [CDL \##underlined(data.cdl.number, width: 2in)],
    [State:#underlined(data.cdl.state, width: 0.7in)],
    [Exp. Date:#underlined(format-date(data.cdl.expiration), width: 1in)]
  )
  
  v(1.5em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Independent Contractor Signature:#underlined("", width: 2.5in)],
    [Date:#underlined("", width: 1.2in)]
  )
  
  v(1.5em)
  
  [Representative:#underlined("", width: 4in)]
}
