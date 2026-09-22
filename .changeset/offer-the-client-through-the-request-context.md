---
'@laioutr/app-b2bsellers': minor
---

The client is offered through the request context, so an installed app can reach it.

`useB2bSellersClient` was published as a Nitro auto-import alone. That is enough for an app built
from workspace source and nothing else: unimport excludes every file under `node_modules`
(`defaultExcludes`), so an app that reaches this connector through the bare identifier finds
nothing there once both are installed from a registry. The identifier stays undefined, the client
is null on every request, and the failure reads as a missing shop connection — on a project whose
endpoint and access key are correct and reachable.

A Nitro plugin now also hands the factory to `event.context['@laioutr/app-b2bsellers:client']`,
which nothing resolves at build time and no bundler filter can drop. It stays a factory, so a
request that never talks to the shop builds no client. The auto-import is unchanged, so consumers
on it keep working.

The module now also inlines this package into the Nitro bundle: its runtime imports `#imports`,
an alias that only resolves for code inside that bundle, and installed from a registry this code
is external by default.
