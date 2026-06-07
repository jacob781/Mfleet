// =============================================================================
// PAGE 2: DRIVING HISTORY
// License, Experience, Accidents, Violations
// =============================================================================

#import "../styles.typ": *

#let page-driving-history(data) = {
  pagebreak()
  
  // Header
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(1em)
  
  // Section 383.21 notice
  text(size: 10pt)[
    Section 383.21 FMCSR states "No person who operates a commercial motor vehicle shall at any time have more than one Independent Contractor's license". I certify that I do not have more than one motor vehicle license, the information for which is listed below
  ]
  
  v(0.5em)
  
  // License Table
  table(
    columns: (1fr, 1.5fr, 1fr, 1.5fr),
    stroke: 0.5pt,
    inset: 8pt,
    align: center,
    [*STATE*], [*LICENSE NO*], [*TYPE*], [*EXPIRATION DATE*],
    [#data.cdl.state], [#data.cdl.number], [#data.cdl.type], [#format-date(data.cdl.expiration)],
  )
  
  v(1.5em)
  
  // Driving Experience section
  align(center)[
    #text(size: 12pt, weight: "bold")[DRIVING EXPERIENCE]
  ]
  
  v(0.3em)
  
  table(
    columns: (1.2fr, 1.5fr, 0.8fr, 1fr),
    stroke: 0.5pt,
    inset: 6pt,
    [*CLASS OF EQUIPMENT*], [*TYPE OF EQUIPMENT (VAN, TANK, FLAT, ETC)*], [*DATES FROM TO*], [*APPROX.NO OF MILES (TOTAL)*],
    [STRAIGHT TRUCK], [#data.experience.straight.type], [#data.experience.straight.dates], [#data.experience.straight.miles],
    [TRACTOR AND SEMI-TRAILER], [#data.experience.tractor.type], [#data.experience.tractor.dates], [#data.experience.tractor.miles],
    [TRACTOR-TWO TRAILERS], [#data.experience.doubles.type], [#data.experience.doubles.dates], [#data.experience.doubles.miles],
    [OTHER], [], [], [],
  )
  
  v(1em)
  
  // Accident Record section
  text(size: 10pt, weight: "bold")[
    #underline[ACCIDENT RECORD FOR PAST 3 YEARS OR MORE (ATTACH SHEET IF MORE SPACE NEEDED)]
  ]
  
  v(0.3em)
  
  // Build accident rows dynamically
  let accident-rows = ()
  for acc in data.accidents {
    accident-rows.push([#acc.date])
    accident-rows.push([#acc.nature])
    accident-rows.push([#str(acc.fatalities)])
    accident-rows.push([#str(acc.injuries)])
    let spill-text = if acc.chemical_spill { "YES" } else { "NO" }
    accident-rows.push([#spill-text])
  }
  
  // Add empty rows to fill to 3
  let remaining-accidents = 3 - data.accidents.len()
  for i in range(remaining-accidents) {
    accident-rows.push([])
    accident-rows.push([])
    accident-rows.push([])
    accident-rows.push([])
    accident-rows.push([YES #h(0.5em) NO])
  }
  
  table(
    columns: (0.8fr, 1.5fr, 0.8fr, 0.8fr, 0.8fr),
    stroke: 0.5pt,
    inset: 5pt,
    [*DATES*], [*NATURE OF ACCIDENT (HEAD-ON, REAR-END, UPSET, ETC.)*], [*NUMBER FATALITIES*], [*NUMBER INJURIES*], [*CHEMICAL SPILLS*],
    ..accident-rows
  )
  
  v(1em)
  
  // Traffic Violations section
  text(size: 10pt, weight: "bold")[
    #underline[TRAFFIC CONVICTIONS AND FORFEITURES FOR THE PAST 3 YEARS (OTHER THAN PARKING VIOLATIONS)]
  ]
  
  v(0.3em)
  
  // Build violation rows dynamically
  let violation-rows = ()
  for viol in data.violations {
    violation-rows.push([#format-date(viol.date)])
    violation-rows.push([#viol.charge])
    violation-rows.push([#viol.location])
    violation-rows.push([#viol.penalty])
  }
  
  // Add empty rows to fill to 3
  let remaining-violations = 3 - data.violations.len()
  for i in range(remaining-violations) {
    violation-rows.push([])
    violation-rows.push([])
    violation-rows.push([])
    violation-rows.push([])
  }
  
  table(
    columns: (1fr, 1.2fr, 1.2fr, 1.5fr),
    stroke: 0.5pt,
    inset: 5pt,
    [*DATE CONVICTED (month/year)*], [*VIOLATION*], [*STATE OF VIOLATION LOCATION*], [*PENALTY (forfeited bond, collateral and/or points)*],
    ..violation-rows
  )
  
  v(0.5em)
  align(center)[_(ATTACH SHEET IF MORE SPACE NEEDED)_]
  
  v(1em)
  
  // License History Questions
  let denied = if data.license_history.denied { "YES" } else { "NO" }
  let suspended = if data.license_history.suspended { "YES" } else { "NO" }
  
  [1. Have you ever been denied a license, permit or privilege to operate a motor vehicle?]
  v(0.2em)
  [   #checkbox(data.license_history.denied) YES #h(0.5em) #checkbox(not data.license_history.denied) NO #h(0.5em) If YES, explain #underlined(data.license_history.denied_reason, width: 3in)]
  
  v(0.5em)
  
  [2. Has any license, permit or privilege ever been suspended or revoked?]
  v(0.2em)
  [   #checkbox(data.license_history.suspended) YES #h(0.5em) #checkbox(not data.license_history.suspended) NO #h(0.5em) If YES, explain #underlined(data.license_history.suspended_reason, width: 3in)]
}
