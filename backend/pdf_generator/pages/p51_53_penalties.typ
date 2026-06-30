// =============================================================================
// PENALTIES FOR NON-COMPLIANCE (SCHEDULE A)
// Rendered from config.fine_schedule (per-company, manager-editable). The table
// auto-paginates; the column header repeats on each page. Optional: main.typ only
// calls this when config.include_penalties is true.
// =============================================================================

#import "../styles.typ": *

#let page-penalties-intro(data) = {
  let config = data.at("config", default: (:))
  let fs = config.at("fine_schedule", default: (:))
  if fs == none { fs = (:) }  // JSON null -> empty dict (build_payload normally fills it)
  let rate = fs.at("rate_per_point", default: 100)
  let sections = fs.at("sections", default: ())
  let rewards = fs.at("rewards", default: none)

  pagebreak()

  v(4em)

  align(center)[
    #rect(width: 80%, stroke: 1pt, inset: 1em)[
      #align(center)[
        #text(size: 18pt, weight: "bold")[SCHEDULE A]

        #v(0.5em)

        #text(size: 16pt, weight: "bold")[PENALTIES FOR NON-COMPLIANCE]
      ]
    ]
  ]

  v(1.5em)

  text(size: 9pt)[
    The Company shall impose chargebacks against the compensation of the Contractor identified in Schedule A annexed hereto and made a part hereof. Items for which a chargeback is authorized that specifically provided for in this agreement shows how the amount is computed for each item to be charged to the Contractor. The Contractor shall be entitled to copies of those documents necessary to determine the validity of all items charged back against compensation.
  ]

  v(0.8em)

  align(center)[
    #text(size: 10pt, weight: "bold")[CHARGEBACKS - \$#rate per each point]
  ]

  v(1em)

  // Build the table body from the configured sections: each section is a shaded
  // full-width header row followed by its violation rows.
  let cells = ()
  for sec in sections {
    cells.push(table.cell(colspan: 4, fill: luma(230))[
      #text(size: 9pt, weight: "bold")[#sec.at("title", default: "")]
    ])
    for row in sec.at("rows", default: ()) {
      cells.push(text(size: 9pt)[#row.at("violation", default: "")])
      cells.push(text(size: 9pt)[#row.at("points", default: "")])
      cells.push(text(size: 9pt)[#row.at("first", default: "")])
      cells.push(text(size: 9pt)[#row.at("second", default: "")])
    }
  }

  table(
    columns: (3fr, 0.7fr, 1fr, 1fr),
    stroke: 0.5pt,
    inset: 6pt,
    align: (left, center, center, center),

    table.header(
      text(size: 9pt, weight: "bold")[VIOLATION TYPE],
      text(size: 9pt, weight: "bold")[HOW BAD?],
      text(size: 9pt, weight: "bold")[1ST TIME],
      text(size: 9pt, weight: "bold")[2ND TIME],
    ),

    ..cells
  )

  // Rewards table (e.g. DOT clean-inspection bonuses) — optional, editable per company.
  if rewards != none {
    v(1.2em)

    text(size: 12pt, weight: "bold")[#rewards.at("title", default: "")]

    v(0.4em)

    text(size: 9pt)[#rewards.at("intro", default: "")]

    v(0.6em)

    let rcells = ()
    for r in rewards.at("rows", default: ()) {
      rcells.push(text(size: 9pt)[#r.at("label", default: "")])
      rcells.push(text(size: 9pt)[#r.at("amount", default: "")])
    }

    table(
      columns: (4fr, 1fr),
      stroke: 0.5pt,
      inset: 6pt,
      align: (left, center),

      table.header(
        text(size: 9pt, weight: "bold")[INSPECTION],
        text(size: 9pt, weight: "bold")[REWARD],
      ),

      ..rcells
    )
  }

  v(1em)

  text(size: 9pt)[
    This is to certify that I have read, understood and agree to be charged according to this Schedule A for any and every USDOT, State, parking, toll, weight or company penalty.
  ]

  v(1.5em)

  [Independent Contractor Name #underlined(driver-name(data), width: 3in)]

  v(1em)

  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Independent Contractor Signature#driver-signature(data, width: 2.5in)],
    [Date#underlined(fill-date(data), width: 1.2in)]
  )

  v(1em)

  company-sign-block(data, label: "Safety Department")
}
