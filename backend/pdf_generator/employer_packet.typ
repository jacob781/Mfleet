// =============================================================================
// EMPLOYER PACKET — standalone 2-page verification for ONE prior employer.
// Rendered per employer to email to that employer (part1 form + part2 signed release).
// Inputs: payload (the same JSON as main.typ) + employer_index.
// =============================================================================

#import "styles.typ": *

#let raw_payload = sys.inputs.at("payload", default: "{}")
#let data = json(bytes(raw_payload))
#let idx = int(sys.inputs.at("employer_index", default: "0"))

#set page(paper: "us-letter", margin: page-margin)
#set text(font: main-font, size: body-size)

#import "pages/p06_07_employer_verification.typ": employer-verification-part1, employer-verification-part2
#import "pages/p07b_records_request.typ": page-records-request

#let emp = data.employment_history.at(idx)
#employer-verification-part1(data, emp, idx)
#employer-verification-part2(data)
#page-records-request(data)
