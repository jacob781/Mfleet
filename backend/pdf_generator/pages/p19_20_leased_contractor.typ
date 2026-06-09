// =============================================================================
// PAGES 19-20: LEASED INDEPENDENT CONTRACTOR AGREEMENT
// =============================================================================

#import "../styles.typ": *

#let page-leased-contractor-agreement(data) = {
  pagebreak()
  
  // Header
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(1em)
  
  // Title
  align(center)[
    #text(size: 14pt, style: "italic", weight: "bold")[Leased Independent Contractor Agreement]
  ]
  
  v(1em)
  
  align(center)[
    *#underline[#company-name(data)]* also known as (Carrier) and
  ]
  
  v(1em)
  
  line(length: 4in, stroke: 0.5pt)
  align(center)[(Independent Contractor)]
  
  v(0.5em)
  
  text(size: 10pt)[
    Are entering this independent contract used for the purpose of obtaining driving privileges with *#underline[#company-name(data)]*
  ]
  
  v(0.5em)
  
  [Independent Contractor understands that:#underlined("", width: 3in)]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[
    a) He/She is not an employee of *#underline[#company-name(data)]* and is not entitled to make any claims against the trucking company, including but not limited to; No- Fault benefits, workers compensations, unemployment benefits, and industrial accident benefits, paid vacation, sick leave, health insurance, or any other type of insurance whatsoever.
  ]
  
  v(0.3em)
  
  text(size: 10pt, weight: "bold")[
    b) He/She must enter the Customer premises and perform contracted services in a good and professional manner. There will be no claims from the Leased Independent Contractor against our Customer for personal injuries unless there has been an accident caused by the incompetence of one of the Customer's employees in which case *#underline[#company-name(data)]* is responsible to open a lawsuit against the Customer in benefit of the Leased Independent Contractor.
  ]
  
  v(0.3em)
  
  text(size: 10pt, weight: "bold")[
    c) He/She agrees to read and understand all the rules and regulations required by all local, state, and federal laws.
  ]
  
  v(0.3em)
  
  text(size: 10pt, weight: "bold")[
    d) Independent Contractor, if involved in an accident, must notify the Carrier no later than two hours and present a written accident report within 24 hours following any such accident.
  ]
  
  v(0.5em)
  
  list(
    marker: [●],
    indent: 2em,
    [Until the statute of limitation has expired on any accident, the Independent Contractor agrees to cooperate with the company regarding any claims, lawsuits, including discovery requests, interrogatories, request to produce, depositions and appearance at trial. Failure to do so may result in the Independent Contractor being personally responsible for the claim or lawsuit.],
    [Independent Contractor is responsible for any legal fees, unpaid insurance claims or personal lawsuits.],
    [If Independent Contractor terminates earlier than 6 months, the deposit will not be returned, even if 2 weeks notice is given.],
    [Independent Contractor is responsible for any damages, towing and incurs depreciation to the vehicle; if but not limited to Independent Contractor error.],
  )
  
  v(1em)

  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Signature:#driver-signature(data, width: 3in)],
    [Date#underlined("", width: 1.2in)]
  )
  
  // Page 2
  pagebreak()
  
  // Header
  align(center)[
    #text(size: 24pt, weight: "bold")[#company-name(data)]
  ]
  
  v(1em)
  
  // Title
  align(center)[
    #text(size: 14pt, style: "italic", weight: "bold")[Leased Independent Contractor Agreement]
  ]
  
  v(1em)
  
  [I,#underlined(driver-name(data), width: 4in) , aka (Independent Contractor)]
  
  v(0.3em)
  
  text(size: 10pt)[
    Read and understand the agreement above and he agrees with all the conditions of this contract. Independent Contractor will not violate any of the mentioned above conditions and understands that if he does not follow them his employer may be charged, or his contract may be terminated.
  ]
  
  v(0.8em)
  
  text(size: 10pt, weight: "bold")[
    I sign this contract of my own free will. I am not under any drug or alcohol influence. No one from *#underline[#company-name(data)]* or elsewhere made me sign this document. I understand that this document is a legal binding document and it can be used against me in the court of law. Upon signing this document I agree with all conditions and rules of *#underline[#company-name(data)]* aka (Carrier).
  ]
  
  v(0.8em)
  
  text(size: 10pt)[
    This agreement shall be governed by the laws of the State of Illinois, both as to interpretation and performance other than injunctive or equitable relief, the parties agree that all matters will be submitted to binding arbitration, and action brought by either of the parties arising out of this agreement shall be commenced and maintained within the jurisdiction of the State of Illinois. The parties agree and consent and do not object that service of process by regular mail or certified mail (whether or not signed for) at the last known address or personal service on either of the parties outside of the State of Illinois shall be sufficient to give The State of Illinois and any court or arbitration panel personal jurisdiction over either of either of the parties. In the state of Illinois, each party shall appoint one arbitration and arbitrators so appointed shall select a natural arbitrator. The determination of a majority of arbitrators shall be binding on the parties, shall not be appeasable, and judgment on the award/decision rendered may be entered in any Illinois or other court having jurisdiction over the matter/parties. Each party is responsible for its own cost and expenses (including, but not limited to attorney fees and one half of the fees and expenses of the neutral arbitrator) incurred in enforcing its rights under the arbitration process. The arbitrators are not empowered to award damages in excess of compensatory damages. Independent Contractor has had adequate time to review and read this acknowledgement and is signing it voluntarily without force or correction. Independent Contractor further agrees that he/she is familiar with the English language and has read and understood this contract. If any one or more of the provisions contained in the Agreement but the Agreement will be enforceable to the extent applicable. Failure to read this Agreement does not prevent its enforcement.
  ]
  
  v(1.5em)
  
  [Independent Contractor Name#underlined(driver-name(data), width: 4in)]
  
  v(0.5em)

  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Signature:#driver-signature(data, width: 3in)],
    [Date#underlined("", width: 1.2in)]
  )
  
  v(1em)
  
  [Company Representative:]
  
  v(0.3em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Signature:#underlined("", width: 3in)],
    [Date#underlined("", width: 1.2in)]
  )
}
