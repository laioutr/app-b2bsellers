---
'@laioutr/app-b2bsellers': minor
---

Correct the Store-API operations map against the live demo shop, and give the connector a session.

The map was written without a live instance. Verified against the shop's OpenAPI document
(Shopware 6.7.6.2), the v4 vendor documentation and live probes, 68 of its 92 operations did not
match the shop:

- every `/b2b/...` path was missing the `/store-api` prefix and answered 404 (29 operations)
- the employee domain belongs under `/store-api/b2b/` (10 operations)
- customers, activities and statistics belong under `/store-api/sales-representative/` (11 operations)
- four routes answer a different method, `delete` routes answer 200 rather than 204, and 23 path
  parameters carry different names (`{orderApprovalId}`, `{BudgetId}`, `{CostCenterId}`)

Eight operations that the installed version does not serve were removed: the three
product-subscription routes, `deliveryIntervals`, `paymentConditions`, `listEventProducts`,
`offerMailTemplates` and `updateOfferStatus` — an offer's status changes through the new
`updateOffer`. Two activity-type entries were renamed to what the routes actually do.

Authentication is new. Every B2B route answers 403 without a customer session, and nothing in the
module previously established one: `login`, `logout`, `getContext` and `getCurrentCustomer` are now
part of the surface, and `useB2bSellersClient` persists the rotated `sw-context-token` through the
SDK's `onContextChanged` hook, so a login survives past the request that made it.
