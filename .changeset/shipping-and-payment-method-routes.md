---
'@laioutr/app-b2bsellers': minor
---

Type the shipping- and payment-method routes in the operations map.

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
