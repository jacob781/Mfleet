// =============================================================================
// PAGE 51-53: PENALTIES FOR NON-COMPLIANCE (SCHEDULE A)
// Note: The full table is in FINES_AND_FEES_SCHEDULE.pdf to be merged
// This provides a header/intro page before the merged PDF
// =============================================================================

#import "../styles.typ": *

#let page-penalties-intro(data) = {
  pagebreak()
  
  v(8em)
  
  align(center)[
    #rect(width: 80%, stroke: 1pt, inset: 1em)[
      #align(center)[
        #text(size: 18pt, weight: "bold")[SCHEDULE A]
        
        #v(0.5em)
        
        #text(size: 16pt, weight: "bold")[PENALTIES FOR NON-COMPLIANCE]
      ]
    ]
  ]
  
  v(2em)
  
  text(size: 9pt)[
    The Company shall impose chargebacks against the compensation of the Contractor identified in Schedule A annexed hereto and made a part hereof. Items for which a chargeback is authorized that specifically provided for in this agreement shows how the amount is computed for each item to be charged to the Contractor. The Contractor shall be entitled to copies of those documents necessary to determine the validity of all items charged back against compensation.
  ]
  
  v(1em)
  
  align(center)[
    #text(size: 10pt, weight: "bold")[CHARGEBACKS - \$100 per each point]
  ]
  
  v(2em)
  
  // Table header
  table(
    columns: (3fr, 0.7fr, 1fr, 1fr),
    stroke: 0.5pt,
    inset: 6pt,
    align: (left, center, center, center),
    
    table.header(
      text(size: 9pt, weight: "bold")[VIOLATION TYPE],
      text(size: 9pt, weight: "bold")[HOW BAD?],
      text(size: 9pt, weight: "bold")[1ST TIME],
      text(size: 9pt, weight: "bold")[2ND TIME],
    ),
    
    // ELD VIOLATIONS section header
    table.cell(colspan: 4, fill: luma(230))[
      #text(size: 9pt, weight: "bold")[ELD VIOLATIONS]
    ],
    
    [Driving beyond 14 hour duty period], [7], [\$700], [],
    [Driving beyond 11 hour driving limit], [7], [\$700], [],
    [Driving beyond 8 hour limit since last off-duty/sleeper period (30 min)], [7], [\$700], [],
    [60/70 - hour rule violation], [7], [\$700], [],
    [False report of Independent Contractor's record of duty status], [7], [\$700], [],
    [ELD - No record of duty status (ELD Required)], [5], [\$500], [],
    [Independent Contractor's record of duty status not current], [5], [\$500], [],
    [Failing to retain previous 7 days records of duty status], [5], [\$500], [],
    [Failing to note malfunction requiring use of paper log], [5], [\$500], [],
    [Onboard recording device failure: failed to reconstruct info], [5], [\$500], [],
    [Failed to assume or decline unassigned driving time], [5], [\$500], [],
    [Record of Duty Status violation (general form and manner)], [1], [\$100], [],
    [Failed to make annotations when applicable], [1], [\$100], [],
    [Failed to have sufficient supply of blank records], [1], [\$100], [],
    [Failed to certify accuracy of ELD information], [1], [\$100], [],
    [ELD/TABLET not mounted in fixed position], [1], [\$100], [],
    [Failing to maintain ELD instruction sheet], [1], [\$100], [],
    [Failed to maintain ELD malfunction reporting requirements], [1], [\$100], [],
    
    // UNSAFE DRIVING section header
    table.cell(colspan: 4, fill: luma(230))[
      #text(size: 9pt, weight: "bold")[UNSAFE DRIVING VIOLATIONS]
    ],
    
    [Speeding 15 mph or more over the speed limit], [50], [\$5000, Termination], [],
    [Speeding 11-14 mph over the speed limit], [30], [\$3000, Termination], [],
    [School zone speeding], [20], [\$2,000], [\$4000, Term],
    [Construction zone speeding], [20], [\$2,000], [\$4000, Term],
    [Speeding 6-10 mph over the speed limit], [10], [\$1,000], [\$2000, Term],
    [Using hand-held mobile telephone while operating CMV], [10], [\$1,000], [],
    [Reckless driving], [10], [\$1,000], [\$2000, Term],
    [Operating CMV while ill/fatigued], [10], [\$1,000], [\$2000, Term],
    [Failing to use seat belt while operating CMV], [7], [\$700], [],
    [Driving in No trucks zone], [6], [\$600], [],
    [Speeding 1-5 mph over the speed limit], [5], [\$500], [\$1000, Term],
    [Failure to Maintain Lane], [5], [\$500], [],
    [Improper lane change], [5], [\$500], [],
  )
  
  // Page 52 - continuation
  pagebreak()
  
  table(
    columns: (3fr, 0.7fr, 1fr, 1fr),
    stroke: 0.5pt,
    inset: 6pt,
    align: (left, center, center, center),
    
    table.header(
      text(size: 9pt, weight: "bold")[VIOLATION TYPE],
      text(size: 9pt, weight: "bold")[HOW BAD?],
      text(size: 9pt, weight: "bold")[1ST TIME],
      text(size: 9pt, weight: "bold")[2ND TIME],
    ),
    
    [Improper turn], [5], [\$500], [],
    [Failure to obey traffic control device], [5], [\$500], [],
    [Failure to Yield right of way], [5], [\$500], [],
    [Distracted/Inattentive driving], [5], [\$500], [],
    [Following too close], [5], [\$500], [],
    [Failure to stop at weight station], [5], [\$500], [],
    [Lane Restriction violation], [3], [\$300], [],
    [Unlawfully parking and/or leaving vehicle in roadway], [1], [\$100], [],
    [Parking where prohibited or restricted], [1], [\$100], [],
    
    // DRUGS/ALCOHOL section
    table.cell(colspan: 4, fill: luma(230))[
      #text(size: 9pt, weight: "bold")[DRUGS/ALCOHOL VIOLATIONS]
    ],
    
    [Driving under influence of drugs/alcohol/medicine], [40], [\$4000, Termination], [],
    [Consuming intoxicating beverage within 4 hours before operating], [20], [\$2000, Termination], [],
    [Possession of intoxicating beverage while on duty/driving], [20], [\$2000, Termination], [],
    
    // DRIVING FITNESS section
    table.cell(colspan: 4, fill: luma(230))[
      #text(size: 9pt, weight: "bold")[DRIVING FITNESS VIOLATIONS]
    ],
    
    [Unauthorized passenger/Independent Contractor on board CMV], [30], [\$3000, Termination], [],
    [Operating CMV without a CDL], [8], [\$800], [],
    [Driving CMV while CDL is suspended], [8], [\$800], [],
    [Operating CMV without proper endorsements], [8], [\$800], [],
    [Cannot understand highway signs/signals in English], [5], [\$500], [],
    [Cannot read/speak English sufficiently for official inquiries], [4], [Warning], [],
    [Operating CMV without required CAB documents/permits], [3], [\$300], [],
    [Failing to carry valid medical examiner's certificate], [1], [\$100], [],
    
    // VEHICLE MAINTENANCE section
    table.cell(colspan: 4, fill: luma(230))[
      #text(size: 9pt, weight: "bold")[VEHICLE MAINTENANCE VIOLATIONS]
    ],
    
    [Unauthorized cargo load], [30], [\$3000, Termination], [],
    [Flat tire or fabric exposed], [8], [\$800], [],
    [Tire-ply or belt material exposed], [8], [\$800], [],
    [Tire-flat and/or audible air leak], [8], [\$800], [],
    [Tire-front tread depth less than 2/32 inch], [8], [\$800], [],
    [Axle positioning parts defective/missing], [7], [\$700], [],
    [Air suspension pressure loss], [7], [\$700], [],
    [Steering system components worn/welded/missing], [6], [\$600], [],
    [Inoperable head lamps], [6], [\$600], [],
    [Inoperable tail lamp], [6], [\$600], [],
    [Inoperative turn signal], [6], [\$600], [],
    [Operating CMV without proper load securement], [5], [\$500], [],
    [BRAKES OUT OF SERVICE (20%+ defective)], [5], [\$500], [],
  )
  
  // Page 53 - continuation
  pagebreak()
  
  table(
    columns: (3fr, 0.7fr, 1fr, 1fr),
    stroke: 0.5pt,
    inset: 6pt,
    align: (left, center, center, center),
    
    table.header(
      text(size: 9pt, weight: "bold")[VIOLATION TYPE],
      text(size: 9pt, weight: "bold")[HOW BAD?],
      text(size: 9pt, weight: "bold")[1ST TIME],
      text(size: 9pt, weight: "bold")[2ND TIME],
    ),
    
    [Operating CMV without proof of periodic inspection], [4], [\$400], [],
    [Brake hose/tubing chafing and/or kinking], [4], [\$400], [],
    [Brake connections with leaks or constrictions], [4], [\$400], [],
    [Brake Tubing/Hose Adequacy - Connections to Power Unit], [4], [\$400], [],
    [Inadequate brakes for safe stopping], [4], [\$400], [],
    [Clamp/Roto type brake out-of-adjustment], [4], [\$400], [],
    [Inoperative/defective brakes], [4], [\$400], [],
    [Defective brake limiting device], [4], [\$400], [],
    [CMV automatic airbrake adjustment fails to compensate], [4], [\$400], [],
    [No/Defective ABS Malfunction Indicator], [4], [\$400], [],
    [Brakes (general)], [4], [\$400], [],
    [Brake system pressure loss], [4], [\$400], [],
    [No/defective lighting devices or reflective material], [3], [\$300], [],
    [Mud flaps retroreflective sheeting requirements], [3], [\$300], [],
    [Requirements for reflectors], [3], [\$300], [],
    [Tire underinflated], [3], [\$300], [],
    [Oil and/or grease leak], [3], [\$300], [],
    [No/discharged/unsecured fire extinguisher], [2], [\$200], [],
    [Inoperable Required Lamp], [2], [\$200], [],
    [No/insufficient warning devices], [2], [\$200], [],
    [Inspection/repair/maintenance of parts & accessories], [2], [\$200], [],
    [Hubs - oil/grease leaking], [2], [\$200], [],
    [Wheel seal leaking], [2], [\$200], [],
    [Wheel (Mud) Flaps missing or defective], [1], [\$100], [],
    [Damaged or discolored windshield], [1], [\$100], [],
    [Windshield - Obstructed], [1], [\$100], [],
    [Windshield wipers inoperative/defective], [1], [\$100], [],
    
    // MISCELLANEOUS section
    table.cell(colspan: 4, fill: luma(230))[
      #text(size: 9pt, weight: "bold")[MISCELLANEOUS VIOLATIONS]
    ],
    
    [Hit and Run accident - property damage], [30], [\$3000, Termination], [],
    [Use of radar detector/laser jammers while operating CMV], [20], [\$2000, Termination], [],
    [Failure to submit DOT inspections], [5], [\$500], [],
    [Amazon Relay truckload rejection], [5], [\$500], [],
    [Not following Amazon 8 Yard Rules], [5], [\$500], [],
    [Disrespectful behaviour towards company employee], [5], [\$500], [],
    [Not following any company rules], [5], [\$500], [],
    [Late delivery/failing load count/dispatcher disobedience], [3], [\$300], [],
    [Any OUT OF SERVICE violation], [3], [\$300], [],
    [Contractors involved in fighting during duty], [3], [\$300], [],
    [Legal weight violation], [], [IC pays all charges], [],
    [Toll violation], [], [IC pays all charges], [],
  )
  
  v(1em)
  
  text(size: 9pt)[
    This is to certify that I have read, understood and agree to be charged according to this Schedule A for any and every USDOT, State, parking, toll, weight or company penalty.
  ]
  
  v(1.5em)
  
  [Independent Contractor Name #underlined(driver-name(data), width: 3in)]
  
  v(1em)
  
  grid(
    columns: (2fr, 1fr),
    gutter: 1em,
    [Independent Contractor Signature#underlined("", width: 2.5in)],
    [Date#underlined("", width: 1.2in)]
  )
  
  v(1em)
  
  grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [Safety Department#underlined("", width: 2in)],
    [Date#underlined("", width: 1.2in)]
  )
}
