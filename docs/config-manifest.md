# App config manifest — how it works

This app describes its configuration **declaratively**, in one JSON manifest, and a
**generic handler** turns that manifest into defaults, environment resolution and
validation with no per-field code. The single reason to change config is to edit
the manifest.

## The files

```
manifest.json                    ← DECLARATIVE data, at the package root (next to laioutrrc.json).
                                   The only file you edit to add/change config.
src/runtime/server/config.ts     ← GENERIC handler. Carries no field names; rarely touched.
package.json  "imports"          ← "#manifest": "./manifest.json" — how everything imports it.
```

The manifest is imported everywhere as **`#manifest`** (a Node subpath import), so
no file path leaks into the code and it resolves the same in the build, the
runtime, the tests, and at a consumer.

## Cascading shape

The manifest is a **tree grouped by scope**, not a flat field list — so it stays
clear what each part is responsible for and there is room to grow:

```
studioConfig            ← scope: where it is configured (the Studio)
  └─ b2b                ← block (the app / feature)
      └─ connection     ← section (label: "Shop connection")
          └─ fields     ← endpoint, accessToken
```

The handler **collects `fields` from anywhere in the tree**, so new scopes, blocks
or sections need no code change. Add a field type by extending the handler; add a
*field* by editing only the manifest.

## A field

```json
"endpoint": {
  "type": "url",              // text | url | secret  → a Cockpit field renderer
  "label": "Shop endpoint",
  "description": "…",
  "required": true,
  "env": "B2BSELLERS_ENDPOINT",          // env-var fallback (see precedence)
  "constraints": { "notEndsWith": "/store-api" }   // rules are DATA, not code
}
```

`secret: true` marks a write-only, encrypted, never-echoed value.

## Identity is not here — it is in package.json

`name`, `version`, `peerDependencies` (which plugin, which version, compatibility)
are read by the platform from **`package.json`**. The manifest holds config only,
so there is no second source of truth.

## The platform contract

`laioutr app release` imports **`configSchema`** from `src/module.ts` (via jiti) —
`configSchema` is just the manifest — and stores it as `app_versions.definition`.
The Cockpit then renders a Studio form from it (LAIOUTR-94); the chosen values
become `project_apps.config` → `laioutrrc.json → apps[].config`.

> The exact field-definition shape the Cockpit renders is **provisional**
> (LAIOUTR-94 / PR #610). This app is the first to publish one; the `secret` type
> in particular needs a Cockpit renderer + encrypted storage.

## Value flow + precedence

```
Studio form (future) → project_apps.config → laioutrrc.apps[].config (rc fetch)
  → runtimeConfig['@laioutr/app-b2bsellers']  (server-only)  → useB2bSellersClient()
```
```
project config (laioutrrc)   ← wins field-by-field
  ↓ else
process.env.<field.env>       ← e.g. B2BSELLERS_ENDPOINT / _ACCESS_TOKEN on Vercel
  ↓ else
empty → validation throws a readable error (fail fast, not an opaque 401)
```

## Two validations

- **`validateManifest()`** — a minimal structural self-check (every field has a
  valid `type`, a `label`, a unique `env`, a compilable `pattern`). Runs in
  `config.test.ts` (on push) **and** in the module setup, so a malformed manifest
  fails at build/release, not at a customer's first request.
- **`validateConfig()`** — validates the resolved *values* at runtime against the
  manifest's rules.

## Adding a field

Edit **`manifest.json` only** — add the field under any section with its `type`,
`label`, `description`, `required`, `env`, and any `constraints`. Env resolution,
validation, the module defaults and the published `definition` all follow. Cover
it in `config.test.ts`. (Wiring a *new* field into the client is the only code
touch — inherent, since a value has to be consumed somewhere.)

## Delivering config on live

1. Set the fields' env vars in the host (Vercel) — endpoint **without** `/store-api`.
2. Run `laioutr app release` so the manifest lands in `app_versions.definition`.

## Direction (platform, LAIOUTR-94)

Lift `config.ts` into `@laioutr-core/kit` as a shared `defineAppConfig(manifest)`
so every plugin uses one implementation: a per-plugin declarative manifest, zero
per-field logic, one place to change. `config.ts` is written to make that
extraction a move, not a rewrite.
