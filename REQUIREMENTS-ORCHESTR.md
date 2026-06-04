# Orchestr-Integration — offener Bedarf (für die Session mit Sebastian)

> Erstellt am Ende der „rohen" Integrations-Session (`feat/b2bsellers-api-wrapper`).
> Diese Session hat bewusst nur die **token-freien** unteren Schichten gebaut
> (client / types / queries). Dieses Dokument hält fest, was fehlt, um die
> **Orchestr-Handler-Schicht** (Queries/Actions/Resolver) sauber zu bauen.
> Nächster Schritt: mit Sebastian durchgehen, Tokens/Entities festlegen.

## Was diese Session geliefert hat (Stand `feat/b2bsellers-api-wrapper`)

- **Backend-only-Modul** (`src/module.ts`): registriert nur `orchestrDirs`,
  `addServerImportsDir(server/client)`, installiert nur `frontend-core` +
  `orchestr`. Keine Sections/Blocks/UI/Image. Runtime-Config-Key
  `@laioutr/app-b2bsellers`.
- **Client** (`server/client/`): `@shopware/api-client` via
  `createAPIClient<B2bSellersOperations>()`. `operations.ts` typisiert alle
  ~91 Endpunkte (Pfad/Methode/Body/PathParams/Response). `useB2bSellersClient`
  als Nitro-Auto-Import (Config aus `APP_CONFIG_KEY`, `sw-context-token` aus
  Cookie).
- **Middleware** (`server/middleware/defineB2bSellers.ts`): stellt
  `context.client` bereit; Binder `defineB2bSellersQuery/Action/Link/ComponentResolver`
  bereits exportiert.
- **Wire-DTO-Typen** (`server/types/`): Employee, Offer, Customer(+Activity),
  ProductList, CostCenter, Budget, OrderApproval, CustomerProductNumber,
  ProductSubscription, Shared (ListResponse/Money/Criteria/Audit).
- **queries-Schicht** (`server/queries/`): 92 typisierte `invoke`-Wrapper über
  alle Domains. **Token-frei, kompiliert grün, aber noch nicht an Orchestr
  angebunden.**

Verifiziert (kein Live-Tenant): `pnpm lint` ✅, `pnpm test` ✅,
`pnpm dev:prepare` ✅. `test:types`: nur die bekannten Nitro-/Template-Baseline-
Meldungen, identisch zur `app-actindo`-Referenz (kein CI-Gate).

## Architektur-Lücke

Die Orchestr-Builder-API ist **token-basiert**:
- `queryHandler(token, fn)` braucht einen `QueryToken` (mit `entity`, `type`
  `multi|single`, Input-Zod, `label`).
- `actionHandler(token, fn)` braucht einen `ActionToken` (Input/Output-Zod).
- `componentResolver({ entityType, provides, resolve })` braucht
  **EntityComponentTokens** + i. d. R. einen passenden canonical Entity-Typ.

Für die B2B-Sellers-Entities (Employee, Offer, CostCenter, Budget,
OrderApproval, ProductList, …) existieren **noch keine** Tokens/Entity-Typen.
Rohe `z.object`-Schemas reichen NICHT — der Handler kompiliert nicht ohne Token.

## Konkreter Bedarf (mit Sebastian zu klären/definieren)

### 1. Canonical Entity-Typen
Pro Entity prüfen, ob es in `@laioutr-core/canonical-types` einen passenden Typ
gibt, oder ob ein neuer (B2B-)Entity-Typ definiert werden muss:
`Employee`, `EmployeeRole`, `Offer`, `CostCenter`, `Budget`, `OrderApproval`,
`ProductList`, `CustomerActivity`, `ProductSubscription`, `CustomerProductNumber`.

### 2. QueryTokens (`defineQueryToken`)
Pro Listen-/Detail-Query: `name` (namespaced `@laioutr/app-b2bsellers/<domain>/<query>`),
`entity`, `type` (`multi` für Listen, `single` für Detail), `input` (Zod),
`label`. Kandidaten u. a.:
- `employee/list` (multi, Employee), `employee/get` (single)
- `offer/list` (multi, Offer), `offer/get` (single)
- `cost-center/list`, `budget/list`, `order-approval/list`, `product-list/list`,
  `employee-order/list`, `customer-activity/list`, `product-subscription/list`, …

### 3. ActionTokens (`defineActionToken`)
Pro Mutation, namespaced `@laioutr/app-b2bsellers/<domain>/<action>`, mit
Input/Output-Zod. Mutationen sind self-contained (keine Entity nötig) und der
schnellste erste Orchestr-Schritt. Kandidaten u. a.:
- employee: create / add / update / delete
- offer: delete / convert-to-order / status / mail / document
- customer-activity(+type): create / update / delete
- product-list: create / update / delete / remove-product
- cost-center: create / update / patch / delete
- budget: create / update / patch / delete
- order-approval: create / approve / decline / execute / refresh / update /
  remind / remind-all / settings / line-items
- customer-product-number: create / delete / import
- account-request, product-request, sales-representative/fast-order

### 4. EntityComponentTokens + Component-Resolver
Pro renderbare Entity: `defineEntityComponentToken` + `componentResolver`
(`entityType`, `provides`, `resolve`), inkl. Cache-Strategie. Hydriert die von
den QueryHandlern zurückgegebenen IDs.

### 5. DTO→Canonical-Mapper (`server/*-helper/`)
Mapping der Wire-DTOs (`server/types/`) auf die canonical Component-Shapes —
analog `app-actindo/server/orchestr-helper/` + `actindo-helper/`.

### 6. Context-Token-Lifecycle
`@shopware/api-client` rotiert `sw-context-token` und feuert `onContextChanged`.
Der neue Token muss in den Response-Cookie (`CONTEXT_TOKEN_COOKIE`) geschrieben
werden — in der **`onRequest`/Response-Phase**, NICHT in `extendRequest`
(dort sind Header ggf. schon raus). Strategie + `setCookie`-Hook festlegen.

### 7. Einheitliches Criteria-Input-Schema
Die `(Criteria)`-Endpunkte (search, *list, variant-list, budget orders-filtered)
brauchen ein gemeinsames, getyptes Shopware-`Criteria`-Zod-Schema
(filter/sort/associations/aggregations/pagination). Aktuell `ShopwareCriteria`
(lose) in `server/types/shared.ts`.

## Verifizierungs-Lücken (mangels Live-Tenant)
- **Wire-Shapes** der DTOs sind best-effort, nicht gegen einen echten
  Tenant/OpenAPI-Export verifiziert. Vor Token-Definition gegen die echte
  B2B-Sellers-Plugin-Doku/OpenAPI gegenprüfen.
- **Pfad-Präfixe**: `/store-api/*` vs. `/b2b/*` als volle Pfade gegen baseURL =
  Shop-Origin. Gegen eine reale Instanz testen (insb. die `/b2b/*`-Auth).
- **HTTP-Methoden** einzelner Endpunkte (z. B. PUT vs. PATCH bei update vs.
  patch) gegen die Plugin-Routen verifizieren.

## Getroffene Entscheidungen (dieser Session)
- **Paketname** `@laioutr/app-b2bsellers` (Konvention wie `@laioutr/app-actindo`).
- **Client** `@shopware/api-client` (SDK) statt ofetch — auf Wunsch; kein
  `rawRequest` → eigener `B2bSellersOperations`-Typ + `invoke`.
- **Scope**: Foundation + queries-Layer; Orchestr-Handler verschoben (dieses Doc).
