---
'@laioutr/app-b2bsellers': patch
---

Name the two shop-verification scripts in `package.json` and explain them in the README.

`pnpm verify:openapi` compares the operations map with the shop's own OpenAPI document;
`pnpm verify:shop` calls the shop instead of reading its document, read-only. Both were
only reachable by typing the file path, so neither was obvious to anyone who had not
written them.

The README now also says what the check is for: a wrong entry in the map is invisible to
TypeScript, the linter and the unit tests, and surfaces at runtime as a 404 that reads
like a missing feature rather than a misspelled path.
