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

Imported everywhere as **`#manifest`** (a Node subpath import), so no file path
leaks into the code and it resolves the same in build, runtime, tests, and at a
consumer.

## The manifest is the platform's config definition — not env

The manifest becomes `app_versions.definition`; the Cockpit renders a **Studio**
form from it, and the chosen values flow through `project_apps.config` →
`laioutrrc.json → apps[].config` → the app. **That project config is the source of
a value.** The manifest therefore holds no environment-variable names.

The environment is only an **app-side fallback**, for a host that has no Studio
value yet (e.g. Vercel today). Its variable name is **derived by convention** in
the handler — `B2BSELLERS_` + the field key in UPPER_SNAKE_CASE (`endpoint` →
`B2BSELLERS_ENDPOINT`, `accessToken` → `B2BSELLERS_ACCESS_TOKEN`) — never declared
in the manifest.

## Cascading shape

```
studioConfig            ← scope: where it is configured (the Studio)
  └─ b2b                ← block (the app / feature)
      └─ connection     ← section (label: "Shop connection")
          └─ fields     ← endpoint, accessToken
```

The handler **collects `fields` from anywhere in the tree**, so new scopes, blocks
or sections need no code change.

## A field

```json
"endpoint": {
  "type": "url",              // text | url | secret  → a Cockpit field renderer
  "label": "Shop endpoint",
  "description": "…",
  "required": true,
  "constraints": { "notEndsWith": "/store-api" }   // rules are DATA, not code
}
```

`secret: true` marks a write-only, encrypted, never-echoed value. No `env` key —
the fallback variable is derived (see above).

## Identity is not here — it is in package.json

`name`, `version`, `peerDependencies` are read by the platform from
**`package.json`**. The manifest holds config only.

## Value flow + precedence

```
Studio form (future) → project_apps.config → laioutrrc.apps[].config (rc fetch)
  → runtimeConfig['@laioutr/app-b2bsellers']  (server-only)  → useB2bSellersClient()
```
```
project config (laioutrrc)        ← wins field-by-field
  ↓ else
process.env[ B2BSELLERS_<FIELD> ] ← derived fallback var, on a host without the Studio value
  ↓ else
empty → validation throws a readable error (fail fast, not an opaque 401)
```

The env var **never lands in `laioutrrc.json`** — it is read directly by the server
at runtime, in parallel to the project config.

## Two validations

- **`validateManifest()`** — a minimal structural self-check (valid `type`, a
  `label`, a compilable `pattern`, no duplicate field key). Runs in `config.test.ts`
  (on push) **and** in module setup, so a malformed manifest fails at build/release.
- **`validateConfig()`** — validates the resolved *values* at runtime.

## Adding a field

Edit **`manifest.json` only** — add the field under any section with its `type`,
`label`, `description`, `required`, and any `constraints`. Env resolution (via the
derived var), validation, the module defaults and the published `definition` all
follow. Cover it in `config.test.ts`. (Wiring a *new* field into the client is the
only code touch — inherent, since a value has to be consumed somewhere.)

## Delivering config on live

1. Set the derived env vars in the host (Vercel) — `B2BSELLERS_ENDPOINT` (without
   `/store-api`) and `B2BSELLERS_ACCESS_TOKEN` (secret).
2. Run `laioutr app release` so the manifest lands in `app_versions.definition`.

## Direction (platform, LAIOUTR-94)

Lift `config.ts` into `@laioutr-core/kit` as a shared `defineAppConfig(manifest)`
so every plugin uses one implementation: a per-plugin declarative manifest, zero
per-field logic, one place to change.
