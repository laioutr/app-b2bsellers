# Plan: B2B Sellers Store API Wrapper — `@laioutr-app/b2bsellers`

## Context

Das Repository `laioutr/app-b2bsellers` wurde aus dem `laioutr/app-starter` Template erzeugt und enthält noch Platzhalter (`my-laioutr-app`). Es soll die B2B Sellers Store API (Shopware 6 Plugin) kapseln.

**Referenz-Implementierung:** `laioutr/app-shopware` — ebenfalls Shopware 6 basiert, verwendete Patterns werden direkt übernommen.

**Kernentscheidung:** Verwende `@shopware/api-client` (wie `app-shopware`) statt einer manuellen fetch-Implementierung. Das SDK übernimmt automatisch `sw-access-key`, `sw-context-token`-Management und Token-Rotation. B2B-spezifische Endpunkte werden per `client.rawRequest()` oder als typisierte Erweiterungen aufgerufen.

**Zwei Route-Präfixe:**
- `/store-api/...` — Core-Endpunkte des B2B Sellers Plugins (Employee, Offer, Product List, Customer Activity, ...)
- `/b2b/...` — Addon-Endpunkte (Cost Center, Customer Product Numbers, Employee Budgets, Order Approval, ...)

---

## Repository

**Ziel-Repo:** `https://github.com/laioutr/app-b2bsellers`

---

## Was bereits vorhanden ist (aus app-starter Template)

```
src/
├── globalExtensions.ts    ← name noch "my-laioutr-app"
├── module.ts              ← Platzhalter, ModuleOptions leer
└── runtime/
    ├── app/
    │   ├── blocks/        ← leer (für UI-Blöcke)
    │   └── sections/      ← leer (für UI-Sektionen)
    └── server/
        ├── orchestr/      ← leer
        └── tsconfig.json
build.config.ts            ← bereits korrekte Externals
package.json               ← name "my-laioutr-app"
```

---

## Anzupassende bestehende Dateien

### `package.json`
Name + Description setzen, `@shopware/api-client` als Dependency hinzufügen:
```json
{
  "name": "@laioutr-app/b2bsellers",
  "version": "1.0.0",
  "description": "B2B Sellers Store API integration for laioutr.",
  "dependencies": {
    "@nuxt/kit": "3.16.2",
    "@shopware/api-client": "^1.2.1",
    "zod": "3.25.61"
  },
  "peerDependencies": {
    "@laioutr-core/canonical-types": ">=0.22.13",
    "@laioutr-core/core-types": ">=0.28.8",
    "@laioutr-core/frontend-core": ">=0.28.8"
  }
}
```

### `src/globalExtensions.ts`
Modulname von `my-laioutr-app` auf `@laioutr-app/b2bsellers` ändern:
```typescript
declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    ['@laioutr-app/b2bsellers']: RuntimeConfigModulePublic;
  }
  interface RuntimeConfig {
    ['@laioutr-app/b2bsellers']: RuntimeConfigModulePrivate;
  }
}
```

### `src/module.ts`
Template befüllen — analog zu `app-shopware/src/module.ts`:
```typescript
export interface ModuleOptions {
  /** Base URL der B2B Sellers Store API, z.B. https://shop.example.com */
  endpoint: string;
  /** Shopware Sales-Channel Access Key (sw-access-key Header) */
  accessToken: string;
}

export interface RuntimeConfigModulePublic {}
export interface RuntimeConfigModulePrivate extends ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: { name, version, configKey: name },
  defaults: { endpoint: 'https://shop.example.com', accessToken: '' },
  async setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url);
    const resolveRuntimeModule = (path: string) => resolve('./runtime', path);

    nuxt.options.build.transpile.push(resolve('./runtime'));
    nuxt.options.runtimeConfig[name] = defu(nuxt.options.runtimeConfig[name], _options);
    nuxt.options.runtimeConfig.public[name] = defu(nuxt.options.runtimeConfig.public[name], _options);

    await registerLaioutrApp({
      name,
      version,
      orchestrDirs: [resolveRuntimeModule('server/orchestr')],
      sections: [resolveRuntimeModule('app/sections')],
      blocks: [resolveRuntimeModule('app/blocks')],
    });

    if (nuxt.options._prepare) {
      await installModule('@nuxt/image');
      await installModule('@laioutr-core/frontend-core');
      await installModule('@laioutr-core/orchestr');
      await installModule('@laioutr-app/ui');
    }
  },
});
```

