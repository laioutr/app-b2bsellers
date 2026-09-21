# @laioutr/app-b2bsellers

## 0.2.1

### Patch Changes

- 65f7d5a: Correct three operations-map request shapes, verified live against the demo shop:
  - `searchCustomers` (`/sales-representative/customer-search`) requires a top-level
    `search` string — an empty body answers `400 "Parameter search is missing"`; the
    body type now demands it.
  - `productTableListing` (`/product-table-listing`) needs a real Criteria (at least
    `page`/`limit`); an empty body answers `400`. The body type is now a required
    `ShopwareCriteria`.
  - `getEmployee` (`/b2b/employee/{id}`) takes the employee's own id (`employee.id`,
    exposed as `employeeId` on the `/b2b/employees` rows), not the relation row's
    top-level `id` — the route exists and was mislabelled route-absent. Documented on
    the map, and `scripts/smoke-store-api.mjs` now harvests `employeeId` and sends
    the required bodies, so all three probe green.

## 0.2.0

### Minor Changes

- ce9efbf: Add the B2B Sellers Store-API wrapper foundation (backend-only).
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

- ce9efbf: Type the shipping- and payment-method routes in the operations map.
  - `listShippingMethods post /store-api/shipping-method` and
    `listPaymentMethods post /store-api/payment-method`, both answering a
    `ShopwareListResponse` and accepting a Criteria body plus the shop's
    `onlyAvailable` query flag.
  - `ShippingMethod` / `PaymentMethod` wire DTOs over a shared `ShopwareMethod`,
    carrying `translated.name` — the untranslated `name` is the admin's label and
    stays German on an English session.

  Plain Shopware routes rather than B2B-Sellers ones, and the SDK's generated
  operations are not in play for this client, so they belong in the map like the
  rest. A caller that needed them had to reach the shop through the untyped
  `x post /store-api/…` escape hatch and lose the typing this package exists to
  provide.

- ce9efbf: Correct the Store-API operations map against the live demo shop, and give the connector a session.

  The map was written without a live instance. Verified against the shop's OpenAPI document
  (Shopware 6.7.6.2), the v4 vendor documentation and live probes, 68 of its 92 operations did not
  match the shop:
  - every `/b2b/...` path was missing the `/store-api` prefix and answered 404 (29 operations)
  - the employee domain belongs under `/store-api/b2b/` (10 operations)
  - customers, activities and statistics belong under `/store-api/sales-representative/` (11 operations)
  - four routes answer a different method, `delete` routes answer 200 rather than 204, and 23 path
    parameters carry different names (`{orderApprovalId}`, `{BudgetId}`, `{CostCenterId}`)
  - order-approval `list` and `create` are served from `/b2b/` as well, although both the document and
    the vendor documentation place them on the plain path — where the shop answers 404

  Eight operations that the installed version does not serve were removed: the three
  product-subscription routes, `deliveryIntervals`, `paymentConditions`, `listEventProducts`,
  `offerMailTemplates` and `updateOfferStatus` — an offer's status changes through the new
  `updateOffer`. Two activity-type entries were renamed to what the routes actually do.

  Authentication is new. Every B2B route answers 403 without a customer session, and nothing in the
  module previously established one: `login`, `logout`, `getContext` and `getCurrentCustomer` are now
  part of the surface, and `useB2bSellersClient` persists the rotated `sw-context-token` through the
  SDK's `onContextChanged` hook, so a login survives past the request that made it.

### Patch Changes

- e6f6cad: Mark the four overtaken claims in the Core gap list.

  `REQUIREMENTS-ORCHESTR.md` said the canonical layer has no B2B entities or tokens
  and that the integration had to wait for the core. Neither holds: `Quote`,
  `Organization`, `Employee`, `CostCenter`, `Budget` and the `b2b/*` token domains
  exist, the real gap is the missing quote _queries_, and the integration already
  runs against a live shop. The verification section is closed too — the map is
  checked against the shop's own OpenAPI document by script.

  The original wording stays, marked as overtaken: the wrong reading cost two days
  and the reasoning is worth keeping.

- ca2ffe0: Name the contributor in the package metadata.
- 5c4ceb9: Name the two shop-verification scripts in `package.json` and explain them in the README.

  `pnpm verify:openapi` compares the operations map with the shop's own OpenAPI document;
  `pnpm verify:shop` calls the shop instead of reading its document, read-only. Both were
  only reachable by typing the file path, so neither was obvious to anyone who had not
  written them.

  The README now also says what the check is for: a wrong entry in the map is invisible to
  TypeScript, the linter and the unit tests, and surfaces at runtime as a 404 that reads
  like a missing feature rather than a misspelled path.
