# Plan: B2B Sellers Store-API Wrapper — `@laioutr/app-b2bsellers`

> **Status (Stand dieser Session):** Plan überarbeitet nach Abgleich mit der
> **`app-actindo`-Vorlage** (lokal verfügbare, moderne Referenz) und den echten
> `@laioutr-core/orchestr` / `@laioutr-core/core-types` Typdefinitionen aus
> `node_modules`. `app-shopware` liegt **nicht** lokal vor und wurde daher
> nicht als Quelle verwendet.

## Kontext & Scope

Die App kapselt die **B2B Sellers Store-API** (Shopware-6-Plugin) als Laioutr
App. Sie ist eine **reine Backend-/Daten-Integration** — keine Frontend-Sections,
keine Blocks, keine UI-Komponenten, kein Image-Provider.

**Zwei Route-Präfixe** (beide über Storefront-Auth: `sw-access-key` +
`sw-context-token`):
- `/store-api/...` — Core-Endpunkte des B2B Sellers Plugins
- `/b2b/...` — Addon-Endpunkte (Cost Center, Budgets, Order Approval, …)

### Was diese Session liefert vs. was später kommt

Die Orchestr-Handler-Schicht ist **token-basiert**: `queryHandler(token, fn)`
verlangt einen `QueryToken` (mit `entity` + Input-Schema), `actionHandler(token, fn)`
einen `ActionToken`. Für die B2B-Sellers-Entities (Employee, Offer, CostCenter,
Budget, …) existieren **noch keine** canonical Entity-Typen, Query-/Action-Tokens
oder Entity-Component-Tokens. Diese Token-/Typ-Definitionen werden bewusst in
einer **separaten Session mit Sebastian** nachgezogen.

Deshalb folgt der Aufbau exakt der **Schicht-Trennung von `app-actindo`** und
liefert in dieser Session nur die token-freien unteren Schichten:

| Schicht | Verzeichnis | Token nötig? | Diese Session |
| --- | --- | --- | --- |
| Wire-DTO-Typen | `server/types/` | nein | ✅ |
| HTTP-Client | `server/client/` | nein | ✅ |
| **Rohe API-Wrapper** | `server/queries/` | nein | ✅ |
| Middleware (Foundation) | `server/middleware/` | nein | ✅ |
| DTO→Canonical-Mapper | `server/*-helper/` | — | ⏭️ später |
| Token-gebundene Handler | `server/orchestr/` | **ja** | ⏭️ später (mit Sebastian) |

Der konkrete Token-/Typ-Bedarf wird am Ende der Integration in
**`REQUIREMENTS-ORCHESTR.md`** dokumentiert.

### Verifikation

Keine Demo-/Live-Installation verfügbar — Integration erfolgt „nackt" anhand
der Dokumentation und der Typdefinitionen. Grün-Kriterien dieser Session:

```bash
pnpm dev:prepare   # Stub-Build + Nuxt-Prepare (mit laioutrrc.ci.json-Mock)
pnpm lint          # ESLint (@laioutr/eslint-config/nuxt-module)
pnpm test          # Vitest (--passWithNoTests)
pnpm test:types    # vue-tsc TypeScript-Check
```

---

## Kernentscheidungen (nach Review)

| Aspekt | Alter Plan | Korrigiert |
| --- | --- | --- |
| **Paketname** | `@laioutr-app/b2bsellers` | **`@laioutr/app-b2bsellers`** (wie `@laioutr/app-actindo`; bereits in `main` gemerged) |
| **Runtime-Config-Key** | `@laioutr-app/b2bsellers` | **`@laioutr/app-b2bsellers`** (= `configKey` = Paketname; zentral in `const/index.ts` als `APP_CONFIG_KEY`) |
| **Client** | `@shopware/api-client` mit `rawRequest()` | `@shopware/api-client` **`createAPIClient<B2bSellersOperations>()` + `invoke()`** — **`rawRequest` existiert nicht** im SDK |
| **Frontend-Sections/Blocks** | registriert | **entfernt** (Backend-only) |
| **`@laioutr-app/ui` / `@nuxt/image`** | installiert | **entfernt** |
| **Option-Namen** | `endpoint` + `accessToken` | `endpoint` + `accessToken` (SDK: `baseURL` + `accessToken`) |
| **Orchestr-Handler** | ~91 Handler jetzt | **verschoben** — fehlen Tokens/Entities (Sebastian-Session) |

### SDK-Klärung (offene Frage des alten Plans gelöst)

