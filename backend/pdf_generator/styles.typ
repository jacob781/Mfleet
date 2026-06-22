// =============================================================================
// STYLES.TYP - Global Styles for Driver Application PDF
// =============================================================================

// Page setup
#let page-margin = 0.5in

// Fonts
#let main-font = "Times New Roman"
#let header-font = "Times New Roman"

// Font sizes
#let header-size = 18pt
#let subheader-size = 14pt
#let body-size = 11pt
#let small-size = 9pt

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Company name from config
#let company-name(data) = data.config.company_name

// Full driver name
#let driver-name(data) = {
  let middle = if data.middle_name != "" { " " + data.middle_name } else { "" }
  data.first_name + middle + " " + data.last_name
}

// Contractor/Applicant name (aliases)
#let contractor-name(data) = driver-name(data)
#let applicant-name(data) = driver-name(data)

// Masked SSN (show only last 4 digits)
#let ssn-masked(data) = "***-**-" + data.ssn.slice(-4)

// Full SSN with dashes
#let ssn-full(data) = data.ssn

// Format date MM/DD/YYYY
#let format-date(d) = {
  if type(d) == str {
    d
  } else {
    str(d.month()) + "/" + str(d.day()) + "/" + str(d.year())
  }
}

// =============================================================================
// CHECKBOX STYLES (Tick marks matching W-9)
// =============================================================================

#let checkbox-checked = box(
  width: 10pt,
  height: 10pt,
  stroke: 0.5pt,
  inset: 1pt,
  align(center + horizon, text(size: 8pt, weight: "bold")[✓])
)

#let checkbox-unchecked = box(
  width: 10pt,
  height: 10pt,
  stroke: 0.5pt,
)

#let checkbox(checked) = if checked { checkbox-checked } else { checkbox-unchecked }

// =============================================================================
// SIGNATURE BLOCK
// =============================================================================

#let signature-block(data, section-name) = {
  let sig = data.signatures.at(section-name, default: none)
  
  if sig != none {
    let img-path = sig.at("image_path", default: none)
    block(spacing: 0.2em, breakable: false)[
      #if img-path != none {
        image(img-path, height: 0.32in, fit: "contain")
      } else {
        text(style: "italic")[#sig.signer_first_name]
      }
      #line(length: 3in, stroke: 0.5pt)
      #v(0.15em)
      #text(size: small-size)[(Signed #sig.timestamp_et, #sig.signer_first_name)]
    ]
  } else {
    block(spacing: 0.5em)[
      Signature: #line(length: 3in, stroke: 0.5pt)
      #v(0.2em)
      Date: #line(length: 1.5in, stroke: 0.5pt)
    ]
  }
}

// Inline driver signature: a fixed-width underlined box holding the applicant's
// signature image (or a blank line if not signed). Drop-in replacement for
// `underlined("", width: X)` on a DRIVER signature line.
#let _signature-box(sig, width) = {
  let img = if sig != none { sig.at("image_path", default: none) } else { none }
  let ts = if sig != none { sig.at("timestamp_et", default: none) } else { none }
  box(width: width)[
    #box(width: 100%, height: 0.34in, stroke: (bottom: 0.5pt), inset: (bottom: 1pt, left: 2pt))[
      #if img != none {
        align(left + bottom, image(img, width: 100%, height: 0.28in, fit: "contain"))
      }
    ]
    #if ts != none {
      linebreak()
      text(size: 7pt, fill: luma(110))[(Signed #ts)]
    }
  ]
}

#let _sig-at(data, key) = {
  let sigs = data.at("signatures", default: (:))
  if type(sigs) == dictionary { sigs.at(key, default: none) } else { none }
}

// Driver's signature (applicant) — on every driver signature line.
#let driver-signature(data, width: 3in) = _signature-box(_sig-at(data, "applicant"), width)

// Manager / company counter-signature — on the carrier/company representative lines.
#let carrier-signature(data, width: 3in) = _signature-box(_sig-at(data, "carrier"), width)

// =============================================================================
// TABLE STYLES
// =============================================================================

#let form-table(..args) = table(
  stroke: 0.5pt,
  inset: 5pt,
  ..args
)

// =============================================================================
// HEADER COMPONENT
// =============================================================================

#let page-header(data) = {
  align(center)[
    #text(size: header-size, weight: "bold")[#company-name(data)]
  ]
  v(0.5em)
}

// Section title (bold, centered)
#let section-title(title) = {
  align(center)[
    #text(size: subheader-size, weight: "bold")[#title]
  ]
  v(0.3em)
}

// =============================================================================
// INPUT FIELD HELPERS
// =============================================================================

#let field-line(label, value, width: 2in) = {
  [#label: #box(width: width, stroke: (bottom: 0.5pt))[#value]]
}

#let underlined(value, width: 2in) = {
  box(width: width, stroke: (bottom: 0.5pt), inset: (bottom: 2pt))[#value]
}

// Legacy compatibility
#let field(label, value, width: 100%) = {
  stack(dir: ltr, spacing: 5pt,
    text(weight: "bold")[#label],
    box(width: 1fr, stroke: (bottom: 0.5pt), inset: 2pt)[#value]
  )
}

#let header(company_name) = {
  align(center)[
    #text(18pt, weight: "bold", fill: black)[#company_name]
  ]
  v(10pt)
}

#let signature_block() = {
  v(1fr)
  line(length: 100%, stroke: 0.5pt)
  v(5pt)
  grid(
    columns: (1fr, 1fr),
    [#strong[Driver Signature]], 
    align(right)[#strong[Date]]
  )
}