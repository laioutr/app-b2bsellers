# B2B Sellers App for Laioutr

[![Laioutr][laioutr-src]][laioutr-href]
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A [Laioutr](https://laioutr.com) App for integrating **B2B Sellers** into the Laioutr platform.

It wraps the B2B Sellers Store API (a Shopware 6 plugin) as a typed operations map with thin query
wrappers and a request-scoped client. Backend only — no sections, no blocks. Its consumer is
`app-boltze`.

See [laioutr.com](https://laioutr.com) for more information about Laioutr.

## State of the integration — 2026-09-17

Verified against `https://laioutr.demoshop.b2b-sellers.com` (Shopware 6.7.6.2) with a live customer
session. Full evidence in [`docs/reviews/2026-09-17-store-api-verification.md`](docs/reviews/2026-09-17-store-api-verification.md).

**Reading works.** 90 operations, zero missing paths; 27 return real data with a session — 12
customers, 10 orders, 17 employees, 3 cost centers, 2611 activity records. The map was corrected
against the shop rather than against its OpenAPI document, which disagrees with it in a dozen places.

**Writing does not, and that is not a code problem.** Three independent routes into creating an offer
are each closed:

| | |
| --- | --- |
| `POST /offer` then `offer-add-products` | the offer is created, then `403 B2B_OFFER__UPDATE_DENIED` in **every** state, and `PUT /offer/{id}` is `405` — so it stays permanently empty |
| `POST /offer-request` (cart → offer) | `403 B2B_OFFER__PERMISSION_DENIED` for a B2B employee *and* for the B2B administrator. None of the 15 employee permissions the shop exposes concerns offers, so it is an admin-side setting |
| any of them | the `Headless` sales channel our access key belongs to sells **one** product; everything on the existing orders belongs to another channel and the cart refuses it with `product-not-found` |

**What unblocks it** — Shopware admin work on the demo shop, by whoever provisioned it: assign the
catalogue and its visibility to the `Headless` channel and enable the offer module for its B2B
customers, **or** hand over the access key of the channel that already carries the catalogue
(`ee0ad685d0504d5f80730d9b53f794c8`).

**Also worth knowing:** the shop rate-limits sign-ins hard (`429 CHECKOUT__CUSTOMER_AUTH_THROTTLED`)
after a handful of attempts. A few mistyped passwords on stage will lock an account out for minutes.

### Credentials

The demo shop publishes its own test accounts at `/Benutzeruebersicht/`. The sales app signs in as the
**Vertriebsmitarbeiter** `m.sommer@luxon.de`. `c.wagner@web.de` is deliberately refused — the shop
denies it B2B-platform access on every route.

### Checking a shop yourself

```bash
node scripts/verify-openapi.mjs                       # map vs. the shop's OpenAPI document
node scripts/smoke-store-api.mjs --user=… --password=…  # map vs. the shop itself, read-only
```

The second is the stronger claim: a route can match the document and still 404.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
  <!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features

Backend only — a typed Store-API surface, not a storefront app. No Orchestr
handlers, no sections, no blocks live here; the consumer (`app-boltze`) writes
those and calls the client this module exposes.

- 🔌 &nbsp;89 typed Store-API operations with thin query wrappers, verified against a live shop
- 🔑 &nbsp;Request-scoped client that holds a customer session (`useB2bSellersClient`), the secret server-side only
- 🧪 &nbsp;Two verification scripts — one against the shop's OpenAPI document, one against the shop itself

## Quick Setup

Before installing dependencies, you need to create a copy of the `.npmrc.config` file called `.npmrc` and fill in the `NPM_LAIOUTR_TOKEN` with your npm token. You can find this token in your [project settings](https://cockpit.laioutr.cloud/o/_/p/_/settings).

- `pnpm i`
- `npx @laioutr/cli project fetch-rc -p <organization slug>/<project slug> -s <project secret key>` - This will load the `laioutrrc.json` file with the current remote project configuration.
- `pnpm dev:prepare`
- `pnpm orchestr-dev`

That's it! You can now use the B2B Sellers App in your [Laioutr Frontend](https://laioutr.com) ✨

You can find a thorough guide on getting started with Laioutr development in our [developer guide](https://docs.laioutr.io/developer-guide/setup).

## Linting and Formatting

We use ESLint and Prettier to lint and format the code. This repository contains opinionated configurations for both tools. You can - of course - replace them with your own configurations.

## Publishing

Releases are managed with [Changesets](https://github.com/changesets/changesets) and published to npmjs.org automatically by the `release` workflow.

To ship a change:

1. In your PR, run `pnpm changeset` and follow the prompt to record the change and the version bump (patch/minor/major). Commit the generated file in `.changeset/`.
2. Merge the PR to `main`. The release workflow opens (or updates) a **"Version Packages"** PR that applies the pending changesets to the version and `CHANGELOG.md`.
3. Merge the "Version Packages" PR. The workflow builds the package and publishes it to npmjs.org, tags the commit, and creates a GitHub release.

Publishing uses [npm OIDC trusted publishing](https://docs.npmjs.com/trusted-publishers), so no npm token is stored in the repository — the workflow needs `id-token: write` and a trusted publisher configured for the package on npmjs.org.

## Contribution

Follow the [setup guide](https://docs.laioutr.io/developer-guide/setup) to get started.

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@laioutr/app-b2bsellers/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/@laioutr/app-b2bsellers
[npm-downloads-src]: https://img.shields.io/npm/dm/@laioutr/app-b2bsellers.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/@laioutr/app-b2bsellers
[license-src]: https://img.shields.io/npm/l/@laioutr/app-b2bsellers.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/@laioutr/app-b2bsellers
[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
[laioutr-src]: https://img.shields.io/badge/%F0%9F%A6%99_Laioutr_App-702DCE
[laioutr-href]: https://www.laioutr.com/