`@shopware/api-client@1.5.0`:
- `createAPIClient<OPERATIONS>({ baseURL, accessToken, contextToken, defaultHeaders, fetchOptions })`
- Rückgabe: `{ invoke(opKey, params) → { data, status }, defaultHeaders, hook, updateBaseConfig, getBaseConfig }`
- **Kein `rawRequest`.** `invoke` ist strikt gegen den `OPERATIONS`-Generic typisiert.
- Operations-Map-Eintrag-Form:
  ```ts
  "<opName> <method> /<path>/{param}": {
    pathParams?: { param: string };
    query?: { … };
    headers?: { … };
    body?: { … };
    response: <DTO>;
    responseCode: <number>;
  }
  ```
- `invoke("<opName> <method> /<path>", { pathParams, query, body })`
- Context-Token-Rotation: SDK übernimmt `sw-context-token` automatisch (Hook
  `onContextChanged`) — wir lesen/schreiben den Cookie um den Request herum.

→ Für die B2B-Custom-Endpunkte definieren wir einen **eigenen Operations-Typ**
`B2bSellersOperations` und erzeugen `createAPIClient<B2bSellersOperations>(…)`.
baseURL = Shop-**Origin** (kein `/store-api`-Suffix), damit sowohl
`/store-api/...` als auch `/b2b/...` als volle Pfade auflösen.

---

## Verzeichnisstruktur (Ziel dieser Session)

```
src/
├── globalExtensions.ts            ← runtime-config key = @laioutr/app-b2bsellers  [bereits gemerged]
├── module.ts                      ← Backend-only umbauen
└── runtime/
    └── server/
        ├── const/
        │   ├── index.ts           ← APP_CONFIG_KEY + Limits/Defaults
        │   └── cookieKeys.ts      ← CONTEXT_TOKEN_COOKIE
        ├── client/
        │   ├── operations.ts      ← B2bSellersOperations (SDK-Operations-Map)
        │   ├── b2bSellersClient.ts ← createAPIClient<B2bSellersOperations> Factory + Typ
        │   └── useB2bSellersClient.ts ← Nitro-Auto-Import, Config aus APP_CONFIG_KEY + Context-Cookie
        ├── middleware/
        │   └── defineB2bSellers.ts ← Orchestr-Middleware (context.client) + Binder-Exports
        ├── types/
        │   ├── index.ts           ← Barrel
        │   ├── shared.ts          ← ShopwareListResponse, ShopwareMoney, ShopwareAuditFields, Criteria
        │   ├── employee.ts        ├── offer.ts            ├── customer.ts
        │   ├── customer-activity.ts ├── product-list.ts   ├── cost-center.ts
        │   ├── budget.ts          ├── order-approval.ts   ├── customer-product-number.ts
        │   └── product-subscription.ts (+ weitere nach Bedarf)
        └── queries/               ← rohe, typisierte invoke-Wrapper (token-frei)
            ├── customer.ts                customer-activity.ts   customer-activity-type.ts
            ├── customer-sales-ranking.ts  employee.ts            employee-order.ts
            ├── event-product.ts           offer.ts               offer-document.ts
            ├── offer-mail.ts              offer-status.ts        platform-cms.ts
            ├── product-list.ts           product-subscription.ts product-table-listing.ts
            ├── snippets.ts               login-targets.ts        cost-center.ts
            ├── customer-product-number.ts employee-budget.ts     order-approval.ts
            ├── pdp-variant-list.ts       product-request.ts      spare-parts.ts
            ├── sales-representative.ts    misc.ts
            └── index.ts                  ← Barrel
```

> **Entfällt** ggü. altem Plan / Starter-Template: `src/runtime/app/` (blocks,
> sections, image/providers, plugins) — Backend-only.
>
> **Verschoben** in die Sebastian-Session: `server/orchestr/<domain>/*.query.ts |
> *.action.ts | *.resolver.ts | *.link.ts`, `server/*-helper/` (Mapper),
> Token-Definitionen.

---

## Foundation — Code-Skizzen

### `src/runtime/server/const/index.ts`
```ts
// Single source of truth für den Runtime-Config-Namespace. Muss exakt dem
// Modul-configKey (= Paketname) entsprechen.
export const APP_CONFIG_KEY = '@laioutr/app-b2bsellers';

// Shopware-Listings-Defaults.
export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 500;
```

### `src/runtime/server/const/cookieKeys.ts`
```ts
/** Shopware Context-Token-Cookie (sw-context-token). */
export const CONTEXT_TOKEN_COOKIE = 'b2bs-ctx-token';
```

