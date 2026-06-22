// =============================================================================
// PAGE 17: WAIVER OF WORKERS' COMPENSATION
// =============================================================================

#import "../styles.typ": *

#let page-workers-comp-waiver(data) = {
  pagebreak()
  
  // Title
  align(center)[
    #text(size: 16pt, weight: "bold")[Waiver of Workers' Compensation]
  ]
  
  v(1em)
  
  [Date:#underlined(format-date(data.application_date), width: 1.5in)]
  
  v(0.3em)
  
  text(weight: "bold")[#underline[#company-name(data)]]
  
  v(0.3em)
  
  text(weight: "bold")[#underline[#data.config.company_address, #data.config.company_city, #data.config.company_state #data.config.company_zip]]
  
  v(0.3em)
  
  [Independent Contractor:#underlined(driver-name(data), width: 4in)]
  
  v(0.3em)
  
  [Address:#underlined(data.address.street + ", " + data.address.city + ", " + data.address.state + " " + data.address.zip, width: 5in)]
  
  v(0.5em)
  
  text(size: 10pt)[
    I, the undersigned #underlined(driver-name(data), width: 3in), and the undersigned Employer, hereby agree to the following terms and conditions regarding the waiver of workers' compensation benefits:
  ]
  
  v(0.5em)
  
  text(weight: "bold")[1. Acknowledgment of Understanding]
  v(0.2em)
  text(size: 10pt)[
    I understand that I am employed as a trucker by *#underline[#company-name(data)]* and that I am aware of the inherent risks and hazards associated with the trucking industry. I acknowledge that I have been informed about the availability of workers' compensation benefits under applicable state laws.
  ]
  
  v(0.5em)
  
  text(weight: "bold")[2. Voluntary Waiver]
  v(0.2em)
  text(size: 10pt)[
    I voluntarily waive my rights to claim workers' compensation benefits for any injuries, illnesses, or accidents that may occur while performing my duties as a trucker for *#underline[#company-name(data)]*. I understand that by signing this waiver, I will not be eligible to receive workers' compensation benefits, including medical treatment, wage replacement, or disability benefits, for any work-related injuries or illnesses.
  ]
  
  v(0.5em)
  
  text(weight: "bold")[3. Alternative Arrangements]
  v(0.2em)
  text(size: 10pt)[
    In place of workers' compensation benefits, I agree that *#underline[#company-name(data)]* will provide alternative arrangements for addressing any work-related injuries or illnesses. These alternative arrangements may include but are not limited to medical insurance, disability insurance, or other forms of compensation, as agreed upon between the parties.
  ]
  
  v(0.5em)
  
  text(weight: "bold")[4. Revocation]
  v(0.2em)
  text(size: 10pt)[
    I understand that this waiver is voluntary and that I have the right to revoke it at any time by providing written notice to *#underline[#company-name(data)]*. In such a case, I will become eligible for workers' compensation benefits in accordance with applicable state laws.
  ]
  
  v(0.5em)
  
  text(weight: "bold")[5. Legal Counsel]
  v(0.2em)
  text(size: 10pt)[
    I acknowledge that I have been advised to seek legal counsel before signing this waiver and that I have had a reasonable opportunity to do so. I am signing this waiver freely and without any coercion or undue influence.
  ]
  
  v(0.5em)
  
  text(weight: "bold")[6. Governing Law]
  v(0.2em)
  text(size: 10pt)[
    This waiver of workers' compensation benefits shall be governed by and construed in accordance with the laws of the state of *#underline[#data.config.company_state]* without regard to its conflict of laws principles.
  ]
  
  v(0.5em)

  [Signatures:]
  
  v(0.3em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Independent Contractor Signature:#driver-signature(data, width: 2.5in)],
    [Date:#underlined("", width: 1.2in)]
  )
  
  v(0.3em)

  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Employer's Signature:#underlined("", width: 2.5in)],
    [Date:#underlined("", width: 1.2in)]
  )
}
