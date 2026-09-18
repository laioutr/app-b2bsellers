---
'@laioutr/app-b2bsellers': minor
---

Add the B2B Sellers Store-API wrapper foundation (backend-only).

- Backend-only module: registers Orchestr dirs + the server-side client
  auto-import; no frontend sections/blocks/UI/image.
- `@shopware/api-client` client typed against a custom `B2bSellersOperations`
  map; `useB2bSellersClient` Nitro auto-import (sw-access-key from config,
  sw-context-token from cookie).
- Orchestr middleware `defineB2bSellers` exposing `context.client`.
- Wire-DTO types and a token-free `queries/` layer wrapping all ~91
  `/store-api` + `/b2b` endpoints.

The token-bound Orchestr handler layer (QueryTokens/ActionTokens, entity
component tokens, resolvers, DTO→canonical mappers) is deferred — see
REQUIREMENTS-ORCHESTR.md.
