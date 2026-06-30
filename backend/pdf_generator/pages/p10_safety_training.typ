// =============================================================================
// PAGE 10: INDEPENDENT CONTRACTOR SAFETY TRAINING
// =============================================================================

#import "../styles.typ": *

#let page-safety-training(data) = {
  pagebreak()
  
  // Header
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(1.5em)
  
  // Title
  align(center)[
    #text(size: 12pt, weight: "bold")[INDEPENDENT CONTRACTOR SAFETY TRAINING]
  ]
  
  v(1.5em)
  
  text(size: 10pt)[
    This is to confirm that the Independent Contractor #underlined(driver-name(data), width: 3in), has received, and has had training in the areas of company and DOT rules and regulations. As required by our company and DOT regulations, I agree to read and familiarize myself with the following handbooks which are required to be in each vehicle, and available through the company.
  ]
  
  v(0.3em)
  
  [HANDBOOKS:]
  list(
    marker: [o],
    indent: 2em,
    [Federal Motor Carrier Regulations Handbook],
    [Company Rules and Regulations],
  )
  
  v(0.5em)
  
  [Explanations included in training are:]
  
  v(0.3em)
  
  enum(
    numbering: "1.",
    indent: 1em,
    body-indent: 1em,
    [Vehicle Inspections],
    [Independent Contractors Guide to The Daily Logs],
    [Safety Techniques],
    [Emergency Maneuvers],
    [Accident and Breakdowns],
  )
  
  v(0.8em)
  
  text(size: 10pt)[
    Following these training was a question and answer period which included additional company illustrations, photos, forms, further explanations and oral tests on those and other topics.
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    I understand that if I have any questions, or wish to have any areas of the training clarified, I may come to the company and get further explanation or information.
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    On this day#underlined(format-date(data.application_date), width: 1.5in) I have completed training in Log preparation and other public safety issues. I am now versed in proper DOT regulations (395.8). I understand that by not following these DOT regulations.
  ]
  
  v(2em)
  
  [Independent Contractor's /Owner Operator's Name:#underlined(driver-name(data), width: 3.5in)]
  
  v(1.5em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Independent Contractor's / Owner Operator's Signature:#driver-signature(data, width: 2.5in)],
    [Date:#underlined(fill-date(data), width: 1.2in)]
  )
  
  v(1.5em)
  
  [Instructor's Signature:#underlined("", width: 4in)]
}