### `src/module.ts` (Backend-only)
```ts
export interface ModuleOptions {
  /** Base-URL (Shop-Origin) der B2B Sellers Store-API, z. B. https://shop.example.com */
  endpoint: string;
  /** Shopware Sales-Channel Access-Key (sw-access-key). Secret → nur private runtimeConfig. */
  accessToken: string;
}
export interface RuntimeConfigModulePublic {}        // bewusst leer (Secret nie an Client)
export interface RuntimeConfigModulePrivate extends ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: { name, version, configKey: name },
  defaults: { endpoint: '', accessToken: '' },
  async setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url);
    const resolveRuntimeModule = (p: string) => resolve('./runtime', p);

    nuxt.options.build.transpile.push(resolve('./runtime'));
    nuxt.options.runtimeConfig[name] = defu(nuxt.options.runtimeConfig[name] as …, _options);
    nuxt.options.runtimeConfig.public[name] = defu(nuxt.options.runtimeConfig.public[name] as …, {});

    addServerImportsDir(resolveRuntimeModule('server/client'));   // useB2bSellersClient als Nitro-Auto-Import

    await registerLaioutrApp({
      name,
      version,
      orchestrDirs: [resolveRuntimeModule('server/orchestr')],     // bleibt registriert (vorerst nur zodFix-Plugin)
    });                                                            // KEIN sections/blocks/nuxtImageProviders

    if (nuxt.options._prepare) {
      await installModule('@laioutr-core/frontend-core');
      await installModule('@laioutr-core/orchestr');
    }                                                              // KEIN @laioutr-app/ui / @nuxt/image
  },
});
```

### `src/runtime/server/client/b2bSellersClient.ts`
```ts
import { createAPIClient } from '@shopware/api-client';
import type { B2bSellersOperations } from './operations';

export interface B2bSellersClientConfig {
  baseUrl: string;        // Shop-Origin
  accessToken: string;    // sw-access-key
  contextToken?: string;  // sw-context-token (aus Cookie)
}

export type B2bSellersClient = ReturnType<typeof createB2bSellersClient>;

export function createB2bSellersClient(config: B2bSellersClientConfig) {
  return createAPIClient<B2bSellersOperations>({
    baseURL: config.baseUrl,
    accessToken: config.accessToken,
    contextToken: config.contextToken,
  });
}
```

### `src/runtime/server/client/useB2bSellersClient.ts`
```ts
import type { H3Event } from 'h3';
import { getCookie, useRuntimeConfig } from '#imports';
import { APP_CONFIG_KEY } from '../const';
import { CONTEXT_TOKEN_COOKIE } from '../const/cookieKeys';
import { type B2bSellersClient, createB2bSellersClient } from './b2bSellersClient';

export function useB2bSellersClient(event?: H3Event): B2bSellersClient {
  const config = useRuntimeConfig(event)[APP_CONFIG_KEY] as { endpoint?: string; accessToken?: string } | undefined;
  return createB2bSellersClient({
    baseUrl: config?.endpoint ?? '',
    accessToken: config?.accessToken ?? '',
    contextToken: event ? getCookie(event, CONTEXT_TOKEN_COOKIE) : undefined,
  });
}
```

### `src/runtime/server/middleware/defineB2bSellers.ts`
```ts
import { defineOrchestr } from '#imports';
import { useB2bSellersClient } from '../client/useB2bSellersClient';

export const defineB2bSellers = defineOrchestr
  .meta({ app: 'b2bsellers', label: 'B2B Sellers' })
  .extendRequest(async ({ event }) => ({ context: { client: useB2bSellersClient(event) } }));

// Binder für die spätere (Sebastian-)Handler-Schicht:
export const defineB2bSellersQuery = defineB2bSellers.queryHandler;
export const defineB2bSellersAction = defineB2bSellers.actionHandler;
export const defineB2bSellersLink = defineB2bSellers.linkHandler;
export const defineB2bSellersComponentResolver = defineB2bSellers.componentResolver;
```

### queries-Schicht-Muster (token-frei)
```ts
// queries/employee.ts
import type { B2bSellersClient } from '../client/b2bSellersClient';
import type { Employee, ShopwareListResponse } from '../types';

export function listEmployees(client: B2bSellersClient, body: { page?: number; limit?: number } = {}) {
  return client.invoke('listEmployees post /store-api/employees', { body });
  // → { data: ShopwareListResponse<Employee>, status }
}
```
Die Response-Typen kommen aus dem `B2bSellersOperations`-Eintrag des Endpunkts
(`client/operations.ts`), sodass `data` typisiert ist.

