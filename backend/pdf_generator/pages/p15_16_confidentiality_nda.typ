// =============================================================================
// PAGES 15-16: CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT
// =============================================================================

#import "../styles.typ": *

#let page-confidentiality-nda(data) = {
  pagebreak()
  
  // Title
  align(center)[
    #text(size: 14pt, weight: "bold")[CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT]
  ]
  
  v(1em)
  
  text(size: 10pt)[
    This Confidentiality and Non-Disclosure Agreement ("Agreement") is made and entered into on this day #underlined(format-date(data.application_date), width: 1in), (the "Effective Date"), by and between:
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    Trucking Company: *#underline[#company-name(data)]*, with its principal place of business at *#underline[#data.config.company_address, #data.config.company_city, #data.config.company_state #data.config.company_zip]* referred to as the "Company," and
  ]
  
  v(0.5em)
  
  [Independent Contractor :#underlined(driver-name(data), width: 3in) residing at]
  
  v(0.2em)
  
  [#underlined(data.address.street + ", " + data.address.city + ", " + data.address.state + " " + data.address.zip, width: 5in) referred to as the "Independent Contractor."]
  
  v(0.5em)
  
  text(size: 10pt)[
    WHEREAS, the Company and the Independent Contractor are entering into an arrangement wherein the Independent Contractor will provide trucking services to the Company, and in the course of such arrangement, the Independent Contractor may have access to certain confidential and proprietary information of the Company.
  ]
  
  v(0.3em)
  
  text(size: 10pt)[
    NOW, THEREFORE, in consideration of the mutual promises contained herein, it is hereby agreed as follows:
  ]
  
  v(0.5em)
  
  text(weight: "bold")[1. Confidential Information:]
  v(0.2em)
  text(size: 10pt)[
    The term "Confidential Information" shall mean any and all information disclosed by the Company to the Independent Contractor, whether orally, in writing, or by any other means, that is not generally known to the public and is used, created, or obtained in connection with the business and operations of the Company. Confidential Information includes, but is not limited to, customer lists, pricing information, business strategies, financial data, and any other proprietary information.
  ]
  
  v(0.5em)
  
  text(weight: "bold")[2. Non-Disclosure:]
  v(0.2em)
  text(size: 10pt)[
    The Independent Contractor agrees not to disclose, reproduce, distribute, transmit, or otherwise disseminate any Confidential Information to any third party without the prior written consent of the Company, except as required by law.
  ]
  
  v(0.5em)
  
  text(weight: "bold")[3. Use of Confidential Information:]
  v(0.2em)
  text(size: 10pt)[
    The Independent Contractor agrees to use Confidential Information solely for the purpose of performing trucking services for the Company and shall not use such information for any other purpose without the Company's prior written consent.
  ]
  
  v(0.5em)
  
  text(weight: "bold")[4. Protection of Confidential Information:]
  v(0.2em)
  text(size: 10pt)[
    The Independent Contractor shall take all reasonable measures to protect the confidentiality of the Confidential Information, including but not limited to implementing adequate physical, technical, and administrative safeguards.
  ]
  
  v(0.5em)
  
  text(weight: "bold")[5. Return of Information:]
  v(0.2em)
  text(size: 10pt)[
    Upon termination of the Independent Contractor's engagement with the Company, the Independent Contractor shall promptly return all Confidential Information, whether in written, electronic, or any other form, to the Company and shall not retain any copies thereof.
  ]
  
  v(0.5em)
  
  text(weight: "bold")[6. Remedies:]
  v(0.2em)
  text(size: 10pt)[
    The parties acknowledge and agree that any unauthorized disclosure or use of Confidential Information may cause irreparable harm to the Company. In the event of a breach or threatened breach of this Agreement, the Company shall be entitled to seek injunctive relief, in addition to any other remedies available at law or in equity.
  ]
  
  // Page 2 - continues
  pagebreak()
  
  text(weight: "bold")[7. Term:]
  v(0.2em)
  text(size: 10pt)[
    This Agreement shall remain in effect for the duration of the Independent Contractor's engagement with the Company and for a period of five (5) years following the termination of said engagement.
  ]
  
  v(0.5em)
  
  text(weight: "bold")[8. Governing Law:]
  v(0.2em)
  text(size: 10pt)[
    This Agreement shall be governed by and construed in accordance with the laws of the state of #data.config.company_state.
  ]
  
  v(0.5em)
  
  text(weight: "bold")[9. Entire Agreement:]
  v(0.2em)
  text(size: 10pt)[
    This Agreement constitutes the entire understanding between the parties concerning the subject matter hereof and supersedes all prior agreements, whether written or oral.
  ]
  
  v(0.5em)
  
  text(weight: "bold")[10. Amendment:]
  v(0.2em)
  text(size: 10pt)[
    This Agreement may not be amended or modified except in writing signed by both parties.
  ]
  
  v(0.8em)
  
  text(size: 10pt)[
    IN WITNESS WHEREOF, the parties have executed this Confidentiality and Non-Disclosure Agreement as of the Effective Date.
  ]
  
  v(1.5em)
  
  text(weight: "bold")[TRUCKING COMPANY:]
  v(0.3em)
  [*#company-name(data)*]
  
  v(0.5em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [By:#underlined("", width: 2.5in)\ (Authorized Representative)],
    [Date:#underlined("", width: 1.2in)]
  )
  
  v(1.5em)
  
  text(weight: "bold")[INDEPENDENT CONTRACTOR:]
  v(0.3em)
  [*#driver-name(data)*]
  
  v(0.5em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Signature:#underlined("", width: 2.5in)],
    [Date:#underlined("", width: 1.2in)]
  )
}
