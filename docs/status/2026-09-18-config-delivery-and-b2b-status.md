# B2B Sellers integration — config delivery + status (2026-09-18)

Main task: **LAIOUTR-119** (B2B Sellers for Shopware / Boltze). This records (a) the
best way to deliver the connection parameters on live, and (b) what is done vs. not.

## Part A — how to deliver `endpoint` + `accessToken` (the best variant)

The app reads its connection from the server-only runtime config
`runtimeConfig['@laioutr/app-b2bsellers'].{ endpoint, accessToken }`
(`useB2bSellersClient.ts`). The open question is where those two values come from
in production. Three options, weighed:

| Option | How | Verdict |
|---|---|---|
| **1. Platform config + `rc fetch`** (canonical) | Values set under `@laioutr/app-b2bsellers` in the `sales-app` project (`project_apps.config`); live build runs `laioutr rc fetch` → `laioutrrc.json.apps[].config` → app reads it. | Correct long-term, but **blocked for us now**: the Cockpit Apps panel is read-only on the preview plan, so only someone with full access (Sebastian) can set it today. |
| **2. Env-var fallback in the module** (our code) | `module.ts` defaults read `process.env.B2BSELLERS_ENDPOINT` / `B2BSELLERS_ACCESS_TOKEN` when the injected config is empty. On Vercel, set those two env vars. | **Recommended now.** Fully in our control, works on live without the preview plan or Sebastian, keeps the secret in Vercel's encrypted env (never in the repo or `laioutrrc.json`). Standard 12-factor. |
| **3. Hand-filled local `laioutrrc.json`** | The gitignored file, filled by hand. | **Dev only.** Not a production answer — brittle, and a secret in a file is the thing we want to avoid. |

### Recommendation — layered, with a clear precedence

Make the module resolve config in this order, so both worlds coexist:

```
platform-injected config (laioutrrc.apps[].config)   ← wins when present (Option 1)
    ↓ else
process.env.B2BSELLERS_ENDPOINT / _ACCESS_TOKEN       ← fills the gap on live (Option 2)
    ↓ else
empty → fail fast with a clear boot error
```

Concretely, set the module `defaults` from env:

```ts
defaults: {
  endpoint: process.env.B2BSELLERS_ENDPOINT ?? '',
  accessToken: process.env.B2BSELLERS_ACCESS_TOKEN ?? '',
}
```

`endpoint` must be the shop **origin without** `/store-api`. Why this is best:
it unblocks live immediately, is in our control, keeps the secret out of the repo,
and is forward-compatible — the day Sebastian sets the platform config (Option 1),
that value takes precedence and the env vars become an unused fallback. Wire this
into **DEV-526** alongside the config schema + boot validation.

## Part B — status against LAIOUTR-119

### Done (in our code, verified)

- **Connector `app-b2bsellers`** verified against the live B2B-Sellers plugin
  (operations map corrected, session lifecycle, Store-API verification doc).
- **`app-boltze` wired to the connector** as an optional peer dep; the secret is
  server-only (architecture-boundary test + live bundle scan).
- **Login via Shopware credentials**, with a platform-access gate (non-B2B
  accounts refused), real shop error messages, logout-first.
- **All mocks removed** — every orchestr handler (60) reads/writes through the
  adapter when connected; fixtures only as an offline fallback. Suite green (133).
- **Live reads:** orders (rep-scoped, isolation fixed), customers, activity,
  catalogue (273 products), Merklisten, product variants + real stock.
- **Writes pass through** to the real shop routes (product lists; offers) — the
  shop's own permission/enablement decides, no mock mutation.
- **Money ×100, id namespacing, per-request caching, Playwright e2e** (per account,
  isolation), theme/token layer + client-only grid pager.
- **Tracking:** idea on LAIOUTR-94 (app-config vision); plugin task **DEV-526**
  linked into its Deliver panel.

### Not done / blocked (mostly shop- or platform-side, not our code)

- **Config delivery on live** — endpoint+token not yet wired for production. See
  Part A; recommended fix is the env-var fallback (DEV-526).
- **DEV-526 code** — config schema (zod) + boot validation + env fallback: not yet
  implemented.
- **Offers / Angebote** — the offer module is disabled on the demo channel (routes
  403), so those screens are empty until it is enabled in Shopware.
- **Events** — the installed plugin version exposes no event-products route →
  empty; needs a plugin/version with that module.
- **Product-list writes** — require employee permission; some accounts get 403
  (shop permission config, not a bug).
- **Customer-specific prices / R·L badges** — not wired; the connected
  customer-price resolver returns a minimal honest payload. Needs the shop's
  customer-prices route wired, or a decision to drop the feature.
- **Reps list / user sessions** — the Store API exposes only the signed-in rep and
  no sessions; screens show honest "not available over Store API" messages.
- **Auto-config fields in Cockpit** — platform work on LAIOUTR-94; DEV-526 is our
  plugin half.

### Net

The app is a working, mock-free view over the live B2B-Sellers shop; what remains
is (1) delivering the connection config to production (Part A / DEV-526) and
(2) shop-side enablement (offers, events, permissions, customer prices) — none of
which is app code.