**Hinweis:** `endpoint` + `accessToken` statt `apiURL` + `accessKey` — konsistent mit `app-shopware`.

### `build.config.ts`
Bereits korrekt vom Template — keine Änderung nötig:
```typescript
externals: ['defu', '@parcel/watcher', '@laioutr-core/frontend-core', '@laioutr-core/kit']
```

---

## Neu zu erstellende Dateien

### Verzeichnisstruktur

```
src/runtime/server/
├── client/
│   └── index.ts                   ← @shopware/api-client Factory (analog app-shopware)
├── const/
│   └── cookieKeys.ts              ← CONTEXT_TOKEN_COOKIE (naming wie app-shopware)
├── middleware/
│   └── defineB2bSellers.ts        ← Orchestr Middleware
├── types/
│   ├── index.ts                   ← Barrel-Export
│   ├── b2bsellers.ts              ← B2B-spezifische Shopware-Erweiterungen
│   ├── shared.ts                  ← ShopwareListResponse, ShopwareMoney, ShopwareAuditFields, Criteria
│   ├── employee.ts                ← Employee, EmployeeRole, EmployeePermission, EmployeeOrder
│   ├── offer.ts                   ← Offer, OfferLineItem, OfferMailTemplate, OfferStatus
│   ├── customer.ts                ← B2bCustomer, CustomerLastOrder, CustomerPrice, CustomerSalesRanking
│   ├── customer-activity.ts       ← CustomerActivity, CustomerActivityType
│   ├── product-list.ts            ← ProductList, ProductListItem
│   ├── cost-center.ts             ← CostCenter
│   ├── customer-product-number.ts ← CustomerProductNumber
│   ├── budget.ts                  ← Budget, BudgetPeriodType, BudgetOrder, BudgetOrderData
│   ├── order-approval.ts          ← OrderApproval, ApproverStatus, OrderApprovalSettings, ActivityEntry
│   ├── product-subscription.ts    ← ProductSubscription
│   └── platform-cms.ts            ← PlatformCmsPage
└── orchestr/
    ├── customer/
    │   ├── search.query.ts              POST /store-api/customers
    │   ├── last-orders.query.ts         POST /store-api/customer-last-orders
    │   └── prices.query.ts              POST /store-api/customer-prices
    ├── customer-activity/
    │   ├── list.query.ts                POST /store-api/customer-activity/list
    │   ├── get.query.ts                 GET  /store-api/customer-activity/{id}
    │   ├── create.action.ts             POST /store-api/customer-activity
    │   ├── update.action.ts             PUT  /store-api/customer-activity/
    │   └── delete.action.ts             DELETE /store-api/customer-activity/{id}
    ├── employee/
    │   ├── list.query.ts                POST /store-api/employees
    │   ├── get.query.ts                 GET  /store-api/employee/{id}
    │   ├── create.action.ts             POST /store-api/employee
    │   ├── add.action.ts                POST /store-api/employee/add
    │   ├── update.action.ts             PATCH /store-api/employee/{id}
    │   ├── delete.action.ts             DELETE /store-api/employee/{id}
    │   ├── roles.query.ts               POST /store-api/employee-roles
    │   └── permissions.query.ts         POST /store-api/employee-permissions
    ├── offer/
    │   ├── list.query.ts                POST /store-api/offer/list
    │   ├── get.query.ts                 GET  /store-api/offer/{id}
    │   ├── delete.action.ts             DELETE /store-api/offer/{id}
    │   └── convert-to-order.action.ts   POST /store-api/offer-order/{id}
    ├── product-list/
    │   ├── list.query.ts                POST /store-api/product-lists
    │   ├── create.action.ts             POST /store-api/product-lists/create
    │   ├── get.query.ts                 GET  /store-api/product-lists/detail/{id}
    │   ├── update.action.ts             PATCH /store-api/product-lists/{id}
    │   ├── delete.action.ts             DELETE /store-api/product-lists/{id}
    │   └── remove-product.action.ts     DELETE /store-api/product-lists/product/{id}/{listId}
    ├── customer-activity-type/
    │   ├── list.query.ts                POST /store-api/customer-activity-type/list
    │   ├── create.action.ts             POST /store-api/customer-activity-type
    │   └── delete.action.ts             DELETE /store-api/customer-activity-type/{id}
    ├── customer-sales-ranking/
    │   └── list.query.ts                POST /store-api/customer-sales-ranking
    ├── employee-order/
    │   ├── list.query.ts                POST /store-api/employee-orders
    │   └── get.query.ts                 GET  /store-api/employee-order/{id}
    ├── event-product/
    │   └── list.query.ts                POST /store-api/event-products
    ├── offer-document/
    │   └── generate.action.ts           POST /store-api/offer-document/{id}
    ├── offer-mail/
    │   ├── send.action.ts               POST /store-api/offer-mail/{id}
    │   └── templates.query.ts           POST /store-api/offer-mail-templates
    ├── offer-status/
    │   └── update.action.ts             PATCH /store-api/offer/{id}/status
    ├── platform-cms/
    │   └── get.query.ts                 POST /store-api/platform-cms
    ├── product-table-listing/
    │   └── list.query.ts                POST /store-api/product-table-listing
    ├── product-subscription/
    │   ├── list.query.ts                POST /store-api/product-subscription-list
    │   ├── detail.query.ts              GET  /store-api/product-subscription-list/{id}
    │   └── delete.action.ts             DELETE /store-api/product-subscription/{id}
    ├── snippets/
    │   └── get.query.ts                 POST /store-api/snippets
    ├── login-targets/
    │   └── list.query.ts                POST /store-api/login-targets
    ├── cost-center/                     ← /b2b/ prefix
    │   ├── list.query.ts                POST   /b2b/cost-center/list
    │   ├── get.query.ts                 GET    /b2b/cost-center/{id}
    │   ├── create.action.ts             POST   /b2b/cost-center
    │   ├── update.action.ts             PUT    /b2b/cost-center/{id}
    │   ├── patch.action.ts              PATCH  /b2b/cost-center/{id}
    │   └── delete.action.ts             DELETE /b2b/cost-center/{id}
    ├── customer-product-number/        ← /b2b/ prefix
    │   ├── list.query.ts                POST   /b2b/customer-product-numbers
    │   ├── create.action.ts             POST   /b2b/customer-product-number
    │   ├── delete.action.ts             DELETE /b2b/customer-product-number/{id}
    │   └── import.action.ts             POST   /b2b/customer-product-number-import
    ├── employee-budget/                ← gemischte Präfixe
    │   ├── period-types.query.ts        POST   /store-api/budget-period-types
    │   ├── approval-employees.query.ts  GET    /store-api/budget-approval-employees
    │   ├── my-budgets.query.ts          GET    /b2b/employee-budget
    │   ├── list.query.ts                POST   /store-api/budget/list           (Criteria)
    │   ├── get.query.ts                 GET    /store-api/budget/{id}
    │   ├── create.action.ts             POST   /store-api/budget
    │   ├── update.action.ts             PUT    /store-api/budget/{id}
    │   ├── patch.action.ts              PATCH  /store-api/budget/{id}
    │   ├── delete.action.ts             DELETE /store-api/budget/{id}
    │   ├── orders.query.ts              GET    /store-api/budget/{budgetId}/orders
    │   └── orders-filtered.query.ts     POST   /store-api/budget/{budgetId}/orders (Criteria)
    ├── order-approval/                 ← gemischte Präfixe
    │   ├── list.query.ts                POST   /store-api/order-approval/list          (Criteria)
    │   ├── get.query.ts                 GET    /b2b/order-approval/{id}
    │   ├── activity.query.ts            GET    /b2b/order-approval/{id}/activity
    │   ├── approvers.query.ts           GET    /b2b/order-approval/{id}/approvers
    │   ├── budget-summary.query.ts      GET    /b2b/order-approval/budget/{budgetId}/summary
    │   ├── count-pending.query.ts       GET    /b2b/order-approval/settings/count-pending
    │   ├── customer-settings.query.ts   GET    /b2b/order-approval/customer-settings
    │   ├── customer-settings.action.ts  POST   /b2b/order-approval/customer-settings
    │   ├── create.action.ts             POST   /store-api/order-approval/create
    │   ├── approve.action.ts            POST   /b2b/order-approval/{id}/approve
    │   ├── decline.action.ts            POST   /b2b/order-approval/{id}/decline
    │   ├── execute.action.ts            POST   /b2b/order-approval/{id}/execute
    │   ├── refresh.action.ts            POST   /b2b/order-approval/{id}/refresh
    │   ├── update.action.ts             POST   /b2b/order-approval/{id}/update
    │   ├── remind.action.ts             POST   /b2b/order-approval/{id}/remind
    │   ├── remind-all.action.ts         POST   /b2b/order-approval/{id}/remind/all
    │   ├── update-pending.action.ts     POST   /b2b/order-approval/settings/update-pending
    │   ├── update-line-item.action.ts   PATCH  /b2b/order-approval/{id}/line-items/{lineItemId}
    │   └── delete-line-item.action.ts   POST   /b2b/order-approval/{id}/line-items/{lineItemId}/delete
    ├── pdp-variant-list/
    │   └── list.query.ts                POST   /store-api/variant-list/{productId}   (Criteria)
    ├── product-request/
    │   └── send.action.ts               POST   /store-api/product-request/{productId}/send
    ├── sales-representative-fast-order/
    │   └── create.action.ts             POST   /store-api/sales-representative/fast-order
    ├── spare-parts/                    ← /b2b/ prefix
    │   └── similar-products.query.ts    POST   /b2b/property-similar-products/{productId}
    └── misc/
        ├── delivery-intervals.query.ts  GET  /store-api/delivery-interval
        ├── payment-conditions.query.ts  POST /store-api/payment-conditions
        ├── sales-statistics.query.ts    POST /store-api/sales-statistics
        └── account-request.action.ts    POST /store-api/account-request
```

