// =============================================================================
// PAGE 21: EQUIPMENT SUPPLEMENT A
// =============================================================================

#import "../styles.typ": *

#let page-equipment-supplement(data) = {
  pagebreak()
  
  // Header
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(1em)
  
  align(center)[
    #text(size: 12pt, weight: "bold")[SUPPLEMENT A ("Equipment")]
  ]
  
  v(1em)
  
  // Equipment table
  table(
    columns: (0.5fr, 1fr, 0.6fr, 0.6fr, 1.5fr, 0.5fr, 0.8fr),
    stroke: 0.5pt,
    inset: 6pt,
    align: center,
    text(size: 9pt, weight: "bold")[Tractor:],
    text(size: 9pt, weight: "bold")[Make :],
    text(size: 9pt, weight: "bold")[Year:],
    text(size: 9pt, weight: "bold")[Type:],
    text(size: 9pt, weight: "bold")[V.I.N Serial \#],
    text(size: 9pt, weight: "bold")[State],
    text(size: 9pt, weight: "bold")[License\#],
    // Generate 20 rows
    ..for i in range(20) {
      (
        text(weight: "bold")[#str(i + 1)],
        [], [], [], [], [], []
      )
    }
  )
  
  v(1em)
  
  [Carrier hereby acknowledges receipt of Equipment described above:]
  
  v(1.5em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Signature of Carrier's Agent#underlined("", width: 2.5in)],
    [Date#underlined("", width: 1.2in)]
  )
}
