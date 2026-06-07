// =============================================================================
// PAGES 6-7: PAST EMPLOYMENT VERIFICATION (per employer)
// Part 1: Employee info, Part 2: Authorization
// =============================================================================

#import "../styles.typ": *

// Part 1: Employer verification form
#let employer-verification-part1(data, emp, i) = {
  pagebreak()
  
  // Header
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(1em)
  
  // Subtitle
  align(center)[
    #text(size: 12pt, weight: "bold")[PAST EMPLOYMENT VERIFICATION (part 1)]
  ]
  
  v(0.8em)
  
  // Sent to employer section
  grid(
    columns: (2fr, 1fr, 1fr),
    gutter: 0.5em,
    [Sent to:#underlined(emp.employer_name, width: 2in)],
    [Fax:#underlined(emp.at("employer_fax", default: ""), width: 1in)],
    [Phone:#underlined(emp.employer_phone, width: 1in)]
  )
  align(center)[Previous Employer]
  
  v(0.8em)
  
  // Requested by section
  grid(
    columns: (2fr, 1fr),
    gutter: 0.5em,
    [Requested by: *#underline[#company-name(data)]*],
    [*Phone: #data.config.company_phone*]
  )
  
  v(0.3em)
  
  let addr = data.config.company_address + ", " + data.config.company_city + ", " + data.config.company_state + " " + data.config.company_zip
  grid(
    columns: (2fr, 1fr),
    gutter: 0.5em,
    [#text(weight: "bold")[#addr]],
    [*Email: #data.config.company_email*]
  )
  
  v(1em)
  
  // Applicant info
  grid(
    columns: (2fr, 1fr),
    gutter: 0.5em,
    [Name of Applicant:#underlined(driver-name(data), width: 3in)],
    [SSN:#underlined(ssn-masked(data), width: 1.5in)]
  )
  
  v(0.3em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 0.5em,
    // Job Title, Hire Date are filled by EMPLOYER, not driver
    [Job Title:#underlined("", width: 3in)],
    [Hire Date:#underlined("", width: 1.5in)]
  )
  
  v(0.5em)
  
  grid(
    columns: (1fr, 1fr, 1fr),
    gutter: 0.5em,
    // Termination Date is filled by EMPLOYER
    [Termination Date:#underlined("", width: 1in)],
    [Resigned: YES #h(0.3em) NO],
    [Discharged: YES #h(0.3em) NO]
  )
  
  v(0.3em)
  
  [If discharged, why?#underlined("", width: 5in)]
  
  v(0.3em)
  
  [Eligible for rehire? YES #h(0.3em) NO #h(0.3em) Upon Review #h(0.3em) If no, please explain:#underlined("", width: 2.5in)]
  
  v(0.8em)
  
  // Equipment section
  grid(
    columns: (2fr, 1fr),
    gutter: 0.5em,
    [Equipment: Type of Truck/Tractor:#underlined("", width: 2.5in)],
    [Trailer Length#underlined("", width: 1in)]
  )
  
  v(0.3em)
  
  grid(
    columns: (1fr, 1fr, 1fr, 1fr, 1fr),
    gutter: 0.3em,
    [Refrigerated#underlined("", width: 0.5in)],
    [Flatbeds#underlined("", width: 0.5in)],
    [Vans#underlined("", width: 0.5in)],
    [Tanker#underlined("", width: 0.5in)],
    [Other#underlined("", width: 0.5in)]
  )
  
  v(0.3em)
  
  [Commodities Hauled:#underlined("", width: 5in)]
  
  v(0.3em)
  
  [Areas of operation:#underlined("", width: 5in)]
  
  v(0.3em)
  
  [Overall Performance : Poor#underlined("", width: 0.5in) Fair#underlined("", width: 0.5in) Good#underlined("", width: 0.5in) Excellent#underlined("", width: 0.5in)]
  
  v(0.5em)
  
  // Accidents section
  text(size: 9pt, weight: "bold")[
    Accident information below requested in accordance with FMCSR Part 391.23. (Accidents within last 36 months)
  ]
  
  v(0.3em)
  
  grid(
    columns: (1fr, 2fr, 1fr),
    gutter: 0.5em,
    [Accidents: \# Preventable:#underlined("", width: 0.5in)],
    [Description:#underlined("", width: 2.5in)],
    []
  )
  
  v(0.2em)
  
  grid(
    columns: (1fr, 2fr),
    gutter: 0.5em,
    [\# Non-Preventable:#underlined("", width: 0.5in)],
    [Description:#underlined("", width: 2.5in)]
  )
  
  v(0.5em)
  
  // Drug/Alcohol section
  text(size: 9pt, weight: "bold")[
    Drug/Alcohol information below requested in accordance with DOT 49 CFR Part 40. (Tests done in last 36 months.)
  ]
  
  v(0.3em)
  
  grid(
    columns: (3fr, 0.5fr, 0.5fr),
    gutter: 0.3em,
    [Tested positive for controlled substances in the last 3 years?],
    [Yes#underlined("", width: 0.3in)],
    [No#underlined("", width: 0.3in)]
  )
  
  v(0.2em)
  
  grid(
    columns: (3fr, 0.5fr, 0.5fr),
    gutter: 0.3em,
    [Had a breath alcohol test result with a concentration of .04 or greater in the last 3 years],
    [Yes#underlined("", width: 0.3in)],
    [No#underlined("", width: 0.3in)]
  )
  
  v(0.2em)
  
  grid(
    columns: (3fr, 0.5fr, 0.5fr),
    gutter: 0.3em,
    [Ever refused a required test for drugs or alcohol in the last 3 years?],
    [Yes#underlined("", width: 0.3in)],
    [No#underlined("", width: 0.3in)]
  )
  
  v(0.2em)
  
  grid(
    columns: (3fr, 0.5fr, 0.5fr),
    gutter: 0.3em,
    [Violated other D.O.T. drug/alcohol regulations?],
    [Yes#underlined("", width: 0.3in)],
    [No#underlined("", width: 0.3in)]
  )
  
  v(0.2em)
  
  [Have you received information from previous employer that this individual]
  
  v(0.1em)
  
  grid(
    columns: (3fr, 0.5fr, 0.5fr),
    gutter: 0.3em,
    [has violated D.O.T drug/alcohol regulations?],
    [Yes#underlined("", width: 0.3in)],
    [No#underlined("", width: 0.3in)]
  )
  
  v(0.3em)
  
  [If Yes, please give type of test, date of test, and SAP information (if applicable):#underlined("", width: 2in)]
  
  v(0.8em)
  
  // Form submission info
  line(length: 100%, stroke: 0.3pt)
  
  v(0.3em)
  
  grid(
    columns: (2fr, 2fr),
    gutter: 0.5em,
    [Person providing information:#underlined("", width: 2in)],
    [Title#underlined("", width: 2in)]
  )
  
  v(0.2em)
  
  grid(
    columns: (2fr, 2fr),
    gutter: 0.5em,
    [Person received information:#underlined("", width: 2in)],
    [Title#underlined("", width: 2in)]
  )
  
  v(0.2em)
  
  grid(
    columns: (1fr, 1fr, 1fr, 1fr),
    gutter: 0.3em,
    [Form submitted 1#underlined("", width: 0.7in)],
    [Form submitted 2#underlined("", width: 0.7in)],
    [Form submitted 3#underlined("", width: 0.7in)],
    [Form submitted 4#underlined("", width: 0.7in)]
  )
  
  v(0.3em)
  
  align(center)[Date received#underlined("", width: 1in)]
}

// Part 2: Authorization text
#let employer-verification-part2(data) = {
  pagebreak()
  
  // Subtitle
  align(center)[
    #text(size: 12pt, weight: "bold")[PAST EMPLOYMENT VERIFICATION (part 2)]
  ]
  
  v(0.8em)
  
  text(size: 10pt)[
    1.	) I hereby authorize the above-mentioned employer/school to release all information as to my character, work habits, performance, experience, fitness, together with reasons for termination concerning my employment to *#underline[#company-name(data)]* (or their authorized agents.) which may request such information in connection with my application for employment with er, work habits, performance, experience, fitness, together with reasons for termination concerning my employment to *#underline[#company-name(data)]*
  ]
  
  v(0.3em)
  
  text(size: 10pt)[
    2.	) In conformity with 49 CFR part 40, I hereby authorize the above-mentioned employer/school and their agents, to furnish *#underline[#company-name(data)]* the above requested information concerning D.O.T. drug and alcohol tests including pre-employment tests during the previous 3 years; the dates when I tested positive; the dates when I tested .04 or greater; the dates when I refused (including a verified adulterated or substituted result) to be tested for drugs and alcohol; and any other violations of 49 CFR part 40 and any information the above-mentioned employer/school and/or their authorized agents have received regarding violations of 49 CFR part 40 from my previous employers covered by D.O.T.
  ]
  
  v(0.3em)
  
  text(size: 10pt)[
    3.	) I hereby release the above-mentioned employer/school and their authorized agents from all liability of any type as a result of providing the above-requested information to *#underline[#company-name(data)]*
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    By signing below, I certify that I have read and fully understand Parts 1, 2, and 3 of this release and that I executed this release voluntarily, with the knowledge that all information released could affect my being employed with *#underline[#company-name(data)]*.
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    It is expressly acknowledged, understood and agreed that the information provided by the applicant regarding the applicant's employment during the previous three (3) years in accordance with Section 391.21 (b)(10) of the Federal Motor Carrier Safety Regulations ("FMCSR") may be used, and the applicant's prior employers may be contacted, for the purpose of investigating the applicant's safety performance history information as required by paragraphs (d) and (e) of Section 391.23 of the FMCSR. The applicant has certain due process rights under the FMCSR regarding the information received as a result of these investigations, as described below.
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    Applicant's Due Process Rights: 1) The right to review information provided by previous employers; 2) The right to have errors in the information corrected by the previous employer and for that previous employer to re-send the corrected information to *#underline[#company-name(data)]* and their agents, 3) The right to have a rebuttal statement attached to the alleged erroneous information if the previous employer and the Independent Contractor cannot agree on the accuracy of the information.
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    Independent Contractors who have previous Department of Transportation regulated employment history in the preceding three years, and wish to review previous employer-provided investigative information, must submit a written request to the Safety Compliance Manager *#underline[#company-name(data)]*, which may be done at any time, including when applying, or as late as thirty (30) days after being employed or being notified of denial of employment *#underline[#company-name(data)]*. will provide this information to the applicant within five (5) business days after receiving the written request. If, however, *#underline[#company-name(data)]* has not yet received the requested information from the previous employer(s), then it will provide the information to the applicant within five (5) business days after it receives the requested safety performance history information. If the Independent Contractor has not arranged to pick up or receive the requested records within thirty (30) days *#underline[#company-name(data)]* making them available, *#underline[#company-name(data)]* will consider the Independent Contractor to have waived the request to review the records.
  ]
  
  v(1.5em)
  
  // Signature block
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [#underlined("", width: 4in)\ Signature of Applicant],
    [#underlined("", width: 1.2in)\ Date]
  )
}

// Main function - generates verification for each employer
#let page-employer-verification(data) = {
  for (i, emp) in data.employment_history.enumerate() {
    employer-verification-part1(data, emp, i)
    employer-verification-part2(data)
  }
}
