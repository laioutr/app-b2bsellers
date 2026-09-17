# Store-API surface verification against the live demo shop

Stand 2026-09-17. Verifies the 92-entry operations map in
`src/runtime/server/client/operations.ts` (PR #3) against the shop the October 5 demo runs on.

The map was written without a live instance and says so in its own header. This is the pass that
replaces those guesses with evidence.

## What was checked, and against what

Shop: `https://laioutr.demoshop.b2b-sellers.com`, Shopware **6.7.6.2** (from the served OpenAPI
document's `info.version`). B2Bsellers Suite: the admin offers an update to v4.2.0, so the installed
version is **older than 4.2.0** — see the open questions below, this matters.

Three independent sources, in increasing authority:

1. The shop's own OpenAPI document — `GET /store-api/_info/openapi3.json`, 187 paths.
2. Vendor documentation for v4 (Shopware 6.7) — `https://docs.b2b-sellers.com/b2b-platform/api-reference/store-api/`.
3. Live HTTP probes against the shop, read-only (`GET`/`POST`, no `DELETE`).

Where sources disagree, the live shop wins. One such disagreement was found — see below.

## Result

| Verdict | Before | After |
| --- | --- | --- |
| OK | 24 | **74** |
| MISMATCH | 30 | 16 |
| PATH_MISSING | 34 | 0 |
| WRONG_METHOD | 4 | 0 |
| PREFIX_MISSING | — | 0 |
| Operations in the map | 92 | 90 |

The original 24 `OK` was optimistic: 9 of them were `/b2b/...` operations the checker accepted
because it indexed both OpenAPI server-URL layouts at once. Those 9 were in fact broken — see
defect 1 — and the checker has since been tightened, which is what the new `PREFIX_MISSING` verdict
is for.

The map went from 92 to 90 entries: eight operations that do not exist were removed, four auth
operations and two real routes (`updateOffer`, `listOfferStates`) were added, and two
activity-type entries were renamed to what they actually do.

### The 16 remaining mismatches are gaps in the vendor's OpenAPI, not defects

Two shapes, and neither should be "fixed" by changing the map — doing so would break working calls:

- **"map sends a body, specification documents none"** (10) — list routes such as
  `/b2b/cost-center/list`, `/b2b/employees`, `/sales-representative/customers`. The document omits
  the `requestBody`, while the vendor's own prose documentation says the route "allows filtering
  them based on a criteria". The body stays.
- **"path parameters: map has 1, specification has 0"** (6) — e.g. `/b2b/employee/{id}`,
  `/platform-cms/{id}`. The path key carries the placeholder but the document declares no parameter
  object for it. The parameter stays.

## The three systematic defects

Large in count, narrow in kind. All of them live in `operations.ts`.

### 1. Every `/b2b/...` path is missing the `/store-api` prefix — 29 operations

The document declares `servers: [{ url: "https://<shop>/store-api" }]` and all 187 paths are
relative to it. A spec path of `/b2b/employee-budget` therefore resolves to
`/store-api/b2b/employee-budget`.

Proven live:

```
GET /b2b/employee-budget                       → 404
GET /store-api/b2b/employee-budget             → 403   (exists; needs a customer session)
```

As written, every `/b2b/` call in the map 404s.

### 2. A third prefix the map does not know: `/store-api/sales-representative/...` — 11 operations

`searchCustomers`, `customerLastOrders`, the five `customer-activity` operations, the three
`customer-activity-type` operations, `customerSalesRanking`, `salesStatistics`.

### 3. The employee domain sits under `/store-api/b2b/`, not `/store-api/` — 10 operations

`listEmployees`, `getEmployee`, `createEmployee`, `addEmployee`, `updateEmployee`, `deleteEmployee`,
`listEmployeeRoles`, `listEmployeePermissions`, `listEmployeeOrders`, `getEmployeeOrder`.

Proven live: `POST /store-api/b2b/employees` → 403, `POST /store-api/employees` → 404.

## Smaller corrections

| Kind | Detail |
| --- | --- |
| Wrong method | `generateOfferDocument` POST → GET; `getSnippets` POST → GET; `listLoginTargets` POST → GET |
| Wrong path + method | `deleteOffer` → `DELETE /store-api/sales-representative/offer/{id}` |
| Wrong path shape | `getProductList` → `/store-api/product-lists/{id}` (not `/product-lists/detail/{id}`) |
| Wrong path shape | `removeProductListProduct` → `/store-api/product-lists/{id}/product/{productId}` (parameters were reversed) |
| Path parameter names | `{id}` → `{orderApprovalId}` (13×), `{BudgetId}` (5×), `{CostCenterId}` (5×) |
| Status codes | Every `delete` declares 204; the API answers **200** |
| Request bodies | `declineOrderApproval` requires `comment`; `remindOrderApproval` requires `approverId`; `updateOrderApprovalLineItem` requires `quantity`; `deleteOrderApprovalLineItem` requires `reason`; `createOrderApproval` requires `cartToken`. Several others send a body the API does not document |
| Typo | `updateCustomerActivity` had a trailing slash and no `{id}` |

Correct as written, confirmed against all three sources: `pdpVariantList`
(`/store-api/variant-list/{productId}` — the vendor annotated this route with its full path, so it
appears in the document as `/store-api/variant-list/...`; the live shop answers 400 there, 404 on the
doubled prefix), `listBudgets`, `createBudget`,
`budgetOrders`, `budgetOrdersFiltered`, `budgetPeriodTypes`, `customerPrices`,
`productTableListing`, `accountRequest`, `salesRepFastOrder`, `convertOfferToOrder`, `sendOfferMail`,
`listOffers`, `getOffer`, `listProductLists`, `createProductList`, `updateProductList`.

## Operations that do not exist in the installed version

All seven return 404 on the live shop and appear in neither the document nor the v4 vendor docs:

- `listProductSubscriptions`, `getProductSubscription`, `deleteProductSubscription`
- `deliveryIntervals`
- `paymentConditions`
- `listEventProducts`
- `offerMailTemplates`

`updateOfferStatus` (`PATCH /offer/{id}/status`) also does not exist; the documented way to change an
offer is `PUT /store-api/offer/{id}`.

## Where the vendor documentation disagrees with the installed version

The v4 docs list `GET /budget-approval-employees`. The installed shop returns 404 for it and 403 for
`/store-api/b2b/order-approval/budget-approval-employees`. The published docs describe a version the
shop does not run. This is the concrete reason the plugin version matters.

### And where *both* sources disagree with the shop: order-approval `list` and `create`

Found by the smoke test after this report was first written, and fixed in `5edd4bc`. The OpenAPI
document carries them as `/order-approval/list` and `/order-approval/create` — the only two
order-approval keys in the whole document that are not under `/b2b/` — and the vendor documentation
agrees. The shop does not:

```
POST /store-api/order-approval/list        → 404
POST /store-api/b2b/order-approval/list    → 401   (exists; needs a customer session)
POST /store-api/order-approval/create      → 404
POST /store-api/b2b/order-approval/create  → 401
```

Two sources agreeing with each other and disagreeing with the shop. The shop wins, so the map serves
both from `/b2b/`, and `verify-openapi.mjs` carries the pair in `KNOWN_DOCUMENT_ERRORS` so that a
later run against the document cannot talk anyone into moving them back onto a path that 404s.

## Two defects in the checker itself, found while fixing the map

Worth recording because both produced confident wrong answers:

1. **Indexing both server-URL layouts** marked nine broken `/b2b/...` operations as `OK`. The server
   prefix is now authoritative, and a path that only matches without it reports `PREFIX_MISSING`.
2. **The operations parser read only the first line of an entry.** Multi-line entries looked as
   though they declared no request body, so correctly-required bodies were reported as missing. It
   now reads to the entry's terminating `;` at brace depth zero.

A third case needed a live probe rather than a code change: `pdpVariantList`. The vendor annotated
that one route with its full path, so the document lists it as `/store-api/variant-list/{productId}`
while every other key is relative. Prefixing it again yields `/store-api/store-api/...`, which the
shop answers with 404 — the map was right all along, and the checker now treats an already-absolute
key as absolute.

## With a session — what the map does once it can read

The demo shop publishes its own test accounts at `/Benutzeruebersicht/`, which is what unblocked
this. The sales app signs in as the **Vertriebsmitarbeiter** `m.sommer@luxon.de` (Supervisor, all
rights); `henk.becker@ektek.com` is a B2B administrator and `c.wagner@web.de` a private customer with
no platform access, both useful for testing what should be refused.

```bash
node scripts/smoke-store-api.mjs --user=m.sommer@luxon.de --password=<published on that page>
```

27 operations answer with real data — 17 employees, 10 employee roles, 15 permissions, 3 cost
centers, 12 sales-representative customers, 5 last orders, 19 statistics rows, 10 activity types, 5
offer states. `zero needs-session`, so every route the connector reaches is now reachable in fact and
not only in principle.

### Six defects only a session could expose

A 403 hides everything behind it, so these could not have been found before:

| Operation | | |
| --- | --- | --- |
| `listCustomerActivityType` | 404 | `/sales-representative/customer-activity-type/list` does not exist — the bare `…/customer-activity-type` does, and answers 10 items |
| `getEmployee` | 404 | `/b2b/employee/{id}` does not exist, although `/b2b/employees` lists 17 of them |
| `myEmployeeBudgets` | **500** | `/b2b/employee-budget` — a shop-side error, not a bad request. Worth reporting to the vendor |
| `productTableListing` | 400 | requires parameters the probe does not send; the required body is undocumented |
| `searchCustomers` | 400 | same shape — `/sales-representative/customer-search` needs a documented query |
| `listCustomerActivity` | 400 | same shape |

The three 400s are probably "the map declares the body optional where the route requires it", which is
exactly the class of defect the OpenAPI document could not settle — it omits those request bodies
altogether. They need one authenticated call each with a real payload to pin down.

## Writing is a different story: offers cannot be built through the Store API here

Reading the shop works. Creating the data a sales demo needs does not, and the reason is not one
missing parameter — three independent routes into an offer are each closed, by different doors.
Established 2026-09-17 against the live shop with a representative session.

**1. `POST /offer` works; nothing may then be put on the offer.**

The document spells the route `/offer/` with a trailing slash, which 404s — the shop serves
`/store-api/offer`. With that corrected, creating an offer succeeds and the shop assigns its own
number (1136–1141 were created this way). Adding products then fails:

```
POST /store-api/offer-add-products/{id}   → 403 B2B_OFFER__UPDATE_DENIED
PUT  /store-api/offer/{id}                → 405 Method Not Allowed
```

`B2B_OFFER__UPDATE_DENIED` is **not** about the offer's state: the offer was walked through all five
states the shop returns and answered 403 in every one. And the state cannot be changed anyway,
because the documented update route does not accept `PUT` on this installation. So an offer created
through this route is permanently empty.

Two further corrections to the document while there: `number` is **required** (it is marked optional;
without it the shop answers `VIOLATION::IS_BLANK_ERROR` at `/number`), and `offer-add-products` takes
`lineItems`, not the `object` the schema names.

**2. `POST /offer-request` — the cart-to-offer route — is refused for every account tried.**

```
403 B2B_OFFER__PERMISSION_DENIED  "The customer does not have the needed permission for this offer."
```

Tried as a B2B employee and as a B2B administrator, the account the shop's own page describes as
holding user-management rights. **No employee permission governs offers**: the installed version
exposes 15, and they cover budget rules, addresses, prices, documents, orders, categories and
customer data — none of them offers. So this is a plugin or sales-channel setting in the Shopware
admin, not something a Store-API caller can grant itself.

**3. The sales channel sells one product.**

`POST /store-api/product` on the channel our access key belongs to (`Headless`,
`98432def39fc4624b33213a56b8c944d`) returns **one** article: `SW10129 "Custom offer product"`.
Everything on the existing orders belongs to a different channel (`ee0ad685…`) and the cart refuses
it with `product-not-found`. So even a working offer route would produce offers containing a single
generic placeholder.

### What that needs, and from whom

None of this is API work. Someone with Shopware admin on the demo shop has to either:

- assign the product catalogue and its visibility to the `Headless` sales channel, and enable the
  offer module for the B2B customers on it — or
- hand over the access key of the sales channel that already carries the catalogue
  (`ee0ad685d0504d5f80730d9b53f794c8`, the one the existing orders were placed on).

The second is the cheaper of the two if that channel has the B2B plugin active.

## The blocker that is not about paths

Every B2B route answers **403 without a customer session** — including `/store-api/offer/list`.

The map contains no login operation, and nothing in the module ever writes the context-token cookie:
`useB2bSellersClient` reads `CONTEXT_TOKEN_COOKIE` but no `setCookie` call exists anywhere in `src/`.
`REQUIREMENTS-ORCHESTR.md` section A5 records this as a known gap.

Consequence: as merged, the connector cannot authenticate, so it cannot read anything. This is a
larger practical problem than the paths and is fixed in the same pass.

## Coverage

139 of the shop's 187 paths are not in the map. Several are ones `app-boltze` will need:
`/account/login`, `/offer-request`, `/offer-add-products/{offerId}`, `/offer-states`,
`/sales-representative/offer/{id}`, `/b2b/employee-invitations`.

## How to re-run

```bash
export PATH=/Users/rtsehynka/.nvm/versions/node/v22.22.3/bin:$PATH
export SHOPWARE_SHOP_URL=https://laioutr.demoshop.b2b-sellers.com
export SHOPWARE_ACCESS_KEY="$(node -p "require('./laioutrrc.json').apps[0].config.accessToken")"
node scripts/verify-openapi.mjs --save=openapi3.json
node scripts/verify-openapi.mjs --spec=openapi3.json --fields   # offline, response fields
node scripts/smoke-store-api.mjs                                # calls the shop, read-only
```

`verify-openapi.mjs` compares the map with a document; `smoke-store-api.mjs` calls the shop, which is
the stronger claim — a route can match the document and still 404, as `list` and `create` above did.
It skips every mutating operation by name, and with `--user` / `--password` it logs in and reads real
data. Last run, 2026-09-17: 90 operations, 3 public, 27 waiting on a session, **0 path missing**.

`laioutrrc.json` is gitignored and carries the shop config in the same shape Cockpit generates for
Vercel. Exit 0 clean, 1 mismatches, 2 could not run.

## Open questions — for people, not for the backlog

1. **Which plugin version will the October 5 demo run?** This report describes the currently
   installed one. An update to 4.2.0 before the demo invalidates part of it — the
   `budget-approval-employees` conflict above is a proven example of the two disagreeing.
2. **Where did the seven non-existent operations come from** — v3 documentation, a different shop, or
   are they planned for 4.2.0? Drop them, or keep them pending the update.
3. **Package namespace.** `package.json` carries `@laioutr/app-b2bsellers` with
   `publishConfig.access: "public"` and `provenance: true`, so a release goes to public npmjs, while
   `@laioutr/*` is the namespace requiring CTO approval. Cheap to change now, awkward after the first
   publish.
