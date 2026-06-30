// =============================================================================
// PAGES 4-5: EMPLOYMENT RECORD
// Dynamic employer entries with authorization
// =============================================================================

#import "../styles.typ": *

// Single employer entry component
#let employer-entry(emp, ordinal) = {
  text(weight: "bold")[#ordinal LAST EMPLOYER: NAME]
  underlined(emp.employer_name, width: 4in)
  
  v(0.3em)
  
  grid(
    columns: (3fr, 1fr),
    gutter: 0.5em,
    [ADDRESS#underlined(emp.employer_address + ", " + emp.employer_city + ", " + emp.employer_state + " " + emp.employer_zip, width: 3.5in)],
    [PHONE#underlined(emp.employer_phone, width: 1.2in)]
  )
  
  v(0.3em)
  
  grid(
    columns: (1fr, 0.5fr, 0.5fr, 1fr),
    gutter: 0.5em,
    [POSITION HELD#underlined(emp.position, width: 1.5in)],
    [FROM#underlined(emp.start_date, width: 0.7in)],
    [TO#underlined(emp.end_date, width: 0.7in)],
    [SALARY#underlined(emp.salary, width: 1in)]
  )
  
  v(0.3em)
  
  [REASONS FOR LEAVING#underlined(emp.reason_for_leaving, width: 4.5in)]
  
  v(0.3em)
  
  text(size: 9pt, weight: "bold")[
    ANY GAPS IN EMPLOYMENT AND/OR UNEMPLOYMENT MUST BE EXPLAINED. INCLUDE DATES (MONTH/YEAR) AND
  ]
  v(0.1em)
  [REASON.#underlined("", width: 5in)]
  
  v(0.3em)
  
  text(size: 9pt)[
    Were you subject to the Federal Motor Carrier Safety Regulations (FMCSRs) while employed by the previous employer? *#if emp.subject_to_fmcsr { "Yes" } else { "No" }*
  ]
  
  v(0.2em)
  
  text(size: 9pt)[
    Was the previous job position designated as a safety sensitive function in any DOT regulated mode, subject to alcohol and controlled substances testing requirements as required by 49 CFR Part 40? *#if emp.safety_sensitive { "Yes" } else { "No" }*
  ]
  
  v(0.5em)
}

#let page-employment-record(data) = {
  pagebreak()
  
  // Header
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(0.8em)
  
  // Title and intro
  text(size: 11pt, weight: "bold")[EMPLOYMENT RECORD (ATTACH SHEET IF MORE SPACE IS NEEDED)]
  v(0.3em)
  text(size: 10pt)[
    Applicants that desire to drive in intrastate/interstate commerce must provide the following information on all employers during the previous three years. You must give the same information for all employers you have driven a commercial motor vehicle for the seven years prior to the initial three years (total of ten years employment record).
  ]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[Must list the complete mailing address: street number and name, city, state and zip code.]
  
  v(0.8em)
  
  // Employment entries - render all dynamically
  let ordinals = ("LAST", "SECOND LAST", "THIRD LAST", "FOURTH LAST", "FIFTH LAST", "SIXTH LAST", "SEVENTH LAST", "EIGHTH LAST")
  
  for (i, emp) in data.employment_history.enumerate() {
    let ordinal = if i < ordinals.len() { ordinals.at(i) } else { str(i + 1) + "TH" }
    employer-entry(emp, ordinal)
  }
  
  // Authorization section (on page 5)
  pagebreak()
  
  align(center)[
    #text(size: 12pt, weight: "bold")[TO BE READ AND SIGNED BY APPLICANT]
  ]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[
    I authorize you to make sure investigations and inquiries to my personal, employment, financial or medical history and other related matters as may be necessary in arriving at an employment decision. (Generally, inquiries regarding medical history will be made only if and after a conditional offer of employment/contract has been extended.) I hereby release employers, schools, health care providers and other persons from all liability in responding to inquiries and releasing information in connection with my application.
  ]
  
  v(0.8em)
  
  text(size: 10pt)[
    In the event of employment, I understand that false or misleading information given in my application or interview(s) may result in discharge. I understand, also, that I am required to abide by all rules and regulations of the Company. "I understand that information I provide regarding current and/or previous employers may be used, and those employer(s) will be contacted, for the purpose of investigating my safety performance history as required by 49 CFR 391.23(d) and (e). I understand that I have the right to:
  ]
  
  v(0.3em)
  
  list(
    marker: [•],
    indent: 1em,
    [Review information provided by current/previous employers;],
    [Have errors in the information corrected by previous employers and for those previous employers to resend the corrected information to the prospective employer; and],
    [Have a rebuttal statement attached to the alleged erroneous information, if the previous employer(s) and I cannot agree on the accuracy of the information."],
  )
  
  v(1.5em)
  
  // First signature block
  grid(
    columns: (1fr, 2fr),
    gutter: 1em,
    [#underlined(fill-date(data), width: 1.5in)\ DATE],
    [#driver-signature(data, width: 3in)\ APPLICANT'S SIGNATURE]
  )
  
  v(1.5em)
  
  text(size: 10pt)[
    This certifies that I completed this application, and that all entries on it and information in it are true and complete to the best of my knowledge.
  ]
  
  v(1.5em)
  
  // Second signature block
  grid(
    columns: (1fr, 2fr),
    gutter: 1em,
    [#underlined(fill-date(data), width: 1.5in)\ DATE],
    [#driver-signature(data, width: 3in)\ APPLICANT'S SIGNATURE]
  )
}
