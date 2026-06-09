// =============================================================================
// PAGE 11: FAIR CREDIT REPORTING + ALCOHOL AND CONTROLLED SUBSTANCE CONSENT
// =============================================================================

#import "../styles.typ": *

#let page-fair-credit-consent(data) = {
  pagebreak()
  
  // Header
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(1em)
  
  // Fair Credit Section
  text(size: 11pt, weight: "bold")[FAIR CREDIT REPORTING ACT DISCLOSURE STATEMENT]
  
  v(0.5em)
  
  text(size: 10pt)[
    In accordance with the provisions of Section 604 (b)(2)(A) of the Fair Credit Reporting Act, Public Law 91-508, as amended by the Consumer Credit Reporting Act of 1996 (Title II, Subtitle D, Chapter I, of Public Law 104-208), you are being informed that reports verifying your previous employment, previous drug and alcohol test results, and your driving record may be obtained on you for employment purposes. These reports are required by Sections 382.413 and 391.25 of the Federal Motor Carrier Safety Regulations.
  ]
  
  v(1em)
  
  // Alcohol and Controlled Substance Section
  align(center)[
    #text(size: 11pt, weight: "bold")[ALCOHOL AND CONTROLLED SUBSTANCE]
    #v(0.2em)
    #text(size: 11pt, weight: "bold")[CONSENT AND RELEASE]
  ]
  
  v(0.5em)
  
  // Questions box
  rect(width: 100%, stroke: 0.5pt, inset: 8pt)[
    #grid(
      columns: (4fr, 0.3fr, 0.3fr),
      gutter: 0.3em,
      [Have you ever refused to be tested for drugs & alcohol at any time in the last 2 years?],
      [Yes], [No]
    )
    #v(0.3em)
    #grid(
      columns: (4fr, 0.3fr, 0.3fr),
      gutter: 0.3em,
      [Have you ever tested positive for drugs or alcohol at any time in the last 2 years?],
      [Yes], [No]
    )
    #v(0.3em)
    Have you ever tested positive on any pre-employment drug or alcohol test for a job which you
    #grid(
      columns: (4fr, 0.3fr, 0.3fr),
      gutter: 0.3em,
      [applied for but did not obtain?],
      [Yes], [No]
    )
    #v(0.3em)
    #text(weight: "bold")[If you answered yes to any of the above questions, attach a statement of explanation and]
    #v(0.1em)
    #text(weight: "bold")[provide proof of return to duty process.]
  ]
  
  v(0.8em)
  
  text(size: 10pt, weight: "bold")[
    I understand that, as required by the Federal Motor Carrier Safety Regulations and company policy, all Independent Contractors must submit to alcohol and controlled substance testing as a condition of employment. I also understand that any offer of employment will be contingent upon the results of an alcohol and controlled substance test. Therefore, I agree to submit to the following alcohol and controlled substance tests in accordance and as defined by the Federal Motor Carrier Safety Regulation and this company's policies:
  ]
  
  v(0.5em)
  
  list(
    marker: [●],
    indent: 1em,
    text(weight: "bold")[Pre-Employment, to determine employment eligibility],
    text(weight: "bold")[Random],
    text(weight: "bold")[Reasonable Suspicion],
    text(weight: "bold")[Post - Accident Test],
  )
  
  v(0.8em)
  
  text(size: 10pt, weight: "bold")[
    I certify that I have read, understand, and agree to abide by the condition of this consent and release form.
  ]
  
  v(1.5em)
  
  // Signature lines
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [#driver-signature(data, width: 3in)\ Applicant's Signature],
    [#underlined("", width: 1.5in)\ Date]
  )
  
  v(1em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [#underlined("", width: 3in)\ Print Name],
    [#underlined(ssn-masked(data), width: 1.5in)\ Social Security Number]
  )
}
