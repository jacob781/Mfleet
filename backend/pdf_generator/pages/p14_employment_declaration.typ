// =============================================================================
// PAGE 14: DECLARATION OF EMPLOYMENT STATUS
// =============================================================================

#import "../styles.typ": *

#let page-employment-declaration(data) = {
  pagebreak()
  
  // Title
  align(center)[
    #text(size: 12pt, weight: "bold")[DECLARATION OF EMPLOYMENT STATUS]
  ]
  
  v(1em)
  
  text(size: 10pt)[
    I understand that I must provide my complete employment history for the past 3 years, and all CDL required employment for the 7 years preceding that. Any gaps in employment longer than 1 month are explained as follows:
  ]

  v(0.5em)

  // Gaps are auto-detected from employment_history (in pdf_service.employment_gaps).
  let gaps = data.at("employment_gaps", default: ())
  let decl = data.at("employment_declaration", default: (:))
  let mark = (b) => if b { "X" } else { "" }

  if gaps.len() == 0 {
    align(center)[#text(style: "italic")[No employment gaps longer than one month.]]
  } else {
    for g in gaps {
      align(center)[From:#underlined(format-date(g.at("from")), width: 1.5in) to:#underlined(format-date(g.at("to")), width: 1.5in)]
      v(0.2em)
      let ex = g.at("explanation", default: "")
      pad(left: 1.5em)[*Activity:* #if ex != "" { ex } else { underlined("", width: 3in) }]
      v(0.5em)
    }
  }

  v(0.5em)

  text(weight: "bold")[In addition:]

  v(0.3em)

  [#underlined(mark(decl.at("not_employed_affirm", default: false)), width: 0.5in) *I was not employed by any company or individual*]

  v(0.3em)

  [#underlined(mark(decl.at("not_convicted_affirm", default: false)), width: 0.5in) *I was not convicted of any criminal act involving the use of a commercial motor vehicle or while driving a commercial motor vehicle*]
  
  v(0.8em)
  
  line(length: 100%, stroke: 0.5pt)
  
  v(0.3em)
  
  align(center)[
    #text(weight: "bold")[To Be Read and Signed by Applicant]
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    I authorize you to make such investigations and inquiries of my personal, employment, financial or medical history and other related matters as may be necessary in arriving at an employment decision. (Generally, inquiries regarding medical history will be made only if and after a conditional offer of employment has been extended.) I hereby release employers, schools, health care providers and other persons from all liability in responding to inquiries and releasing information in connection with my application.
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    In the event of employment, I understand that false or misleading information given in my application or interviews may result in discharge. I understand, also, that I am required to abide by all rules and regulations of the Company.
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    I understand that information I provide regarding current and/or previous employers may be used, and those employers will be contacted, for the purpose of investigating my safety performance history as required by 49 CFR 391.23 (d) and (e). I understand that I have the right to:
  ]
  
  v(0.3em)
  
  list(
    marker: [•],
    indent: 0.5em,
    [Review information provided by the previous employers;],
    [Have errors in the information corrected by previous employers and for those previous employers to re-send the corrected information to the prospective employer; and],
    [Have a rebuttal statement attached to the alleged erroneous information, if the previous employer(s) and I cannot agree on the accuracy of the information.],
  )
  
  v(0.8em)
  
  line(length: 100%, stroke: 0.5pt)
  
  v(1em)
  
  grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    align: bottom,
    [Signature:#driver-signature(data, width: 2.5in)],
    [Date:#underlined(fill-date(data), width: 1.5in)]
  )
}
