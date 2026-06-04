# B2B Sellers → Core-Lücken-Liste (Canonical Types & Orchestr)

> **Zweck.** Diese App ist das **Beispiel**, an dem sichtbar wird, was im
> `@laioutr-core` (Canonical Types + Orchestr) noch fehlt, um eine
> B2B-Sellers-Integration **nativ** und sauber zu bauen.
>
> **Diese Session baut bewusst NICHTS Custom.** Es wurden **keine** eigenen
> Orchestr-Tokens, **keine** eigenen Canonical-Entity-Typen und **keine**
> Handler definiert. (`orchestr/` enthält nur das Template-`zodFix`-Plugin.)
> Vorhanden ist nur das **Beispiel-API-Surface**: SDK-Client, Middleware,
> Wire-DTO-Typen und die token-freie `queries/`-Schicht (typisierte
> `invoke`-Wrapper über alle ~91 Endpunkte). Das ist die Referenz, **nicht**
> die fertige Integration.
>
> **Deliverable = diese Liste.** Die fehlenden Query-/Action-Handler und vor
> allem die fehlenden Canonical Types werden anschließend im Core nachgezogen.

## Entscheidungs-Prinzip (CTO)

> „Bei der Frage, ob eine Entität/Action in die **Canonical Types** oder direkt
> in die **B2B-Sellers-App** gehört: **im Zweifel immer erst in die App**, und
> wir prüfen im Nachhinein, ob es auch in die normalen Canonical Types kann."

Klassifizierung unten:
- **Core** = klares, anbieter-übergreifendes Commerce-Primitiv → Kandidat für Canonical Types.
- **App-first** = B2B-Sellers-spezifisch → zunächst in die App, später Re-Eval Richtung Core.

## Was im Canonical-Layer bereits existiert (Stand `@laioutr-core/canonical-types`)

- **Entities:** Product, ProductVariant, Category, Cart, CartItem, BreadcrumbItem, Review, MenuItem, SuggestedSearch(+Entry), Blog*, Comment.
- **Query-Tokens:** product (search / by-slug / by-category-id / by-category-slug), category (all / by-slug), cart (get-current), wishlist (get-current), menu (by-alias).
- **Action-Tokens:** auth (login / logout / register / recover / oauth), cart (add/remove/update-items, get-checkout-url), customer (get-current, address create/update/delete/get-all/set-default), review (create), wishlist (add/remove-items).
- **Links:** product (variants / reviews / breadcrumb / all-categories), category (products / breadcrumb), cart (items / item-variant).
- **Pagetypes:** product-detail / product-listing / product-search.

