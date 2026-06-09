// =============================================================================
// PAGES 34-47: LEASE AGREEMENT (OWNER ONLY)
// This document is only included if driver is an owner (has own equipment)
// =============================================================================

#import "../styles.typ": *

#let page-lease-agreement(data) = {
  // Get config values
  let config = data.at("config", default: (:))
  let trailer-maintenance = config.at("trailer_maintenance_monthly", default: 0)
  let company-state = config.at("company_state", default: "Illinois")
  
  // W-9 data extraction for party info
  // If business_name is filled + EIN provided → company, else individual
  let w9 = data.at("w9", default: (:))
  let has-business = w9.at("business_name", default: "") != ""
  
  // Party 1 (Company) info from config
  let company-addr = config.at("company_address", default: "") + ", " + config.at("company_city", default: "") + ", " + config.at("company_state", default: "") + " " + config.at("company_zip", default: "")
  
  // Party 2 (Owner) info from W-9
  let owner-name = if has-business { w9.at("business_name", default: "") } else { w9.at("name", default: driver-name(data)) }
  let owner-addr = w9.at("address", default: "") + ", " + w9.at("city_state_zip", default: "")
  
  // =========================================================================
  // PAGE 34: LEASE AGREEMENT COVER
  // =========================================================================
  pagebreak()
  
  align(center)[
    #text(size: 18pt, weight: "bold")[LEASE AGREEMENT]
  ]
  
  v(1em)
  
  text(size: 10pt, weight: "bold")[Notice: ]
  text(size: 10pt)[This Lease Agreement must be retained in the Equipment throughout the duration of the Agreement.]
  
  v(1em)
  
  text(size: 10pt, weight: "bold")[I.] 
  text(size: 10pt)[This Agreement is between #underlined(company-name(data), width: 2.5in), with a registered address at #underlined(company-addr, width: 4in) and #underlined(owner-name, width: 2.5in), with a registered address at #underlined(owner-addr, width: 4in) are parties to a written Lease Agreement (Agreement), whereby the Equipment Owner has leased to the Carrier certain motor vehicle equipment listed below, owned and controlled by the Equipment Owner, whereby the Equipment Owner is providing the Carrier as operator of the Equipment for the purpose of loading, transporting and unloading freight.]
  
  v(0.8em)
  
  text(size: 10pt, weight: "bold")[II.] 
  text(size: 10pt)[The Original Agreement is on file at the Carrier's General Office. A copy of this Lease Agreement and receipt for the Equipment must be carried on the Equipment as required by 49 CFR 376. Carrier verifies that the Equipment is being operated by the Carrier, pursuant to the terms of the Agreement.]
  
  v(0.8em)
  
  text(size: 10pt, weight: "bold")[III.] 
  [Equipment Owner/Equipment Information Name: #underlined("", width: 2.5in)]
  
  v(0.5em)
  
  text(size: 12pt, weight: "bold")[Unit\# #underlined("", width: 3in)]
  
  v(1em)
  
  align(center)[
    #text(size: 12pt, weight: "bold")[Duration of Lease Agreement and Termination]
  ]
  
  v(0.5em)
  
  text(size: 10pt)[The Lease Agreement shall begin on the date below and shall remain in effect until terminated by either party, giving one (1) day notice to that effect. Notice may be given personally, by mail or by fax at the address or fax number shown in the Lease Agreement.]
  
  v(0.8em)
  
  [Signed this date #underlined("", width: 1.5in)]
  
  v(1.5em)
  
  grid(
    columns: (1fr, 1fr),
    gutter: 2em,
    [
      #text(weight: "bold", size: 11pt)[#underline[MOTOR CARRIER:]]
      #v(0.5em)
      #underlined("", width: 2.5in)
      #v(0.3em)
      By: #underlined("", width: 2in)
    ],
    [
      #text(weight: "bold", size: 11pt)[#underline[EQUIPMENT OWNER:]]
      #v(0.5em)
      #underlined("", width: 2.5in)
      #v(0.3em)
      By: #underlined("", width: 2in)
    ]
  )
  
  // =========================================================================
  // PAGE 35: RECITALS
  // =========================================================================
  pagebreak()
  
  text(size: 14pt, weight: "bold")[Recitals]
  
  v(0.8em)
  
  text(size: 10pt)[
    Whereas, Lessor has certain motor transportation equipment identified fully in Appendix A, attached and adopted herein by this reference, (hereafter the "Equipment") that Lessor is desirous of leasing to Carrier;
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    Whereas, Lessor is desirous of leasing the Equipment with Lessor's qualified Independent Contractor or Independent Contractors who will operate the equipment subject to the sole direction control and supervision of the Independent Contractor except as required by certain regulations imposed upon Carrier and contained in 49 CFR §§ 376.11, 376.12;
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    Whereas, Lessor will direct, control and supervise the Independent Contractor in a manner allowing Carrier solely the exclusive direction and use of the equipment during the time Carrier is providing Carrier's authorized transportation services, without employing the Independent Contractor, to comply with 49 CFR § 376.12(c);
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    Whereas, The Equipment is to be utilized herein in conformity with 49 CFR § 383.5 with the Independent Contractor being an independent contractor, the parties intend that solely the Equipment shall be subject to the direction, control and supervision of Carrier, while all direction control and supervision of the Independent Contractor shall remain vested in the Lessor, including, but not limited to the sole responsibility for payment of salaries, workers' compensation and unemployment insurance and all other incidents involving the retention and payment to Lessor for the personal services of the Independent Contractor of the Equipment;
  ]
  
  v(0.5em)
  
  text(size: 10pt)[
    Whereas, the mutual cooperation of Lessor and Carrier are required to comply with the safety regulations of the Department of Transportation administered through the Federal Motor Carrier Safety Administration as well as the safety statutes and regulations of all states and local authorities, in and through which Carrier operates, for the operation and maintenance of the leased Equipment and the qualifications of the Independent Contractor(s) who may operate the Equipment.
  ]
  
  // =========================================================================
  // PAGE 36: IT IS AGREED (Points 1-3)
  // =========================================================================
  pagebreak()
  
  text(size: 14pt, weight: "bold")[IT IS AGREED]
  
  v(0.8em)
  
  text(size: 10pt, weight: "bold")[1. ADOPTION OF RECITALS.] 
  text(size: 10pt)[The above recitals are adopted herein as material terms and conditions of this Agreement; provided, Lessor specifically represents that Lessor shall indemnify and hold Carrier harmless from any responsibility, liabilities and expenses (inclusive of reasonable attorney fees) arising from a failure on the part of Lessor to adhere to Lessor's responsibilities with respect to its Independent Contractor(s), including, but not limited to workers' compensation and unemployment insurance, for any Independent Contractor utilized by Lessor and presented to Carrier for qualification under the safety and other applicable regulations.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[2. DURATION OF AGREEMENT (49 CFR 376.12(b)).] 
  text(size: 10pt)[This Agreement shall begin on the date indicated on the signature page and shall remain in effect for a period of not less than one (1) year from that date, however, this Agreement may be terminated at any time in accordance with the Carrier, with a notice of 2 weeks.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[3. COMPENSATION (49 CFR 376.12(d)).] 
  text(size: 10pt)[It is expressly understood and agreed that INDEPENDENT CONTRACTOR's compensation shall be as set forth in SUPPLEMENT B ("Schedule of Compensation") and such compensation shall constitute the total compensation for everything furnished, provided, or done by INDEPENDENT CONTRACTOR in connection with this Agreement, including Independent Contractor's services. All mileage computations shall be based on the CARRIER's mileage guide. INDEPENDENT CONTRACTOR's compensation is based on a percentage of gross revenue for a shipment, then, for purposes of computing INDEPENDENT CONTRACTOR's compensation, gross revenue means those monies received by CARRIER from the shipper or consignee for the transportation of commodities by INDEPENDENT CONTRACTOR on behalf of CARRIER less any direct or indirect cost, expense, or fee causing a reduction in revenue to CARRIER, and less any surcharges instituted by CARRIER.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[4. TERMINATION.] 
  text(size: 10pt)[This Agreement may be terminated for any reason by CARRIER by giving one (1) day's written notice to that effect to the other party either personally, by mail, or by FAX machine at the address or FAX number shown at the end of this Agreement. Upon termination and receipt of the equipment, INDEPENDENT CONTRACTOR shall execute a receipt in a form set forth in SUPPLEMENT C ("Equipment Termination Release"). Upon termination of this Lease Agreement, Independent Contractor shall remove all Carrier identification from the outside of the unit; return all fuel cards, permits, decals. Upon return of these items, Carrier will execute a written receipt for the returns of said leased equipment to Independent Contractor.]
  
  // =========================================================================
  // PAGES 37-43: Points 5-10 (Equipment, Insurance, Claims, etc.)
  // =========================================================================
  pagebreak()
  
  text(size: 10pt, weight: "bold")[5. EXCLUSIVE POSSESSION AND RESPONSIBILITIES (49 CFR 376.12(c)(1)).] 
  text(size: 10pt)[CARRIER shall have exclusive possession, control, and use of the Equipment for the duration of this Agreement. CARRIER assumes complete responsibility for the operation of the Equipment for the duration of the Lease in accordance with applicable Federal and State regulations.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[6. SAFETY, REGULATORY, AND INSURANCE REQUIREMENTS.] 
  text(size: 10pt)[INDEPENDENT CONTRACTOR shall operate the Equipment in full compliance with all applicable federal, state, and local laws and regulations including, but not limited to, the Federal Motor Carrier Safety Regulations (FMCSRs). INDEPENDENT CONTRACTOR shall maintain all required licenses, permits, and registrations necessary for the operation of the Equipment.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[7. EQUIPMENT CONDITION AND MAINTENANCE.] 
  text(size: 10pt)[INDEPENDENT CONTRACTOR represents and warrants that the Equipment is in good and safe operating condition, meets all applicable federal, state, and local safety requirements and is properly registered and licensed for operation as a commercial motor vehicle. INDEPENDENT CONTRACTOR agrees to maintain the Equipment in good and safe operating condition throughout the term of this Agreement at INDEPENDENT CONTRACTOR's sole expense.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[8. IDENTIFICATION DEVICES (49 CFR 376.11(c)).] 
  text(size: 10pt)[CARRIER shall affix to the Equipment identification devices meeting the requirements of 49 CFR 390.21, as well as any applicable state or local requirements. Upon termination of this Agreement, INDEPENDENT CONTRACTOR shall immediately remove or return any identification devices or company property.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[9. PERMITS (49 CFR 376.12(i)).] 
  text(size: 10pt)[CARRIER shall be responsible for obtaining and paying for all permits and special authorizations required for transportation services provided under this Agreement, unless otherwise agreed in writing.]
  
  // =========================================================================
  // PAGE 44-45: Point 10-11 (Claims, Chargebacks)
  // =========================================================================
  pagebreak()
  
  text(size: 10pt, weight: "bold")[10. ACCIDENT REPORTS AND CLAIMS.] 
  text(size: 10pt)[INDEPENDENT CONTRACTOR shall immediately report any accident to CARRIER involving operations under this Agreement, including INDEPENDENT CONTRACTOR's written report of such accident. In the event INDEPENDENT CONTRACTOR fails to notify CARRIER of the accident within eight (8) hours from the time of the accident, INDEPENDENT CONTRACTOR shall be liable for all damages resulting from that failure to notify, including but not limited to consequential damages, fines, claims by third parties and reasonable attorney's fees. A Police Report must be submitted to the CARRIER, along with a full, written Accident report Form covering each occurrence as required by federal and state regulations.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[11. CHARGEBACKS (49 CFR 376.12(h)).] 
  text(size: 10pt)[CARRIER shall charge back to INDEPENDENT CONTRACTOR at the time of payment or settlement, any expenses CARRIER has borne that, under this Agreement, INDEPENDENT CONTRACTOR is obligated to bear. Such expenses shall be deducted from the amount of INDEPENDENT CONTRACTOR's compensation and shall include, but not be limited to, those expenses set forth in this Agreement as well as C.O.D. and freight collect remittances due CARRIER, cargo claims, property damage, leasing materials, log books, towing charges, insurance deductibles, reasonable attorney's fees incurred in reducing potential liabilities arising out of, or in connection with, INDEPENDENT CONTRACTOR's actions or failure to act under the terms of this Agreement, and all state tax licenses, permits, and stamps. CARRIER shall provide INDEPENDENT CONTRACTOR written itemization and documentation of all charge backs prior to making such charge backs.]
  
  v(0.3em)
  
  text(size: 10pt)[In addition to the chargeback or withholding authority granted by INDEPENDENT CONTRACTOR to CARRIER elsewhere in this lease, INDEPENDENT CONTRACTOR agrees that CARRIER shall have the right to charge against any settlement owed under this Lease amounts sufficient to reimburse CARRIER for the following expenses which CARRIER may incur on behalf or in the name of the Independent Contractor:]
  
  v(0.3em)
  
  list(
    marker: [a.],
    indent: 1em,
    body-indent: 0.5em,
    [Any fines or penalties imposed upon CARRIER as a result of violations by Independent Contractor.],
  )
  list(
    marker: [b.],
    indent: 1em,
    body-indent: 0.5em,
    [Any losses or expense incurred by CARRIER as a result of its inability to collect freight charges earned due to Independent Contractor's failure to properly complete and to submit paperwork and documents in a timely manner.],
  )
  list(
    marker: [c.],
    indent: 1em,
    body-indent: 0.5em,
    [Any loss or damage to property or cargo, or any other losses or expenses which CARRIER may incur or for which it may be held liable as a result of the INDEPENDENT CONTRACTOR's conduct.],
  )
  list(
    marker: [d.],
    indent: 1em,
    body-indent: 0.5em,
    [All fines and penalties on Overweight trailers, to be the fault of Independent Contractor negligence.],
  )
  list(
    marker: [e.],
    indent: 1em,
    body-indent: 0.5em,
    [Deductible amounts on claims against liability, physical and cargo insurance policies when it is found to be the fault of the INDEPENDENT CONTRACTOR or his Independent Contractors a sum equal to the any deductible for each incident which said deductible is currently \$2,500.00 but is subject to change during the term of this Lease.],
  )
  list(
    marker: [f.],
    indent: 1em,
    body-indent: 0.5em,
    [If this contract is breached or INDEPENDENT CONTRACTOR decides to end the INDEPENDENT CONTRACTOR relationship with the CARRIER before the expiration of the term of this agreement charges for decal and permits will apply and the security deposit funds will be forfeited.],
  )
  list(
    marker: [g.],
    indent: 1em,
    body-indent: 0.5em,
    [Monthly payment of \$#trailer-maintenance will be deducted from INDEPENDENT CONTRACTOR's settlement. INDEPENDENT CONTRACTOR is responsible for maintenance of the trailer, including tires change and other preventive expenses.],
  )
  
  // =========================================================================
  // PAGES 45-46: Points 12-23
  // =========================================================================
  pagebreak()
  
  text(size: 10pt, weight: "bold")[12. FINAL SETTLEMENT (49 CFR 376.12(f)).] 
  text(size: 10pt)[With respect to final settlement, the failure on the part of INDEPENDENT CONTRACTOR to remove all identification devices of CARRIER, and, except in the case of identification painted directly on the Equipment, return them to CARRIER in any reasonable manner, shall constitute a breach of this Agreement. Such breach shall entitle CARRIER to withhold any payments owed to INDEPENDENT CONTRACTOR until such obligations are met. The parties agree that, in addition to any other right, remedy or claim CARRIER may have, INDEPENDENT CONTRACTOR shall pay CARRIER \$50.00 per day for INDEPENDENT CONTRACTOR's failure to remove and/or return such identification.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[13. LUMPING AND DETENTION (49 CFR 376.12(e)).] 
  text(size: 10pt)[Whenever a shipper or a consignee requires that INDEPENDENT CONTRACTOR be assisted in the loading or unloading of property transported on behalf of CARRIER, CARRIER shall pass through to INDEPENDENT CONTRACTOR any compensation it receives from such shipper or consignee for any costs associated with such requirement. Otherwise, INDEPENDENT CONTRACTOR shall be responsible for the loading or unloading of such property at INDEPENDENT CONTRACTOR's expense. Further, detention charges that are collected by CARRIER shall be directly paid to INDEPENDENT CONTRACTOR in accordance with its compensation percentages.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[14. TRAILER DETACHMENT.] 
  text(size: 10pt)[INDEPENDENT CONTRACTOR understands that loaded trailers are not to be detached from the tractor, under any circumstances, unless otherwise instructed by CARRIER. INDEPENDENT CONTRACTOR understands that detached trailers are not covered under the cargo and liability insurance policy and failure to obey this requirement will result in INDEPENDENT CONTRACTOR being held solely responsible for any loss or damage, theft or any other issues that may occur.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[15. PRE/POST TRIP EQUIPMENT INSPECTION.] 
  text(size: 10pt)[INDEPENDENT CONTRACTOR must complete pre/post trip inspections of any trailer promptly after attaching the trailer to the tractor and before detaching the same trailer at the assigned terminal on a CARRIER's pre-printed inspection form. Both pre and post trip inspection reports must be submitted immediately after completion to CARRIER. INDEPENDENT CONTRACTOR shall be held accountable for any damages and preventable maintenance issues that have not been reported at the time of drop off which may be deducted from INDEPENDENT CONTRACTOR's settlement.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[16. BENEFIT.] 
  text(size: 10pt)[This Agreement shall be binding upon and inure to the benefit of the parties to this Agreement and their respective successors.]
  
  // =========================================================================
  // PAGE 46: Points 17-23
  // =========================================================================
  pagebreak()
  
  text(size: 10pt, weight: "bold")[17. ASSIGNMENT.] 
  text(size: 10pt)[CARRIER shall have the right to assign this Agreement at any time without the consent of INDEPENDENT CONTRACTOR. The INDEPENDENT CONTRACTOR shall have no right to assign this Agreement.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[18. NOTICE.] 
  text(size: 10pt)[All notice provisions of this Agreement shall be in writing delivered personally, by postage prepaid, first class mail, or by facsimile machine to the addresses or fax number shown at the end of this Agreement.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[19. COMPLETE AGREEMENT.] 
  text(size: 10pt)[This Agreement, including any Appendices attached, constitutes the sole, entire, and existing agreement between the parties herein, and supersedes all prior agreements and undertakings, oral and written, expressed or implied, or practices, between the parties, and expresses all obligations and restrictions imposed on each of the respective parties during its term, except those specifically modified or changed by mutual written agreement between CARRIER and INDEPENDENT CONTRACTOR. This Agreement shall be deemed to have been drawn in accordance with the statutes and laws of the State of #company-state and in event of any disagreement or litigation, the laws of this state shall apply and suit must be brought in this state.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[20. SEVERABILITY AND SAVING CLAUSE.] 
  text(size: 10pt)[If any term of provision of this Agreement shall be held invalid by operation of law or by any tribunal of competent jurisdiction, or if compliance with or enforcement of any provisions should be restrained by such tribunal pending final determination as to its validity, the remainder of the terms of provisions, having application to persons or circumstances other than those found invalid or restrained, shall remain in full force and effect.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[21. ATTORNEY'S FEES AND COST.] 
  text(size: 10pt)[In the event CARRIER incurs costs or attorney's fees in enforcing any term or obligation of this LEASE, INDEPENDENT CONTRACTOR shall bear the cost of all reasonable attorneys' fees and cost incurred by CARRIER.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[22. RULES OF CONDUCT.] 
  text(size: 10pt)[INDEPENDENT CONTRACTOR and/or its Independent Contractors shall comply with CARRIER's rules of conduct as set forth in SUPPLEMENT P ("Rules of Conduct") of this Lease and as may be amended from time to time at CARRIER's sole discretion during the term of this Lease. INDEPENDENT CONTRACTOR shall require each of its Independent Contractors to read and sign the Rules of Conduct and provide a signed copy to CARRIER.]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[23. NON-SOLICITATION.] 
  text(size: 10pt)[INDEPENDENT CONTRACTOR acknowledges that it will have access to CARRIER's customers and agrees that it shall not solicit directly or indirectly during the term of this lease and from (1) year after its termination any of CARRIER's customers that INDEPENDENT CONTRACTOR carried load(s) for or learned the existence of as a result of carrying loads for CARRIER during the term of this lease. INDEPENDENT CONTRACTOR acknowledges that CARRIER's customers are material to CARRIER's business and that in the event INDEPENDENT CARRIER were to solicit CARRIER's customers CARRIER would suffer substantial damages which would cause irreparable harm to CARRIER which CARRIER has no adequate remedy at law.]

  // =========================================================================
  // PAGE 47: SIGNATURE PAGE
  // =========================================================================
  pagebreak()
  
  text(size: 10pt, weight: "bold")[24.] 
  text(size: 10pt)[The undersigned INDEPENDENT CONTRACTOR or his duly authorized representative states that he has read the entire Agreement and knows and understands INDEPENDENT CONTRACTOR's rights, duties and obligations under this Agreement.]
  
  v(1em)
  
  text(size: 10pt, weight: "bold")[IN WITNESS WHEREOF, CARRIER and INDEPENDENT CONTRACTOR do hereby sign this Agreement on the day#underlined("", width: 1.5in), the effective date of this Agreement.]
  
  v(1.5em)
  
  grid(
    columns: (1fr, 1fr),
    gutter: 2em,
    [
      #text(weight: "bold")[INDEPENDENT CONTRACTOR:]
      #v(0.5em)
      Name: #underlined(driver-name(data), width: 2in)
      #v(0.3em)
      Address: #underlined("", width: 2.5in)
      #v(0.3em)
      Phone: #underlined("", width: 1.5in)
      #v(0.3em)
      FEIN/SSN: #underlined("", width: 1.5in)
      #v(0.5em)
      By: #underlined("", width: 2in)
      #v(0.3em)
      Title: #underlined("", width: 1.5in)
    ],
    [
      #text(weight: "bold")[CARRIER:]
      #v(0.5em)
      #company-name(data)
      #v(0.3em)
      #config.at("company_address", default: "")
      #v(0.3em)
      #(config.at("company_city", default: "") + ", " + config.at("company_state", default: "") + " " + config.at("company_zip", default: ""))
      #v(0.3em)
      Phone: #config.at("company_phone", default: "")
      #v(0.5em)
      By: #underlined("", width: 2in)
      #v(0.3em)
      Title: #underlined("", width: 1.5in)
    ]
  )
}