---

## Schlüsseldateien — Code

### `src/runtime/server/const/cookieKeys.ts`
```typescript
/** Shopware Context Token Cookie (sw-context-token) */
export const CONTEXT_TOKEN_COOKIE = 'b2bs-ctx-token';
```

### `src/runtime/server/client/index.ts`
Direkt analog zu `app-shopware/shopwareClientFactory.ts`:
```typescript
import { createAPIClient } from '@shopware/api-client';
import { getCookie, useRuntimeConfig } from '#imports';
import type { OrchestrArgsBase } from '#orchestr/types/builder/Args';
import { CONTEXT_TOKEN_COOKIE } from '../const/cookieKeys';

// Shopware client type is not exported
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: ignore not portable type TS2742
export const b2bSellersClientFactory = (event: OrchestrArgsBase['event']) => {
  const config = useRuntimeConfig()['@laioutr-app/b2bsellers'];
  const contextToken = getCookie(event, CONTEXT_TOKEN_COOKIE);

  const client = createAPIClient({
    baseURL: config.endpoint,
    accessToken: config.accessToken,
    contextToken,
  });

  return client;
};
```

**Vorteil:** `@shopware/api-client` übernimmt automatisch:
- `sw-access-key` Header aus `accessToken`
- `sw-context-token` Header aus `contextToken`
- Token-Rotation bei Antworten

