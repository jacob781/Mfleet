// =============================================================================
// PAGE 9: SEVEN DAYS WORK STATEMENT
// =============================================================================

#import "../styles.typ": *

#let page-seven-day-log(data) = {
  pagebreak()
  
  // Header
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(1.5em)
  
  // Title
  align(center)[
    #text(size: 12pt, weight: "bold")[SEVEN DAYS WORK STATEMENT]
  ]
  
  v(1em)
  
  [Independent Contractor name:#underlined(driver-name(data), width: 4in)]
  
  v(0.5em)
  
  [Address:#underlined(data.address.street + ", " + data.address.city + ", " + data.address.state + " " + data.address.zip, width: 5in)]
  
  v(0.5em)
  
  grid(
    columns: (2fr, 1fr, 0.5fr),
    gutter: 0.5em,
    [City:#underlined(data.address.city, width: 2.5in)],
    [State:#underlined(data.address.state, width: 1in)],
    [Zip:#underlined(data.address.zip, width: 0.7in)]
  )
  
  v(0.5em)
  
  grid(
    columns: (2fr, 1fr, 1fr),
    gutter: 0.5em,
    [CDL \##underlined(data.cdl.number, width: 2in)],
    [State:#underlined(data.cdl.state, width: 0.7in)],
    [Exp. Date:#underlined(format-date(data.cdl.expiration), width: 1in)]
  )
  
  v(1em)
  
  text(size: 10pt)[
    The federal Motor Carrier Safety Regulations decide that when using a Independent Contractor the first time, or occasionally, the Motor Carrier must obtain, from said Independent Contractor, an account of his/her total time on duty for the seven days preceding his beginning work for the carrier as well as the date and time at which he was last relieved from duty and his/her account must be signed by the Independent Contractor.
  ]
  
  v(1em)
  
  [Today's Date:#underlined(format-date(data.application_date), width: 1.5in)]
  
  v(0.5em)
  
  // Seven day table
  table(
    columns: (1fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr),
    stroke: 0.5pt,
    inset: 8pt,
    align: center,
    [date], [date], [date], [date], [date], [date], [date],
    ..for log in data.seven_day_log {
      ([#log.date],)
    },
    ..for i in range(7 - data.seven_day_log.len()) {
      ([],)
    },
    ..for log in data.seven_day_log {
      ([#log.hours],)
    },
    ..for i in range(7 - data.seven_day_log.len()) {
      ([],)
    },
  )
  
  v(1em)
  
  [Total hours worked past seven days:#underlined("", width: 1in) #h(1em) By signing below, I certify that the above information is correct to the best of my knowledge, and that I was last relieved from duty]
  
  v(0.5em)
  
  [On: #underlined(data.last_relieved_date, width: 1.5in) #h(1em) At: #underlined(data.last_relieved_time, width: 1.2in) #h(1em) Location: #underlined(data.last_relieved_location, width: 2in)]
  
  v(1.5em)
  
  [Independent Contractor Signature #underlined("", width: 4in)]
  
  v(1.5em)
  
  line(length: 4in, stroke: 0.5pt)
  [Company Representative (Witness)]
}