**Befund:** Es gibt **keine** Canonical-Entity und **keine** Tokens für
Order, Customer (außer get-current/address), Employee, Offer, CostCenter,
Budget, OrderApproval, CustomerActivity, ProductSubscription oder
CustomerProductNumber. Damit lässt sich **kein** B2B-Sellers-Domänen-Endpunkt
an einen bestehenden Canonical-Token binden → in dieser Session wurden **keine**
Handler integriert (es gibt nichts „Vorhandenes" zum Andocken, ohne zu erfinden).

---

## A. Querschnitt / geteilte Bausteine (zuerst, weil mehrfach gebraucht)

| # | Fehlt im Core | Gebraucht von | Empfehlung |
|---|---|---|---|
| A1 | **`Order`-Entity** + Query-Tokens `order/list` (multi), `order/by-id` (single) + Component-Resolver | employee-orders, customer-last-orders, budget/{id}/orders, order-approval | **Core** (Order ist Commerce-Primitiv) |
| A2 | **`Customer`-Entity** (B2B-Sicht) + Query `customer/search` (multi), `customer/by-id` (single) | customer search, sales-ranking, überall wo `customerId` referenziert | **Core** (Customer-Entity), B2B-Such-Semantik **App-first** |
| A3 | **`Money`/Preis-Canonical** für B2B-Preise (`customer-prices`) | customer-prices, offer line items, budget | **Core** (Money existiert teils via shared-ecommerce → prüfen/erweitern) |
| A4 | **Shopware-`Criteria`-Input-Schema** (filter/sort/associations/aggregations/pagination) als wiederverwendbares Zod | alle `(Criteria)`-Endpunkte (search, *list, variant-list, budget orders-filtered) | **App-first** (Shopware-spezifisch); ggf. Shared-Util |
| A5 | **Context-Token-Lifecycle** (`sw-context-token` Cookie set bei SDK-`onContextChanged`, in onRequest-Phase) | jeder authentifizierte Call | **App** (Mechanik); Pattern dokumentieren |

---

## B. Pro Domain — fehlende Canonical/Orchestr-Bausteine

Legende: **Q** = QueryToken (+Entity+Component-Resolver), **A** = ActionToken (self-contained), **L** = LinkToken.

| Domain | Fehlende Entity-Typen | Fehlende Q (Query-Tokens) | Fehlende A (Action-Tokens) | Empf. |
|---|---|---|---|---|
| **employee** | Employee, EmployeeRole, EmployeePermission | list, by-id, roles, permissions | create, add, update, delete | App-first |
| **employee-order** | (nutzt A1 `Order`) | list, by-id | – | App-first → bindet an Core-Order (A1) |
| **offer** | Offer, OfferLineItem, OfferMailTemplate | list, by-id, mail-templates | delete, convert-to-order, update-status, send-mail, generate-document | App-first |
| **cost-center** | CostCenter | list, by-id | create, update, patch, delete | App-first |
| **budget** | Budget, BudgetOrder, BudgetPeriodType | list, by-id, orders, orders-filtered, period-types, approval-employees, my-budgets | create, update, patch, delete | App-first |
| **order-approval** | OrderApproval, Approver, ActivityEntry, ApprovalSettings | list, by-id, activity, approvers, budget-summary, count-pending, customer-settings(get) | create, approve, decline, execute, refresh, update, remind, remind-all, update-pending, customer-settings(set), update-line-item, delete-line-item | App-first |
| **product-list** | ProductList, ProductListItem | list, by-id | create, update, delete, remove-product | App-first (alt.: Canonical **Wishlist** erweitern → Core prüfen) |
| **customer-activity** | CustomerActivity, CustomerActivityType | list, by-id, type-list | create, update, delete, type-create, type-delete | App-first |
| **product-subscription** | ProductSubscription | list, detail | delete | App-first |
| **customer-product-number** | CustomerProductNumber | list | create, delete, import | App-first |
| **customer** | (A2 `Customer`) | search, last-orders (→A1 Order), prices (→A3) | – | Core (Entity) / App-first (B2B-Queries) |
| **customer-sales-ranking** | SalesRankingEntry | list | – | App-first |
| **product-table-listing** | (nutzt Core `Product`) | list (B2B-Listing) | – | App-first → bindet an Core-Product |
| **pdp-variant-list** | (nutzt Core `ProductVariant`) | list | – | App-first → bindet an Core-ProductVariant |
| **event-product** | (nutzt Core `Product`) | list | – | App-first |
| **spare-parts** | (nutzt Core `Product`) | similar-products | – | App-first |
| **product-request** | – | – | send | App-first |
| **sales-representative** | – | – | fast-order | App-first |
| **misc** | – | delivery-intervals, payment-conditions, sales-statistics | account-request | App-first (z. T. evtl. Nicht-Orchestr-Utilities) |
| **platform-cms** | (ggf. Core Page/CMS-Typ) | get | – | Core prüfen / App-first |
| **snippets** | – | get | – | App-first (Util) |
| **login-targets** | – | list | – | App-first |

---

## C. Orchestr-Mechanik, die je Entity zusätzlich fehlt

Pro renderbarer Entity (employee, offer, cost-center, budget, order-approval,
product-list, customer-activity, order, customer, …):

1. **`defineEntityComponentToken`** + **Component-Resolver** (hydriert die von den Query-Handlern gelieferten IDs; inkl. Cache-Strategie).
2. **DTO→Canonical-Mapper** (`server/*-helper/`) — Mapping der Wire-DTOs (`server/types/`) auf die Canonical-Component-Shapes.
3. Erst dann sind die Query-Handler (binden an die Q-Tokens aus B) baubar; Action-Handler (A-Tokens) sind self-contained und können ohne Entity/Resolver gebaut werden, sobald die Action-Tokens existieren.

---

## D. Plattform-Hinweis: `initializePlatform`

> B2B Sellers nutzt ein **eigenes Addon zur Plattform-Initialisierung**
> (`initializePlatform`). Um **Versionskonflikte mit dem standardmäßigen
> Shopware-Storefront-Core** zu vermeiden, wird empfohlen, diese
> Initialisierungs-Logik **manuell in das lokale Frontend-Projekt zu kopieren**
> (statt sie aus dem Standard-Storefront-Core zu beziehen).

→ Offen für die Core-Session: Soll diese Init-Logik (a) im lokalen Frontend
gepflegt, (b) als App-seitige Variante gekapselt oder (c) im Core
versions-kompatibel gemacht werden? Bis dahin: **manuelle Kopie ins
Frontend-Projekt** als Workaround dokumentieren.

---

## E. Verifizierungs-Lücken (kein Live-Tenant)

Vor der finalen Token-/Entity-Definition gegen die **echte B2B-Sellers-Plugin-
OpenAPI / eine reale Instanz** gegenprüfen:
- Wire-Shapes der DTOs (Felder/Optionalität) — aktuell best-effort.
- HTTP-Methoden einzelner Endpunkte (PUT vs. PATCH bei update/patch).
- Pfad-Präfixe `/store-api/*` vs. `/b2b/*` gegen baseURL = Shop-Origin, insb. die `/b2b/*`-Auth.

---

## F. Was diese App schon mitbringt (Referenz, nicht Custom-Canonical)

- Backend-only-Modul (`module.ts`), `APP_CONFIG_KEY`, Cookie-Key.
- SDK-Client `@shopware/api-client` (`createAPIClient<B2bSellersOperations>`), `useB2bSellersClient` (Nitro-Auto-Import).
- Middleware `defineB2bSellers` (`context.client` + Binder-Exports — definiert **keine** Tokens).
- Wire-DTO-Typen (`server/types/`) + token-freie `queries/`-Schicht (92 `invoke`-Wrapper).

Diese Schicht bleibt als **Beispiel-Surface** bestehen; die eigentlichen
Handler entstehen, sobald die Bausteine aus A–C im Core (bzw. App-first lt. CTO)
vorliegen.