### `src/runtime/server/middleware/defineB2bSellers.ts`
```typescript
import { defineOrchestr } from '#imports';
import { name } from '../../../../package.json';
import { b2bSellersClientFactory } from '../client';

export const defineB2bSellers = defineOrchestr
  .meta({ app: name })
  .extendRequest(async ({ event }) => {
    const b2bSellersClient = b2bSellersClientFactory(event);
    return { context: { b2bSellersClient } };
  });

export const defineB2bSellersAction = defineB2bSellers.actionHandler;
export const defineB2bSellersQuery = defineB2bSellers.queryHandler;
export const defineB2bSellersLink = defineB2bSellers.linkHandler;
export const defineB2bSellersComponentResolver = defineB2bSellers.componentResolver;

export default () => {};
```

### TypeScript Typen

**`types/shared.ts`** — Shopware List Response Envelope:
```typescript
export interface ShopwareListResponse<T> {
  elements: T[];
  total: number;
  page: number;
  limit: number;
}
export interface ShopwareMoney {
  currencyId: string;
  net: number;
  gross: number;
  taxRate?: number;
}
export interface ShopwareAuditFields {
  id: string;
  createdAt: string;
  updatedAt: string | null;
}
```

**`types/employee.ts`**:
```typescript
import type { ShopwareAuditFields } from './shared';
export interface EmployeeRole extends ShopwareAuditFields {
  name: string;
  description: string | null;
  permissions: string[];
}
export interface Employee extends ShopwareAuditFields {
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  customerId: string;
  roleId: string | null;
  role: EmployeeRole | null;
}
export interface EmployeePermission {
  key: string;
  name: string;
  group: string;
}
```

