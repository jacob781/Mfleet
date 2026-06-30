// =============================================================================
// PAGES 54-55: DASH CAMERA POLICY FOR INDEPENDENT CONTRACTORS
// =============================================================================

#import "../styles.typ": *

#let page-dash-camera-policy(data) = {
  pagebreak()
  
  v(2em)
  
  align(center)[
    #text(size: 20pt, weight: "bold")[Dash Camera Policy for Independent Contractors]
  ]
  
  v(2em)
  
  text(size: 10pt)[
    The purpose of this Dash Camera Policy is to ensure the safety of our Independent Contractors, customers, and the public by maintaining a continuous recording of driving activities. This policy outlines the requirements for independent contractors regarding the use of dash cameras while performing services for #company-name(data).
  ]
  
  v(1em)
  
  text(size: 11pt, weight: "bold")[Scope]
  
  v(0.5em)
  
  text(size: 10pt)[
    This policy applies to all independent contractors driving for #company-name(data).
  ]
  
  v(1em)
  
  text(size: 11pt, weight: "bold")[Policy Statement]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[1. Dash Camera Requirement]
  
  v(0.3em)
  
  text(size: 10pt)[
    - All independent contractors are required to install and maintain a functioning dash camera in their vehicles.
  ]
  
  v(0.3em)
  
  text(size: 10pt)[
    - The dash camera must be capable of recording both forward-facing and Independent Contractor-facing views.
  ]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[2. Recording and Storage]
  
  v(0.3em)
  
  text(size: 10pt)[
    - The dash camera must be operational and recording at all times during active drive time.
  ]
  
  v(0.3em)
  
  text(size: 10pt)[
    - Recorded footage must be stored securely and retained for a minimum of 30 days.
  ]
  
  v(0.3em)
  
  text(size: 10pt)[
    - Contractors must ensure that the dash camera is properly maintained, and any malfunctions are promptly addressed.
  ]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[3. Privacy and Confidentiality]
  
  v(0.3em)
  
  text(size: 10pt)[
    - Recorded footage will be used strictly for safety, security, and compliance purposes.
  ]
  
  v(0.3em)
  
  text(size: 10pt)[
    - #company-name(data) will handle all recorded footage in accordance with privacy laws and regulations.
  ]
  
  v(0.3em)
  
  text(size: 10pt)[
    - Contractors must not share or distribute recorded footage without prior authorization from #company-name(data).
  ]
  
  // Page 55 (continued)
  pagebreak()
  
  text(size: 10pt, weight: "bold")[4. Compliance and Enforcement]
  
  v(0.3em)
  
  text(size: 10pt)[
    - Contractors must comply with all local, state, and federal laws regarding the use of dash cameras.
  ]
  
  v(0.3em)
  
  text(size: 10pt)[
    - Failure to comply with this policy may result in disciplinary action, up to and including termination of the contractor's agreement with #company-name(data).
  ]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[5. Installation and Maintenance]
  
  v(0.3em)
  
  text(size: 10pt)[
    - Contractors are responsible for the installation, maintenance, and repair of dash cameras.
  ]
  
  v(0.3em)
  
  text(size: 10pt)[
    - #company-name(data) may provide recommendations for approved dash camera models and installation services.
  ]
  
  v(0.5em)
  
  text(size: 10pt, weight: "bold")[6. Incident Reporting]
  
  v(0.3em)
  
  text(size: 10pt)[
    - In the event of an accident or incident, contractors must report the incident to #company-name(data) immediately and provide access to the recorded footage.
  ]
  
  v(1em)
  
  text(size: 11pt, weight: "bold")[Acknowledgment]
  
  v(0.5em)
  
  text(size: 10pt)[
    By signing below, the independent contractor acknowledges that they have read, understood, and agree to comply with the Dash Camera Policy as outlined above.
  ]
  
  v(2em)
  
  [Independent Contractor Name: #underlined(driver-name(data), width: 4in)]
  
  v(1.5em)
  
  [Signature: #driver-signature(data, width: 3in)]
  
  v(1.5em)
  
  [Date: #underlined(fill-date(data), width: 2in)]
}
