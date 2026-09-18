# App config manifest — how it works

This app declares its configuration **once**, as a machine-readable manifest, and
every consumer reads that same source: the Laioutr platform (to render a settings
form), the module (its defaults), the request-time client (validation), and the
release CLI (what it publishes). No field is described in two places.

## The contract

`laioutr app release` imports **`configSchema`** from an app's `src/module.ts`
(via jiti) and stores it as the published version's **`app_versions.definition`**.
The Cockpit then renders a settings form from that definition (LAIOUTR-94), and
the chosen values end up in `project_apps.config` → `laioutrrc.json → apps[].config`.

So the only hard requirement is: **`src/module.ts` must export `configSchema`.**

## Where it lives here

Single source of truth: **`src/runtime/server/config.ts`**. It lives under
`runtime/` so the request-time client can import the validation without pulling in
build-time code. `src/module.ts` re-exports `configSchema` from it.

```
src/runtime/server/config.ts   ← configSchema + resolveConfigFromEnv + validateB2bSellersConfig
src/module.ts                  ← export { configSchema }; defaults: resolveConfigFromEnv()
src/runtime/server/client/useB2bSellersClient.ts  ← validates once at request time
```

## The manifest shape (provisional)

```ts
export const configSchema = {
  fields: {
    endpoint:    { type: 'url',    label, description, required: true, env: 'B2BSELLERS_ENDPOINT' },
    accessToken: { type: 'secret', label, description, required: true, env: 'B2BSELLERS_ACCESS_TOKEN', secret: true },
  },
}
```

- `type` maps onto a Cockpit field renderer (`text` | `url` | `secret`; extend as needed).
- `secret: true` → write-only input, stored encrypted, never echoed back.
- `env` → the environment variable that fills the field when the platform config is absent.

> The exact shape the Cockpit renders is **not yet fixed** (LAIOUTR-94 / PR #610).
> This app is the first to publish a `configSchema`, so treat the shape as
> provisional and align it with the platform's field renderers — especially the
> `secret` type, which may still need a renderer.

## How a value reaches the running app

```
Cockpit form (from app_versions.definition)      ← future, LAIOUTR-94
  → project_apps.config
  → laioutrrc.json apps['@laioutr/app-b2bsellers'].config   ← via `laioutr rc fetch`
  → runtimeConfig['@laioutr/app-b2bsellers']  (server-only; never in the client bundle)
  → useB2bSellersClient()
```

**Precedence at runtime** (in `useB2bSellersClient`):

```
project config (laioutrrc.apps[].config)   ← wins when present
  ↓ else
process.env.B2BSELLERS_ENDPOINT / _ACCESS_TOKEN   ← fills the gap on a host that only has env vars (e.g. Vercel)
  ↓ else
empty → validation throws a readable error (fail fast, not an opaque 401)
```

`endpoint` must be the shop **origin without** `/store-api` — the client appends
`/store-api/…` and `/b2b/…` itself. Validation rejects a stray suffix.

## Adding or changing a field

Edit **one** place — `configSchema.fields` in `src/runtime/server/config.ts`:
add the field (type, label, description, required, env, and `secret` if it is one).
`resolveConfigFromEnv()`, `validateB2bSellersConfig()`, the module defaults, and the
published manifest all follow automatically. Cover it in `config.test.ts`.

## Delivering config on live

1. Set `B2BSELLERS_ENDPOINT` and `B2BSELLERS_ACCESS_TOKEN` in the host (Vercel),
   endpoint without `/store-api`.
2. Run `laioutr app release` so the `configSchema` is stored in
   `app_versions.definition` (readies the Cockpit form once the platform renders it).