**`types/offer.ts`**:
```typescript
import type { ShopwareAuditFields, ShopwareMoney } from './shared';
export interface OfferLineItem {
  id: string;
  productId: string;
  label: string;
  quantity: number;
  unitPrice: ShopwareMoney;
  totalPrice: ShopwareMoney;
}
export interface Offer extends ShopwareAuditFields {
  offerNumber: string;
  state: 'open' | 'accepted' | 'declined' | 'expired';
  validUntil: string | null;
  customerId: string;
  lineItems: OfferLineItem[];
  price: ShopwareMoney;
  comment: string | null;
}
```

**`types/customer-activity.ts`**:
```typescript
import type { ShopwareAuditFields } from './shared';
export type CustomerActivityType = 'note' | 'call' | 'email' | 'meeting' | 'task';
export interface CustomerActivity extends ShopwareAuditFields {
  customerId: string;
  type: CustomerActivityType;
  subject: string;
  body: string | null;
  dueDate: string | null;
  done: boolean;
  employeeId: string | null;
}
```

**`types/product-list.ts`**:
```typescript
import type { ShopwareAuditFields } from './shared';
export interface ProductListItem {
  id: string;
  productListId: string;
  productId: string;
  quantity: number;
  note: string | null;
  createdAt: string;
}
export interface ProductList extends ShopwareAuditFields {
  name: string;
  customerId: string;
  isPublic: boolean;
  items: ProductListItem[];
  itemCount: number;
}
```

**`types/customer.ts`**:
```typescript
import type { ShopwareAuditFields, ShopwareMoney } from './shared';
export interface B2bCustomer extends ShopwareAuditFields {
  customerNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  vatIds: string[];
  active: boolean;
  groupId: string;
}
export interface CustomerLastOrder extends ShopwareAuditFields {
  orderNumber: string;
  amountTotal: number;
  currencyId: string;
  stateName: string;
}
export interface CustomerPrice {
  productId: string;
  price: ShopwareMoney;
  quantityStart: number;
  quantityEnd: number | null;
}
```

### Orchestr Handler Muster

B2B-Endpunkte werden über `client.rawRequest()` (oder analog) aufgerufen, da sie nicht im Standard-Shopware SDK-Typ enthalten sind:

```typescript
// employee/list.query.ts
import { z } from 'zod';
import { defineB2bSellersQuery } from '../../middleware/defineB2bSellers';
import type { Employee, ShopwareListResponse } from '../../types';

export default defineB2bSellersQuery(
  z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(500).default(25),
  }),
  async ({ context, input }) => {
    const data = await context.b2bSellersClient.rawRequest<ShopwareListResponse<Employee>>({
      method: 'POST',
      url: '/store-api/employees',
      body: { page: input.page, limit: input.limit },
    });
    return { items: data.elements, total: data.total };
  }
);
```

**Falls `rawRequest` nicht verfügbar:** Alternativ fetch-Wrapper parallel zum SDK-Client (mit denselben Headers aus dem SDK extrahiert).

