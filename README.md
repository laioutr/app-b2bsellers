# B2B Sellers App for Laioutr

[![Laioutr][laioutr-src]][laioutr-href]
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A [Laioutr](https://laioutr.com) App for integrating **B2B Sellers** into the Laioutr platform.

This repository is the integration starting point — it ships the module scaffold, CI and
release pipeline, but no business logic yet. The connector implementation is added on top.

See [laioutr.com](https://laioutr.com) for more information about Laioutr.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
  <!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features

<!-- Highlight the features this app provides here as the integration grows. -->

- 🔌 &nbsp;Wired into the storefront via [Orchestr](https://docs.laioutr.io) handlers
- 🧱 &nbsp;Sections & blocks scaffold ready for B2B Sellers content

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
