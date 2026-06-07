// =============================================================================
// PAGE 48: SUPPLEMENT B - SCHEDULE OF COMPENSATION
// =============================================================================

#import "../styles.typ": *

#let page-supplement-b(data) = {
  pagebreak()
  
  // Get config values
  let config = data.at("config", default: (:))
  let is-owner = data.at("is_owner", default: false)
  
  // Compensation settings
  let comp-type = config.at("compensation_type", default: "percentage")
  let weekly-amount = config.at("weekly_amount", default: 0)
  let percentage-rate = config.at("percentage_rate", default: 0)
  let loaded-rate = config.at("loaded_rate", default: 0)
  let empty-rate = config.at("empty_rate", default: 0)
  let hourly-rate = config.at("hourly_rate", default: 0)
  
  // Schedule items (set by manager)
  let insurance-cargo = config.at("insurance_cargo_liability", default: 0)
  let eld-weekly = config.at("eld_device_weekly", default: 0)
  let tablet-weekly = config.at("tablet_weekly", default: 0)
  let prepass-monthly = config.at("prepass_monthly", default: 0)
  let admin-fee-weekly = config.at("administration_fee_weekly", default: 0)
  
  text(size: 14pt, weight: "bold")[SUPPLEMENT B ("Schedule of Compensation")]
  
  v(1em)
  
  // Dynamic compensation text based on type
  if comp-type == "percentage" {
    [CARRIER agrees, to pay #text(weight: "bold")[#percentage-rate%] (to hold #h(0.3em) #percentage-rate% commission) of gross receipts of each load, minus]
  } else if comp-type == "weekly_flat" {
    [CARRIER agrees, to pay #text(weight: "bold")[\$#weekly-amount weekly] flat rate, minus]
  } else if comp-type == "per_mile" {
    [CARRIER agrees, to pay #text(weight: "bold")[\$#loaded-rate per loaded mile] and #text(weight: "bold")[\$#empty-rate per empty mile], minus]
  } else if comp-type == "hourly" {
    [CARRIER agrees, to pay #text(weight: "bold")[\$#hourly-rate per hour], minus]
  }
  
  [applicable security deposit, cargo liability insurance and insurance deductions, agreed upon damage payments, and fuel card payments, if any.]
  
  v(1em)
  
  text(size: 10pt, weight: "bold")[1.] 
  text(size: 10pt)[
    CARRIER agrees to pay, and INDEPENDENT CONTRACTOR agrees to accept as full and complete payment for use of said equipment and for performance of obligations accepted by INDEPENDENT CONTRACTOR under this Agreement, compensation as set forth in Section 2 above. #text(weight: "bold")[CARRIER shall settle with INDEPENDENT CONTRACTOR on each Monday within (14) days of the submission by the INDEPENDENT CONTRACTOR the Bill of Lading, signed delivery receipts, INDEPENDENT CONTRACTOR log books for the completed trip. Original fuel invoices are also due at this time if the INDEPENDENT CONTRACTOR chooses the Fuel Tax accounting service below. All applicable paperwork must be submitted to CARRIER no later than close of business (4.00p.m. CST) preceding Monday in order to be paid 7 days later on the following Monday. If paperwork is not complete,INDEPENDENT CONTRACTOR will be paid the following week on Monday.]
  ]
  
  v(0.8em)
  
  text(size: 10pt, weight: "bold")[2. #h(0.5em) IFTA: ]
  text(size: 10pt)[
    Fuel tax accounting services will be available to INDEPENDENT CONTRACTOR, if he so chooses and fees will be paid on. Company providing said service. If not, all quarterly fuel tax payments remain the full responsibility of INDEPENDENT CONTRACTOR.
  ]
  
  v(0.3em)
  
  // IFTA choices - Owner chooses option
  if is-owner {
    [#h(1em) #box(stroke: 0.5pt, width: 0.4em, height: 0.4em) I choose to file my own quarterly Fuel Tax Returns]
    
    v(0.2em)
    
    [#h(1em) #box(stroke: 0.5pt, width: 0.4em, height: 0.4em) I choose to use the Fuel Tax reporting service chosen by CARRIER]
    [to be automatically deducted by CARRIER from the settlement/payment.]
    [\$35 weekly charge if more then \$420 at the end of quarter, will get charged the difference.]
  }
  
  v(0.8em)
  
  text(size: 10pt, weight: "bold")[3. ]
  text(size: 10pt)[
    Insurance (Cargo, Liability, Trailer Interchange) \$#box[#underlined(str(insurance-cargo), width: 0.8in)]#h(0.3em)weekly
  ]
  
  v(0.5em)
  
  // Points 4-7 only for owners
  if is-owner {
    text(size: 10pt, weight: "bold")[4. ]
    text(size: 10pt)[
      ELD Device: \$#box[#underlined(str(eld-weekly), width: 0.8in)]#h(0.3em)weekly
    ]
    
    v(0.5em)
    
    text(size: 10pt, weight: "bold")[5. ]
    text(size: 10pt)[
      Tablet: \$#box[#underlined(str(tablet-weekly), width: 0.8in)]#h(0.3em)weekly
    ]
    
    v(0.5em)
    
    text(size: 10pt, weight: "bold")[6. ]
    text(size: 10pt)[
      PrePass: \$#box[#underlined(str(prepass-monthly), width: 0.8in)]#h(0.3em)monthly
    ]
    
    v(0.5em)
    
    text(size: 10pt, weight: "bold")[7. ]
    text(size: 10pt)[
      Administration fee: \$#box[#underlined(str(admin-fee-weekly), width: 0.8in)]#h(0.3em)weekly
    ]
  }
  
  v(0.8em)
  
  text(size: 10pt, weight: "bold")[8. ]
  text(size: 10pt)[
    In case of Carrier's fuel card and Ipass, the charges will get deducted from Independent Contractor's settlements.
  ]
  
  v(2em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Independent Contractor Signature#underlined("", width: 2.5in)],
    [Date#underlined("", width: 1.2in)]
  )
}
