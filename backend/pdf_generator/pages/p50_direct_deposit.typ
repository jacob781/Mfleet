// =============================================================================
// PAGE 50: DIRECT DEPOSIT AGREEMENT FORM
// =============================================================================

#import "../styles.typ": *

#let page-direct-deposit(data) = {
  pagebreak()
  
  v(3em)
  
  align(center)[
    #text(size: 24pt, weight: "bold")[Direct Deposit Agreement Form]
  ]
  
  v(3em)
  
  align(center)[
    #text(size: 12pt, weight: "bold")[Authorization Agreement]
  ]
  
  v(1.5em)
  
  text(size: 10pt)[
    I hereby authorize #text(weight: "bold")[#underline[#company-name(data)]] to initiate automatic deposits to my account at the financial institution named below. I also authorize #text(weight: "bold")[#underline[#company-name(data)]] to make withdrawals from this account in the event that a credit entry is made in error.
  ]
  
  v(1em)
  
  text(size: 10pt)[
    Further, I agree not to hold #text(weight: "bold")[#underline[#company-name(data)]] responsible for any delay or loss of funds due to incorrect or incomplete information supplied by me or by my financial institution or due to an error on the part of my financial institution in depositing funds to my account.
  ]
  
  v(1em)
  
  text(size: 10pt)[
    This agreement will remain in effect until #text(weight: "bold")[#underline[#company-name(data)]] receives a written notice of cancellation from me or my financial institution, or until I submit a new direct deposit form to the Payroll Department.
  ]
  
  v(2em)
  
  align(center)[
    #text(size: 12pt, weight: "bold")[Account Information]
  ]
  
  v(1em)
  
  grid(
    columns: (1.5in, 1fr),
    row-gutter: 1.5em,
    [Bank Name:], [#underlined("", width: 4in)],
    [Account Number:], [#underlined("", width: 4in)],
    [Routing Number:], [#underlined("", width: 4in)],
  )
  
  [(Direct Deposit, Electronic, Paper)]
  
  v(2em)
  
  align(center)[
    #text(size: 12pt, weight: "bold")[Signature]
  ]
  
  v(1em)
  
  grid(
    columns: (2in, 1fr),
    row-gutter: 1.5em,
    [Company (if any):], [#underlined("", width: 4in)],
    [Independent Contractor name:], [#underlined("", width: 3.5in)],
  )
  
  v(1em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Signature:#underlined("", width: 3in)],
    [DATE:#underlined("", width: 1.2in)]
  )
}
