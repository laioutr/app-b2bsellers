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