---

## Endpunkt-Inventar (queries-Schicht, ~91)

> Pfade unverändert aus der API-Recherche. Methode/Pfad/Präfix wie unten;
> jeder Endpunkt = eine typisierte `invoke`-Wrapper-Funktion in
> `queries/<domain>.ts` + ein Eintrag in `client/operations.ts`.

(Domains & Endpunkte: customer 3, customer-activity 5, customer-activity-type 3,
customer-sales-ranking 1, employee 8, employee-order 2, event-product 1, offer 4,
offer-document 1, offer-mail 2, offer-status 1, platform-cms 1, product-list 6,
product-subscription 3, product-table-listing 1, snippets 1, login-targets 1,
misc 4 — alle `/store-api`; cost-center 6, customer-product-number 4, spare-parts 1
— `/b2b`; employee-budget 11, order-approval 19 — gemischt. Vollständige
Pfadliste siehe Abschnitt „Endpunkt-Detailliste" unten.)

### Endpunkt-Detailliste

```
customer/                         (/store-api)
  search          POST /store-api/customers
  last-orders     POST /store-api/customer-last-orders
  prices          POST /store-api/customer-prices
customer-activity/                (/store-api)
  list            POST   /store-api/customer-activity/list
  get             GET    /store-api/customer-activity/{id}
  create          POST   /store-api/customer-activity
  update          PUT    /store-api/customer-activity/
  delete          DELETE /store-api/customer-activity/{id}
customer-activity-type/           (/store-api)
  list            POST   /store-api/customer-activity-type/list
  create          POST   /store-api/customer-activity-type
  delete          DELETE /store-api/customer-activity-type/{id}
customer-sales-ranking/           (/store-api)
  list            POST   /store-api/customer-sales-ranking
employee/                         (/store-api)
  list            POST   /store-api/employees
  get             GET    /store-api/employee/{id}
  create          POST   /store-api/employee
  add             POST   /store-api/employee/add
  update          PATCH  /store-api/employee/{id}
  delete          DELETE /store-api/employee/{id}
  roles           POST   /store-api/employee-roles
  permissions     POST   /store-api/employee-permissions
employee-order/                   (/store-api)
  list            POST   /store-api/employee-orders
  get             GET    /store-api/employee-order/{id}
event-product/                    (/store-api)
  list            POST   /store-api/event-products
offer/                            (/store-api)
  list            POST   /store-api/offer/list
  get             GET    /store-api/offer/{id}
  delete          DELETE /store-api/offer/{id}
  convert-to-order POST  /store-api/offer-order/{id}
offer-document/                   (/store-api)
  generate        POST   /store-api/offer-document/{id}
offer-mail/                       (/store-api)
  send            POST   /store-api/offer-mail/{id}
  templates       POST   /store-api/offer-mail-templates
offer-status/                     (/store-api)
  update          PATCH  /store-api/offer/{id}/status
platform-cms/                     (/store-api)
  get             POST   /store-api/platform-cms
product-list/                     (/store-api)
  list            POST   /store-api/product-lists
  create          POST   /store-api/product-lists/create
  get             GET    /store-api/product-lists/detail/{id}
  update          PATCH  /store-api/product-lists/{id}
  delete          DELETE /store-api/product-lists/{id}
  remove-product  DELETE /store-api/product-lists/product/{id}/{listId}
product-subscription/             (/store-api)
  list            POST   /store-api/product-subscription-list
  detail          GET    /store-api/product-subscription-list/{id}
  delete          DELETE /store-api/product-subscription/{id}
product-table-listing/            (/store-api)
  list            POST   /store-api/product-table-listing
snippets/                         (/store-api)
  get             POST   /store-api/snippets
login-targets/                    (/store-api)
  list            POST   /store-api/login-targets
misc/                             (/store-api)
  delivery-intervals  GET  /store-api/delivery-interval
  payment-conditions  POST /store-api/payment-conditions
  sales-statistics    POST /store-api/sales-statistics
  account-request     POST /store-api/account-request
cost-center/                      (/b2b)
  list   POST   /b2b/cost-center/list      get GET /b2b/cost-center/{id}
  create POST   /b2b/cost-center           update PUT /b2b/cost-center/{id}
  patch  PATCH  /b2b/cost-center/{id}      delete DELETE /b2b/cost-center/{id}
customer-product-number/          (/b2b)
  list   POST   /b2b/customer-product-numbers   create POST /b2b/customer-product-number
  delete DELETE /b2b/customer-product-number/{id} import POST /b2b/customer-product-number-import
spare-parts/                      (/b2b)
  similar-products POST /b2b/property-similar-products/{productId}
employee-budget/                  (gemischt)
  period-types       POST /store-api/budget-period-types
  approval-employees GET  /store-api/budget-approval-employees
  my-budgets         GET  /b2b/employee-budget
  list               POST /store-api/budget/list          (Criteria)
  get                GET  /store-api/budget/{id}
  create             POST /store-api/budget
  update             PUT  /store-api/budget/{id}
  patch              PATCH /store-api/budget/{id}
  delete             DELETE /store-api/budget/{id}
  orders             GET  /store-api/budget/{budgetId}/orders
  orders-filtered    POST /store-api/budget/{budgetId}/orders (Criteria)
order-approval/                   (gemischt)
  list               POST   /store-api/order-approval/list   (Criteria)
  get                GET    /b2b/order-approval/{id}
  activity           GET    /b2b/order-approval/{id}/activity
  approvers          GET    /b2b/order-approval/{id}/approvers
  budget-summary     GET    /b2b/order-approval/budget/{budgetId}/summary
  count-pending      GET    /b2b/order-approval/settings/count-pending
  customer-settings(get)  GET  /b2b/order-approval/customer-settings
  customer-settings(set)  POST /b2b/order-approval/customer-settings
  create             POST   /store-api/order-approval/create
  approve            POST   /b2b/order-approval/{id}/approve
  decline            POST   /b2b/order-approval/{id}/decline
  execute            POST   /b2b/order-approval/{id}/execute
  refresh            POST   /b2b/order-approval/{id}/refresh
  update             POST   /b2b/order-approval/{id}/update
  remind             POST   /b2b/order-approval/{id}/remind
  remind-all         POST   /b2b/order-approval/{id}/remind/all
  update-pending     POST   /b2b/order-approval/settings/update-pending
  update-line-item   PATCH  /b2b/order-approval/{id}/line-items/{lineItemId}
  delete-line-item   POST   /b2b/order-approval/{id}/line-items/{lineItemId}/delete
pdp-variant-list/                 (/store-api)
  list   POST   /store-api/variant-list/{productId}   (Criteria)
product-request/                  (/store-api)
  send   POST   /store-api/product-request/{productId}/send
sales-representative/             (/store-api)
  fast-order POST /store-api/sales-representative/fast-order
```

---

## Implementierungsreihenfolge (diese Session)

1. **Foundation** — `module.ts` (Backend-only), `const/index.ts`, `const/cookieKeys.ts`, `src/runtime/app/` entfernen, `@laioutr-app/ui` devDep raus.
2. **Client** — `client/operations.ts` (Operations-Map), `client/b2bSellersClient.ts`, `client/useB2bSellersClient.ts`, `middleware/defineB2bSellers.ts`.
3. **Types** — `types/shared.ts` + Domain-Typen.
4. **queries-Schicht** — `queries/<domain>.ts` für alle ~91 Endpunkte (+ Barrel).
5. **Verify** — `dev:prepare` / `lint` / `test` / `test:types` grün.
6. **`REQUIREMENTS-ORCHESTR.md`** — Token-/Typ-/Mapper-Bedarf für die Sebastian-Session.

---

## Offene Punkte für die Sebastian-Session (→ REQUIREMENTS-ORCHESTR.md)

- **Canonical Entity-Typen** für B2B-Entities (Employee, Offer, CostCenter, Budget, OrderApproval, ProductList, …) — gibt es passende in `@laioutr-core/canonical-types`, oder müssen neue definiert werden?
- **QueryTokens** (`defineQueryToken`) je Listen-/Detail-Query (entity, type multi|single, input-Zod, label).
- **ActionTokens** (`defineActionToken`) je Mutation (input/output-Zod), namespaced `@laioutr/app-b2bsellers/<domain>/<action>`.
- **Entity-Component-Tokens** (`defineEntityComponentToken`) + Component-Resolver je Entity.
- **DTO→Canonical-Mapper** (`server/*-helper/`).
- **Context-Token-Lifecycle**: Cookie-Set-Strategie beim Rotations-Hook `onContextChanged` (onRequest-Phase, nicht in `extendRequest`).
- **Criteria-Endpunkte**: einheitliches Shopware-`Criteria`-Input-Schema (filter/sort/associations/aggregations) für die `(Criteria)`-markierten Endpunkte.
```
