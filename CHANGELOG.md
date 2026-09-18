# @laioutr/app-b2bsellers

## 0.2.0

### Minor Changes

- 1e30d41: Add the B2B Sellers Store-API wrapper foundation (backend-only).
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

- 38f8401: Type the shipping- and payment-method routes in the operations map.
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

- bb2b04c: Correct the Store-API operations map against the live demo shop, and give the connector a session.

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
