// =============================================================================
// SAFETY PERFORMANCE HISTORY RECORDS REQUEST — 3-attempt send log.
// Driven by data.employer_attempts (list of {date, method, destination, by})
// and data.employer_received ({date} or none). Appended to each employer packet.
// =============================================================================

#let _chk(on) = if on [☑] else [☐]

#let _ordinal(n) = if n == 1 { "1st" } else if n == 2 { "2nd" } else if n == 3 { "3rd" } else { str(n) }

#let _attempt-block(n, att) = {
  let method = if att != none { att.at("method", default: "") } else { "" }
  let dest = if att != none { att.at("destination", default: "") } else { "" }
  let by = if att != none { att.at("by", default: "") } else { "" }
  let date = if att != none { att.at("date", default: "") } else { "" }
  let is_fax = lower(method) == "fax"
  let is_mail = lower(method) == "mail" or lower(method) == "mailed"
  let is_other = method != "" and not is_fax and not is_mail

  text(weight: "bold")[#_ordinal(n) Attempt]
  v(0.3em)
  [This form was (check one) #_chk(is_fax) Faxed to previous employer #h(0.6em) #_chk(is_mail) Mailed #h(0.6em) #_chk(is_other) Other #underline(stroke: 0.5pt)[#h(0.2em)#dest#h(0.6em)]]
  v(0.4em)
  grid(
    columns: (2.2fr, 1.5fr),
    gutter: 1em,
    [By: #underline(stroke: 0.5pt)[#h(0.2em)#by#h(2em)]],
    [Date: #underline(stroke: 0.5pt)[#h(0.2em)#date#h(2em)]],
  )
  v(0.9em)
}

#let page-records-request(data) = {
  pagebreak(weak: true)

  align(center)[#text(size: 13pt, weight: "bold")[SAFETY PERFORMANCE HISTORY RECORDS REQUEST]]
  v(0.4em)
  align(center)[#text(size: 9pt)[Record of attempts to obtain the previous employer's safety performance history (FMCSR 391.23).]]
  v(1em)

  let attempts = data.at("employer_attempts", default: ())
  for i in range(3) {
    let att = if i < attempts.len() { attempts.at(i) } else { none }
    _attempt-block(i + 1, att)
  }

  v(0.5em)
  line(length: 100%, stroke: 0.3pt)
  v(0.5em)

  let rec = data.at("employer_received", default: none)
  let rec_date = if rec != none { rec.at("date", default: "") } else { "" }
  [Information was received by: #_chk(rec != none) #h(2em) Date received: #underline(stroke: 0.5pt)[#h(0.2em)#rec_date#h(3em)]]
}
