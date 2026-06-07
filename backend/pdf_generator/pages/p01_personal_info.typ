// =============================================================================
// PAGE 1: PERSONAL INFORMATION
// Commercial Independent Contractor Information
// =============================================================================

#import "../styles.typ": *

#let page-personal-info(data) = {
  // Header - Company Name (large, bold, centered)
  align(center)[
    #text(size: 28pt, weight: "bold")[#company-name(data)]
  ]
  
  line(length: 100%, stroke: 1.5pt)
  
  v(0.5em)
  
  // Subtitle
  align(center)[
    #text(size: 14pt, weight: "bold")[Commercial Independent Contractor Information]
  ]
  
  v(1em)
  
  // Date and DOB row
  grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [Date:#underlined(format-date(data.application_date), width: 2.5in)],
    [DOB#underlined(format-date(data.dob), width: 1.5in)]
  )
  
  v(1em)
  
  // Position and SSN row
  grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [Position:#underlined("Independent Contractor", width: 2in)],
    [Social Security number #underlined(ssn-full(data), width: 2in)]
  )
  
  v(1.5em)
  
  // Name section - matching original layout
  // Name label on left, underline spans with values, then column headers below
  grid(
    columns: (auto, 1fr, 1fr, 1fr),
    gutter: 0pt,
    column-gutter: 0.3em,
    [Name],
    box(width: 100%, stroke: (bottom: 0.5pt), inset: (bottom: 2pt))[#data.last_name],
    box(width: 100%, stroke: (bottom: 0.5pt), inset: (bottom: 2pt))[#data.first_name],
    box(width: 100%, stroke: (bottom: 0.5pt), inset: (bottom: 2pt))[#data.middle_name],
  )
  grid(
    columns: (auto, 1fr, 1fr, 1fr),
    gutter: 0pt,
    column-gutter: 0.3em,
    [],
    align(center)[Last],
    align(center)[First],
    align(center)[Middle],
  )
  
  v(0.5em)
  
  // Current Address
  [*Address:*]
  v(0.3em)
  
  grid(
    columns: (2fr, 1fr, 0.5fr, 0.5fr),
    gutter: 0pt,
    column-gutter: 0.3em,
    box(width: 100%, stroke: (bottom: 0.5pt), inset: (bottom: 2pt))[#data.address.street],
    box(width: 100%, stroke: (bottom: 0.5pt), inset: (bottom: 2pt))[#data.address.city],
    box(width: 100%, stroke: (bottom: 0.5pt), inset: (bottom: 2pt))[#data.address.state],
    box(width: 100%, stroke: (bottom: 0.5pt), inset: (bottom: 2pt))[#data.address.zip],
  )
  grid(
    columns: (2fr, 1fr, 0.5fr, 0.5fr),
    gutter: 0pt,
    column-gutter: 0.3em,
    [Street],
    [City],
    [State],
    [Zip],
  )
  
  v(1em)
  
  // Previous Three Years Residency - DYNAMIC, no fixed count
  text(weight: "bold")[PREVIOUS THREE YEARS RESIDENCY]
  
  v(0.3em)
  
  // Residency history entries - render ALL provided entries
  for addr in data.residency_history {
    grid(
      columns: (2fr, 1fr, 0.5fr, 0.5fr, auto),
      gutter: 0pt,
      column-gutter: 0.3em,
      box(width: 100%, stroke: (bottom: 0.5pt), inset: (bottom: 2pt))[#addr.street],
      box(width: 100%, stroke: (bottom: 0.5pt), inset: (bottom: 2pt))[#addr.city],
      box(width: 100%, stroke: (bottom: 0.5pt), inset: (bottom: 2pt))[#addr.state],
      box(width: 100%, stroke: (bottom: 0.5pt), inset: (bottom: 2pt))[#addr.zip],
      [YEARS#box(width: 0.4in, stroke: (bottom: 0.5pt), inset: (bottom: 2pt))[#addr.years]],
    )
    grid(
      columns: (2fr, 1fr, 0.5fr, 0.5fr, auto),
      gutter: 0pt,
      column-gutter: 0.3em,
      [Street],
      [City],
      [State],
      [Zip],
      [],
    )
    v(0.3em)
  }
  
  v(0.3em)
  align(center)[_(Attach sheet if more space is needed)_]
  
  v(0.8em)
  
  // Email
  [Email address #underlined(data.email, width: 5in)]
  
  v(0.8em)
  
  // CDL Info Row
  grid(
    columns: (1.5fr, 0.5fr, 1fr, 1fr),
    gutter: 0.5em,
    [CDL \##underlined(data.cdl.number, width: 1.5in)],
    [State#underlined(data.cdl.state, width: 0.5in)],
    [Exp. Date#underlined(format-date(data.cdl.expiration), width: 1in)],
    [Phone\##underlined(data.phone, width: 1.2in)]
  )
  
  v(0.8em)
  
  // Legal work question
  grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [Can you legally work in the United States? #underlined("Yes", width: 0.5in)],
    [Do you have proof of age?#underlined("Yes", width: 0.5in)]
  )
  
  v(0.8em)
  
  // Emergency Contact Section
  [Emergency Contact Name: #underlined(data.emergency.name, width: 4in)]
  v(0.4em)
  [Emergency Contact Relation: #underlined(data.emergency.relation, width: 4in)]
  v(0.4em)
  [Emergency Contact Address: #underlined("", width: 4in)]
  v(0.4em)
  [Emergency Contact Phone \#. #underlined(data.emergency.phone, width: 4in)]
}
