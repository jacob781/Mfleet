// =============================================================================
// COMPACT "FINES AND FEES SCHEDULE" — flat violation -> fee list.
// Table values come from config.fees_schedule (editable per company); the
// governed-speeds paragraph is static (see TODO below).
// =============================================================================

#import "../styles.typ": *

#let page-fines-fees(data) = {
  pagebreak()

  let fees = data.at("config", default: (:)).at("fees_schedule", default: (:))
  if fees == none { fees = (:) }  // JSON null -> empty dict (build_payload normally fills it)
  let rows = fees.at("rows", default: ())
  let title = fees.at("title", default: "FINES AND FEES SCHEDULE")

  align(center)[#text(size: 16pt, weight: "bold")[#title]]
  v(0.3em)
  align(center)[#text(size: 11pt, weight: "bold")[#company-name(data)]]
  v(1em)

  table(
    columns: (3fr, 1.2fr),
    stroke: 0.5pt,
    inset: 6pt,
    align: (left + horizon, left + horizon),
    text(size: 9pt, weight: "bold")[PENALTIES],
    text(size: 9pt, weight: "bold")[FEE],
    ..{
      let cells = ()
      for r in rows {
        cells.push(text(size: 9pt)[#r.at("violation", default: "")])
        cells.push(text(size: 9pt)[#r.at("fee", default: "")])
      }
      cells
    }
  )

  v(1em)

  // Static governed-speeds paragraph (as in the original document); company name dynamic.
  text(size: 10pt, weight: "bold")[All truck limits working on #company-name(data) must be governed:]
  v(0.3em)
  [Cruise control 70 mph]
  v(0.2em)
  [Pedal gas 75 mph]

  v(1.5em)

  [Independent Contractor Name:#underlined(driver-name(data), width: 3in)]
  v(0.6em)
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Independent Contractor Signature:#driver-signature(data, width: 2.5in)],
    [Date:#underlined(fill-date(data), width: 1.2in)],
  )
  v(0.8em)
  company-sign-block(data, label: "Safety Department")
}
