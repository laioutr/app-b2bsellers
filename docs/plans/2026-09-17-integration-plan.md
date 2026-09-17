# Integration plan — getting this connector behind the Boltze sales app

Stand 2026-09-17. Companion to
`~/PhpstormProjects/app-boltze/docs/plans/2026-09-17-b2bsellers-integration-plan.md`, which holds the
overall scope, the Cockpit state and the phase order. This file covers only what happens **in this
repository**.

`PLAN.md` at the root is the original design for the wrapper layer and still describes it correctly.
`docs/plans/` is new here, mirroring the layout of `app-boltze` since the two are worked on together.

Target: the Hamburg appointment on **2026-10-05**.

## Where this stands — 2026-09-17, end of session

Branch `feat/LAIOUTR-119-store-api-verification`, four commits on top of PR #3's head (`a0838d2`),
**not pushed**. Working tree clean. `pnpm lint` and `pnpm test` pass; `vue-tsc` reports four errors
that are byte-identical to the base branch and are not run by CI at all.

```
f911a4e  chore: configure the jira MCP server for this repository
046dcbc  docs: record the Store-API verification against the live demo shop
bb2b04c  fix(store-api): correct the operations map against the live shop and add a session
bb1b203  chore(scripts): add an OpenAPI verification script for the operations map
```

Done:

- Phase 2 is finished. The map was verified against the live demo shop and corrected: 24 → 74 `OK`,
  zero `PATH_MISSING`, zero `WRONG_METHOD`. Evidence and the residue in
  `docs/reviews/2026-09-17-store-api-verification.md`.
- The authentication gap is closed: `login` / `logout` / `getContext` / `getCurrentCustomer` exist,
  and the client persists the rotated `sw-context-token` through the SDK's `onContextChanged` hook.
- `laioutrrc.json` holds the demo shop's endpoint and access key in the same shape Cockpit generates
  for Vercel. Gitignored, so it survives nothing but the local disk — refetch or re-enter it if the
  checkout moves.

Next, in order:

1. **Push the branch.** This updates PR #3, which Marcel is reading, so its description needs
   rewriting first: what was verified against the live shop, what was not, and the three questions
   below.
2. **Create the two Jira issues under `LAIOUTR-119`** and close them against `bb2b04c` — the
   operations-map correction and the authentication work. The `jira` MCP server is configured but
   only loads at session start, so this needs a restarted session.
3. **Ask Marcel and the CTO** the three questions at the end of the verification report. They are
   sentences, not tickets: the plugin version the demo will run, the provenance of the eight
   non-existent operations, and the package namespace.
4. **Then phase 3 in `app-boltze`** — the connector can now authenticate and reach real data, which
   is what blocked it.

Loose end, deliberately untouched: section F of `REQUIREMENTS-ORCHESTR.md` still says "92 invoke
wrappers" and that there is no Orchestr layer. The first is now wrong (90, plus auth); the second is
still true.

## What this repository is, and who consumes it

A pure backend/data integration wrapping the B2B Sellers Store API (a Shopware 6 plugin). No
sections, no blocks, no UI. Two route prefixes, both behind storefront auth (`sw-access-key` +
`sw-context-token`): `/store-api/...` for the plugin's core endpoints and `/b2b/...` for the addon
endpoints (cost centers, budgets, order approval).

Its consumer is `app-boltze`, the customer app that holds the sales-app sections. Those sections
currently render from an in-memory mock; this connector is what replaces the mock with the real
shop. The direction is one-way and must stay that way: `app-boltze` → `app-b2bsellers`. Nothing here
ever imports from, or knows about, the customer app.

## Verified state, 2026-09-17

- `main` carries only the CI bootstrap. The work is on `origin/feat/b2bsellers-api-wrapper` — PR #3,
  40 files, +1836/−2364.
- `src/runtime/server/client/operations.ts` is the authoritative surface: **92 typed operations**,
  63 under `/store-api/`, 29 under `/b2b/`. The `queries/*.ts` functions are thin wrappers over
  `client.invoke('<op> <method> <path>', …)`, where that string is also the operations-map key.
- `defineB2bSellers` (`src/runtime/server/middleware/`) builds a request-scoped client and exposes it
  as `context.client`. `useB2bSellersClient` reads `endpoint` and `accessToken` from
  `runtimeConfig[APP_CONFIG_KEY]`, which frontend-core fills from the project's `laioutrrc.json`.
- PR #3 contains **no Orchestr handler and no token implementation** — deliberately, and
  `REQUIREMENTS-ORCHESTR.md` says so in its own opening. It is the HTTP layer the handler layer sits
  on, plus a gap list for core.
- The wrappers were written **without a live instance**. Paths, methods and status codes are
  best-effort, and the file says so.

### One premise in `REQUIREMENTS-ORCHESTR.md` has gone stale

It was written when the B2B canonical layer did not exist. Checked in
`packages/canonical-types/src` on 2026-09-17, it now does:

- entities — `Quote`, `QuoteItem`, `Organization`, `Employee`, `Budget`, `ApprovalFlow`,
  `ApprovalRule`
- a large `lib/b2b/` token set — `quote/{request,accept,decline,cancel,request-change,
  get-checkout-url,items}`, organization employees / budgets / cost centers / addresses / roles /
  product numbers, approval flows

