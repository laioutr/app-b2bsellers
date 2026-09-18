---
'@laioutr/app-b2bsellers': patch
---

Mark the four overtaken claims in the Core gap list.

`REQUIREMENTS-ORCHESTR.md` said the canonical layer has no B2B entities or tokens
and that the integration had to wait for the core. Neither holds: `Quote`,
`Organization`, `Employee`, `CostCenter`, `Budget` and the `b2b/*` token domains
exist, the real gap is the missing quote *queries*, and the integration already
runs against a live shop. The verification section is closed too — the map is
checked against the shop's own OpenAPI document by script.

The original wording stays, marked as overtaken: the wrong reading cost two days
and the reasoning is worth keeping.
