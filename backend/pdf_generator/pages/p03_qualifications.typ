// =============================================================================
// PAGE 3: QUALIFICATIONS
// Static qualification text with signature block
// =============================================================================

#import "../styles.typ": *

#let page-qualifications(data) = {
  // Get configurable values with defaults
  let config = data.at("config", default: (:))
  let min-age = config.at("min_age", default: 21)
  let min-years-history = config.at("min_years_history", default: 1)
  
  pagebreak()
  
  // Header
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]

  v(0.6em)

  // Title
  align(center)[
    #text(size: 14pt, weight: "bold")[#underline[Qualifications]]
  ]

  v(0.35em)
  
  // Equal opportunity statement
  text(size: 10pt)[
    In compliance with Federal and State equal employment opportunity laws, qualified applicants are considered for all positions without regard to race, color, religion, sex, national origin, age, marital status, or non-job related disability.
  ]
  
  v(0.6em)
  
  // Minimum Qualifications
  text(size: 11pt, weight: "bold")[Minimum Qualifications:]
  v(0.3em)
  list(
    marker: [•],
    indent: 1em,
    [At least #min-age years old],
    [A valid CDL. Your CDL must be from the state that you declare to be your point of permanent domicile.],
    [Must provide no less than #min-years-history year(s) of driving work history, non-driving work history for the past ten years.],
    [Previous employers and references will be checked for the 3-year period immediately prior to joining the company. All time periods exceeding 30 days must be accounted for *(verifiable).*],
    [_A stable work history and good references._],
    [No Abandoned Trucks at previous employers.],
    [Successfully complete the starting classes for Contractors or Orientation for employees.],
  )
  
  v(0.35em)
  
  // Safety Issues
  text(size: 11pt, weight: "bold")[Safety Issues:]
  v(0.3em)
  list(
    marker: [•],
    indent: 1em,
    [No failed or refused drug or alcohol test in the last three years.],
    [No reckless driving convictions in the last three years.],
    [No license suspension for points in the last 12 months.],
    [No more than three moving violations during the last year.],
    [Must have no more than three moving violations and / or accidents during the last three years.],
  )
  
  v(0.35em)
  
  // Documents
  text(size: 11pt, weight: "bold")[Documents:]
  v(0.3em)
  list(
    marker: [•],
    indent: 1em,
    [Have required documents to complete the US Department of Justice INS I-9 work form, or certified state copy of birth certificate or US passport and if not a US Citizen, all required valid work authorization documents.],
  )
  
  v(0.35em)
  
  // Criminal History
  text(size: 11pt, weight: "bold")[Criminal History:]
  v(0.3em)
  list(
    marker: [•],
    indent: 1em,
    [No felony convictions within the last seven years. Convictions older than seven years will be considered on a case by case basis.],
    [No Controlled substance events in past seven years.],
    [Misdemeanors involving dishonesty, theft, or fraud are disqualifying events, other issues will be considered on a case by case basis.],
    [No DWI, DUI, BAC, or Open Container convictions in the last three years. Reduced charges from DWI *(careless, reckless, imprudent, i.e.)* will be examined closely.],
    [Have not been incarcerated within last five years.],
  )
  
  v(0.35em)
  
  text(size: 10pt)[
    (These qualifications are as of 12/1/18 and may be changed by *#underline[#company-name(data)]* without notification)
  ]
  
  v(0.8em)

  // Name and Signature
  [Name #underlined(driver-name(data), width: 4in)]

  v(0.35em)

  [Signature #driver-signature(data, width: 3in)]
}