What is genuinely still missing: **there is no `.query.ts` anywhere under `lib/b2b/`.** Core has the
B2B actions and links but no B2B query tokens. That matters for a future native integration; it does
**not** block the Boltze demo, because `app-boltze` defines its own app-local query tokens
(`boltze/quote/list` and friends).

So the file needs its premise corrected rather than deleting the document — the gap list is still
the useful part, the "these types do not exist" framing is not.

## How `app-boltze` will depend on this — the exact shape

Yes, a dependency, but an **optional peer**, not a regular one. `app-boltze` already declares
`@laioutr/app-shopware` and `@laioutr-app/pwa` exactly this way, and its own CLAUDE.md states the
rule: platform packages go in `peerDependencies` so the host project supplies one copy.

Mirror that verbatim in `app-boltze/package.json`:

```jsonc
"devDependencies":      { "@laioutr/app-b2bsellers": "^<version>" },   // playground + typecheck
"peerDependencies":     { "@laioutr/app-b2bsellers": ">=<version>" },  // the project supplies it
"peerDependenciesMeta": { "@laioutr/app-b2bsellers": { "optional": true } }
```

Optional because the playground's demo project runs with no commerce connector at all — the mock
answers every query — and a required peer would break that.

**Declaring the package is not sufficient.** `useB2bSellersClient` reads
`runtimeConfig[APP_CONFIG_KEY]`, and frontend-core only populates that from an `apps[]` entry in the
project's `laioutrrc.json`. So this module must be **installed as a Laioutr App in the project**, not
merely resolvable in `node_modules`. Package resolution gives the types; the rc entry gives the
endpoint and the access key.

## Work in this repository

### 1. Verify the 92 operations against the shop

`scripts/verify-openapi.mjs`, on branch `feat/openapi-verification`. Parses every entry of
`operations.ts` — path, method, expected status (`Ok<T>` → 200, `NoContent` → 204), declared
body/query, path parameters — fetches `GET /store-api/_info/openapi3.json` and reports `OK` /
`MISMATCH` / `WRONG_METHOD` / `PATH_MISSING` per operation, plus spec paths the map does not cover.

```bash
export PATH=/Users/rtsehynka/.nvm/versions/node/v22.22.3/bin:$PATH
node scripts/verify-openapi.mjs --shop=<endpoint> --key=<accessToken> --save=openapi3.json
node scripts/verify-openapi.mjs --spec=openapi3.json --fields   # offline re-runs, response fields
```

Exit 0 clean, 1 mismatches, 2 could not run. `--json` gives a machine-readable report; `--all` lists
uncovered spec paths.

Two behaviours already handled: Shopware serves the document with `/store-api` in `servers[].url`
and relative paths, so both layouts are indexed; and path parameters match **by position, not name**,
so a spec that says `{offerId}` where the map says `{id}` is reported as a finding rather than a miss.

Expect the 29 `/b2b/` operations to come back `PATH_MISSING` — the store-api document probably does
not describe the addon namespace. That is missing coverage, not a defect in the map. They need a
second document or live probing under a B2B login; decide which after seeing the first run.

The credentials come from the project rc, fetched on the `app-boltze` side — see that repository's
phase 1.

### 2. Settle the package name before the first publish

`package.json` carries `"name": "@laioutr/app-b2bsellers"` with `publishConfig.access: "public"` and
`provenance: true`, so a release goes to **public npmjs.org**. Per the namespace convention
`@laioutr/*` is the public namespace requiring CTO approval, while `@laioutr-app/*` and
`@laioutr-org/*` live on `npm.laioutr.cloud`. `app-boltze`, for comparison, publishes to the private
registry.

For a connector to a paid vendor plugin this reads as a bootstrap leftover rather than a decision.
Renaming after the first publish is awkward, so it is worth resolving while the cost is zero.

### 3. Merge PR #3

Only after step 1, and the PR description should state plainly what was verified against the live
shop and what was not. Merging 92 unverified guesses weeks before a customer demo is the failure
mode to avoid. Correct the stale premise in `REQUIREMENTS-ORCHESTR.md` in the same pass.

### 4. Publish a version

`app-boltze` cannot resolve `useB2bSellersClient` until this ships. Until then, link this repository
into the workspace for local development — and remove the link before releasing `app-boltze`.

Changesets: the published package is `dist` only, so a dev script or a doc needs no changeset. The
wrapper layer itself does.

## Scope — what does not belong here

**Do not implement the Boltze handlers in this repository.** Their tokens are Boltze-namespaced
(`boltze/quote/list`), they encode one customer's sales workflow, and a generic vendor connector has
no business carrying either. Those handlers stay in `app-boltze`; this repository's job ends at a
typed, verified HTTP surface plus the middleware that hands a client to whoever asks.

The token-bound handler layer this repository may eventually grow is the **canonical** one — core's
`lib/b2b/*` tokens against this client. That is a separate piece of work, not required for the
October 5 demo, and not to be conflated with unblocking it.

## Boundary

Work stays inside this repository and `app-boltze`. The B2B query tokens missing from core, the
Growth Kit merge, and the composition of the `boltze-com` shop project are all real and all owned
elsewhere; they are recorded here only so nobody rediscovers them as surprises.
