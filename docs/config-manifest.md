# App config manifest — how it works

This app describes its configuration **declaratively**, in one manifest, and a
**generic handler** turns that manifest into defaults, environment resolution and
validation with no per-field code. The single reason to change config behaviour
is to edit the manifest.

## Two files, one principle

```
src/runtime/server/manifest.ts   ← DECLARATIVE. The only file you edit to add/change a field.
src/runtime/server/config.ts     ← GENERIC handler. Carries no field names; rarely touched.
```

- **`manifest.ts`** — pure data: each field's `type`, `label`, `description`,
  `required`, `env`, `secret`, and declarative `constraints`. No logic.
- **`config.ts`** — reads *any* manifest and produces `resolveDefaults()`,
  `resolveConnectionConfig()` and `validateConfig()`. It knows the field *types*
  (`text | url | secret`) and *constraint kinds* (`notEndsWith`, `pattern`) — never
  the word "endpoint". It is written to be lifted into `@laioutr-core/kit` as a
  shared `defineAppConfig`, so every app can share one implementation.

Even app-specific validation is **data**, not code — e.g. "endpoint must not carry
`/store-api`" is expressed as `constraints: { notEndsWith: '/store-api' }` in the
manifest, applied by the generic handler.

## Identity is not here — it is in package.json

`name`, `version` and `peerDependencies` (which plugin, which version, what it is
compatible with) are read by the platform from **`package.json`**. Duplicating
them in the manifest would only create a second source of truth, so the manifest
holds config only.

## The platform contract

`laioutr app release` imports **`configSchema`** from `src/module.ts` (via jiti)
and stores it as the version's **`app_versions.definition`** — `configSchema` is
just the manifest, re-exported. The Cockpit then renders a settings form from it
(LAIOUTR-94), and the chosen values become `project_apps.config` →
`laioutrrc.json → apps[].config`.

```
manifest.ts ──(re-export)──> configSchema ──(app release)──> app_versions.definition ──> Cockpit form
```

> The exact field-definition shape the Cockpit renders is **not yet fixed**
> (LAIOUTR-94 / PR #610). This app is the first to publish a `configSchema`, so
> the shape is provisional — the `secret` type in particular needs a Cockpit
> renderer + encrypted storage.

## How a value reaches the running app

```
Cockpit form (future) → project_apps.config → laioutrrc.apps[].config (via rc fetch)
  → runtimeConfig['@laioutr/app-b2bsellers']  (server-only; never in the client bundle)
  → useB2bSellersClient()  → resolveConnectionConfig(injected)
```

**Precedence** (in the generic handler):

```
project config (laioutrrc.apps[].config)   ← wins field-by-field
  ↓ else
process.env.<field.env>                      ← e.g. B2BSELLERS_ENDPOINT / _ACCESS_TOKEN on Vercel
  ↓ else
empty → validation throws a readable error (fail fast, not an opaque 401)
```

## Adding or changing a field

Edit **`manifest.ts` only** — add the field with its `type`, `label`,
`description`, `required`, `env`, and any `constraints`. `resolveDefaults()`,
`resolveConnectionConfig()`, `validateConfig()`, the module defaults and the
published `definition` all pick it up automatically. Cover it in `config.test.ts`.
Using a *new* field (wiring it into the client) is the only thing that touches code
— which is inherent, since a value has to be consumed somewhere.

## Delivering config on live

1. Set the fields' env vars in the host (Vercel) — `B2BSELLERS_ENDPOINT` and
   `B2BSELLERS_ACCESS_TOKEN`; endpoint **without** `/store-api`.
2. Run `laioutr app release` so the manifest lands in `app_versions.definition`.

## Direction (platform, LAIOUTR-94)

Lift `config.ts` into `@laioutr-core/kit` as a shared `defineAppConfig(manifest)`
so every plugin uses one implementation: a per-plugin declarative manifest, zero
per-field logic, one place to change. This app's `config.ts` is written to make
that extraction a move, not a rewrite.
