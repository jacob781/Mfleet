// =============================================================================
// PAGE 18: NO RETURN VEHICLE POLICY
// =============================================================================

#import "../styles.typ": *

#let page-no-return-vehicle(data) = {
  pagebreak()
  
  // Title
  align(center)[
    #text(size: 16pt, weight: "bold")[NO RETURN VEHICLE POLICY]
  ]
  
  v(1em)
  
  [BETWEEN *#underline[#company-name(data)]* AND #underlined(driver-name(data), width: 3in)]
  
  v(0.5em)
  
  text(size: 10pt)[
    This No Return Vehicle Policy ("Policy") is entered into between *#underline[#company-name(data)]*, hereinafter referred to as the "Company," and
  ]
  
  v(0.3em)
  
  [#underlined(driver-name(data), width: 3.5in), hereinafter referred to as the "Independent Contractor." This Policy outlines the terms and conditions regarding the recovery of Company-owned vehicles, specifically addressing situations where the Independent Contractor has abandoned the vehicle.]
  
  v(0.5em)
  
  text(weight: "bold")[1. Vehicle Recovery]
  v(0.2em)
  [1.1 The Company retains full ownership of the vehicles assigned to the Independent Contractor during the course of their employment.]
  v(0.2em)
  [1.2 In the event that the Independent Contractor abandons a Company-owned vehicle in any way, shape, or form, the Company reserves the right to recover the vehicle promptly.]
  v(0.2em)
  [1.3 Vehicle recovery may include, but is not limited to, the use of towing services, repossession agents, or legal actions, as deemed necessary by the Company.]
  
  v(0.5em)
  
  text(weight: "bold")[2. Consequences of Abandonment]
  v(0.2em)
  [2.1 If the Independent Contractor abandons a Company-owned vehicle, they shall forfeit any rights to receive a salary or any deposit held by the Company.]
  v(0.2em)
  [2.2 The Independent Contractor acknowledges that any outstanding salary payments or deposits, if applicable, shall be retained by the Company as compensation for the cost of vehicle recovery, damages, and associated expenses incurred due to the abandonment.]
  
  v(0.5em)
  
  text(weight: "bold")[3. Independent Contractor Acknowledgement]
  v(0.2em)
  [3.1 By signing this Policy, the Independent Contractor acknowledges their understanding and agreement to the terms and conditions outlined herein.]
  v(0.2em)
  [3.2 The Independent Contractor agrees that they will be responsible for any expenses incurred by the Company for the recovery of the abandoned vehicle, and that such expenses may be deducted from any outstanding salary or deposit.]
  
  v(0.5em)
  
  text(weight: "bold")[4. Governing Law and Dispute Resolution]
  v(0.2em)
  [4.1 This Policy shall be governed by and construed in accordance with the laws of the State of *#underline[#data.config.company_state]*.]
  v(0.2em)
  [4.2 Any disputes arising from the interpretation or application of this Policy shall be resolved through arbitration in accordance with the rules and procedures of Arbitration Association/Company's Dispute Resolution Process.]
  
  v(0.5em)
  
  text(weight: "bold")[5. Termination]
  v(0.2em)
  [5.1 This Policy remains in effect for the duration of the Independent Contractor's employment with the Company.]
  
  v(0.5em)
  
  text(weight: "bold")[6. Entire Agreement]
  v(0.2em)
  [6.1 This Policy constitutes the entire agreement between the Company and the Independent Contractor regarding the recovery of Company-owned vehicles due to abandonment.]
  
  v(1em)
  
  text(weight: "bold")[#underline[#company-name(data)]]
  v(0.3em)
  [Signature:#carrier-signature(data, width: 2.5in)]
  v(0.2em)
  [By:#underlined(company-name(data), width: 2.5in)]
  v(0.2em)
  [Title:#underlined(carrier-title, width: 2.5in)]
  v(0.2em)
  [Date:#underlined(carrier-date(data), width: 1.5in)]
  
  v(1em)
  
  [I, #underlined(driver-name(data), width: 3in) hereby acknowledge that I have received, read, and understood the terms and conditions of the No Return Vehicle Policy and agree to abide by its provisions.]
  
  v(0.5em)
  
  [Independent Contractor's Signature:#driver-signature(data, width: 3in)]
  v(0.3em)
  [Date:#underlined(fill-date(data), width: 1.5in)]
}