---

## Wichtige Unterschiede zu ursprünglichem Plan

| Aspekt | Ursprünglich | Korrekt (nach app-shopware + app-starter) |
|--------|-------------|------------------------------------------|
| Client | Manueller fetch-Wrapper | `@shopware/api-client` (wie app-shopware) |
| Option-Namen | `apiURL` + `accessKey` | `endpoint` + `accessToken` (wie app-shopware) |
| Const-Datei | `keys.ts` | `cookieKeys.ts` (wie app-shopware) |
| Cookie-Name-Export | `B2B_CONTEXT_TOKEN_COOKIE` | `CONTEXT_TOKEN_COOKIE` |
| build.config externals | nur `defu` | + `@parcel/watcher`, `@laioutr-core/frontend-core`, `@laioutr-core/kit` |
| registerLaioutrApp | nur orchestrDirs | + sections + blocks |
| installModule | nur frontend-core | + orchestr + @laioutr-app/ui + @nuxt/image |
| Dependencies-Typ | alle als dependencies | core Laioutr = peerDependencies |
| Export `defineB2bSellersLink` | fehlte | hinzugefügt (analog defineShopwareLink) |

---

## Endpunkt-Übersicht (Gesamt)

| Domain | Routen-Präfix | Endpunkte |
|--------|--------------|-----------|
| customer | /store-api | 3 |
| customer-activity | /store-api | 5 |
| customer-activity-type | /store-api | 3 |
| customer-sales-ranking | /store-api | 1 |
| employee | /store-api | 8 |
| employee-order | /store-api | 2 |
| event-product | /store-api | 1 |
| offer | /store-api | 4 |
| offer-document | /store-api | 1 |
| offer-mail | /store-api | 2 |
| offer-status | /store-api | 1 |
| platform-cms | /store-api | 1 |
| product-list | /store-api | 6 |
| product-subscription | /store-api | 3 |
| product-table-listing | /store-api | 1 |
| snippets | /store-api | 1 |
| login-targets | /store-api | 1 |
| misc | /store-api | 4 |
| cost-center | /b2b | 6 |
| customer-product-number | /b2b | 4 |
| employee-budget | /store-api + /b2b | 11 |
| order-approval | /store-api + /b2b | 19 |
| pdp-variant-list | /store-api | 1 |
| product-request | /store-api | 1 |
| sales-representative-fast-order | /store-api | 1 |
| spare-parts | /b2b | 1 |
| **Gesamt** | | **~91 Endpunkte** |

---

## Implementierungsreihenfolge

1. `package.json` — Name + `@shopware/api-client` Dependency
2. `src/globalExtensions.ts` — Modulname korrigieren
3. `src/module.ts` — ModuleOptions + Setup befüllen
4. `src/runtime/server/const/cookieKeys.ts`
5. `src/runtime/server/types/*.ts` (13 Dateien)
6. `src/runtime/server/client/index.ts`
7. `src/runtime/server/middleware/defineB2bSellers.ts`
8. Alle Orchestr-Handler (~91 Dateien in 26 Domains)
9. Commit + Push im Repo `laioutr/app-b2bsellers` auf Branch `claude/b2b-sellers-api-wrapper-o4jFE`

---

## Offene Frage vor Implementierung

**`client.rawRequest()`:** Prüfen ob `@shopware/api-client` eine Methode für rohe/nicht-typisierte Endpunkte anbietet (z.B. `.rawRequest()`, `._request()`, oder ein generisches `invoke()`). Falls nicht → separate fetch-Hilfsfunktion die dieselben Headers aus dem SDK-Client übernimmt.

---

## Verifikation

```bash
pnpm install
pnpm dev:prepare   # Stub-Build + Nuxt-Prepare
pnpm lint          # ESLint (@laioutr/eslint-config/nuxt-module)
pnpm test          # Vitest
pnpm test:types    # vue-tsc TypeScript-Check
```

Für Live-Test: `.env` in `playground/` mit echtem Shopware/B2B Sellers Endpoint + Access Key → `pnpm dev`.
