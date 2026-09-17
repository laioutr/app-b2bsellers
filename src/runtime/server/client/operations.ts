/**
 * Custom `@shopware/api-client` operations map for the B2B Sellers Store API.
 *
 * The B2B Sellers endpoints are NOT part of the SDK's generated Shopware
 * operations, so we describe them here and pass this type as the
 * `createAPIClient<B2bSellersOperations>(...)` generic. Each entry's shape:
 *
 * ```ts
 * "<opName> <method> /<path>/{param}": {
 *   pathParams?: { param: string };
 *   query?: Record<string, unknown>;
 *   body?: unknown;
 *   response: <DTO>;
 *   responseCode: number;
 * }
 * ```
 *
 * `client.invoke("<opName> <method> /<path>", { pathParams, query, body })`
 * then returns `{ data: <DTO>, status: <responseCode> }`.
 *
 * baseURL is the shop **origin**, so every path carries its full `/store-api`
 * prefix. There are three route families underneath it:
 *
 * - `/store-api/...`                      — core plugin routes
 * - `/store-api/b2b/...`                  — company routes (employee, budget,
 *                                           cost center, order approval)
 * - `/store-api/sales-representative/...` — sales-rep routes (customers,
 *                                           activities, statistics)
 *
 * Verified on 2026-09-17 against `https://laioutr.demoshop.b2b-sellers.com`
 * (Shopware 6.7.6.2) — its OpenAPI document, the v4 vendor documentation and
 * live probes. See `docs/reviews/2026-09-17-store-api-verification.md`.
 *
 * Note that every route except the auth ones below answers 403 without a
 * customer session, so `login` has to run before anything else is reachable.
 */
import type {
  B2bCustomer,
  Budget,
  BudgetOrder,
  BudgetPeriodTypeOption,
  CostCenter,
  CustomerActivity,
  CustomerActivityType,
  CustomerLastOrder,
  CustomerPrice,
  CustomerProductNumber,
  CustomerSalesRankingEntry,
  Employee,
  EmployeeOrder,
  EmployeePermission,
  EmployeeRole,
  Offer,
  OrderApproval,
  OrderApprovalActivityEntry,
  OrderApprovalApprover,
  OrderApprovalSettings,
  ProductList,
  ShopwareCriteria,
  ShopwareListResponse,
} from '../types';

export interface ListBody {
  page?: number;
  limit?: number;
}
type Body = Record<string, unknown>;
type Ok<T> = { response: T; responseCode: 200 };

// ── /store-api: authentication ────────────────────────────────────────────
// The context token the shop returns here is what every other route needs.
type AuthOperations = {
  'login post /store-api/account/login': { body: { username: string; password: string } } & Ok<{ contextToken: string }>;
  'logout post /store-api/account/logout': Ok<{ contextToken?: string }>;
  'getContext get /store-api/context': Ok<Record<string, unknown>>;
  'getCurrentCustomer post /store-api/account/customer': { body?: ShopwareCriteria } & Ok<B2bCustomer>;
};

// ── /store-api: customer pricing ──────────────────────────────────────────
type CustomerOperations = {
  'customerPrices post /store-api/customer-prices': { body?: Body } & Ok<ShopwareListResponse<CustomerPrice>>;
};

// ── /store-api: offer ─────────────────────────────────────────────────────
// `updateOffer` is how an offer's status changes; there is no status route.
type OfferOperations = {
  'listOffers post /store-api/offer/list': { body?: ShopwareCriteria } & Ok<ShopwareListResponse<Offer>>;
  'getOffer get /store-api/offer/{id}': { pathParams: { id: string } } & Ok<Offer>;
  'updateOffer put /store-api/offer/{id}': { pathParams: { id: string }; body: Body } & Ok<Offer>;
  'convertOfferToOrder post /store-api/offer-order/{id}': { pathParams: { id: string }; body?: Body } & Ok<Record<string, unknown>>;
  'generateOfferDocument get /store-api/offer-document/{id}': { pathParams: { id: string } } & Ok<Record<string, unknown>>;
  'sendOfferMail post /store-api/offer-mail/{id}': { pathParams: { id: string }; body?: Body } & Ok<Record<string, unknown>>;
  'listOfferStates post /store-api/offer-states': { body?: ShopwareCriteria } & Ok<ShopwareListResponse<Record<string, unknown>>>;
};

// ── /store-api: product-list ──────────────────────────────────────────────
type ProductListOperations = {
  'listProductLists post /store-api/product-lists': { body?: ShopwareCriteria } & Ok<ShopwareListResponse<ProductList>>;
  'createProductList post /store-api/product-lists/create': { body: Body } & Ok<ProductList>;
  'getProductList get /store-api/product-lists/{id}': { pathParams: { id: string } } & Ok<ProductList>;
  'updateProductList patch /store-api/product-lists/{id}': { pathParams: { id: string }; body: Body } & Ok<ProductList>;
  'deleteProductList delete /store-api/product-lists/{id}': { pathParams: { id: string } } & Ok<Record<string, unknown>>;
  'removeProductListProduct delete /store-api/product-lists/{id}/product/{productId}': {
    pathParams: { id: string; productId: string };
  } & Ok<Record<string, unknown>>;
};

// ── /store-api: catalog + misc ────────────────────────────────────────────
type CatalogMiscOperations = {
  'productTableListing post /store-api/product-table-listing': { body?: Body } & Ok<ShopwareListResponse<Record<string, unknown>>>;
  'pdpVariantList post /store-api/variant-list/{productId}': { pathParams: { productId: string }; body?: ShopwareCriteria } & Ok<
    ShopwareListResponse<Record<string, unknown>>
  >;
  'sendProductRequest post /store-api/product-request/{productId}/send': { pathParams: { productId: string }; body: Body } & Ok<
    Record<string, unknown>
  >;
  'salesRepFastOrder post /store-api/sales-representative/fast-order': { body?: Body } & Ok<Record<string, unknown>>;
  'getSnippets get /store-api/snippets': Ok<Record<string, string>>;
  'listLoginTargets get /store-api/login-targets': Ok<ShopwareListResponse<Record<string, unknown>>>;
  'getPlatformCms get /store-api/platform-cms/{id}': { pathParams: { id: string } } & Ok<Record<string, unknown>>;
  'accountRequest post /store-api/account-request': { body: Body } & Ok<Record<string, unknown>>;
};

// ── /store-api/b2b: employee ──────────────────────────────────────────────
type EmployeeOperations = {
  'listEmployees post /store-api/b2b/employees': { body?: ListBody } & Ok<ShopwareListResponse<Employee>>;
  'getEmployee get /store-api/b2b/employee/{id}': { pathParams: { id: string } } & Ok<Employee>;
  'createEmployee post /store-api/b2b/employee': { body?: Body } & Ok<Employee>;
  'addEmployee post /store-api/b2b/employee/add': { body?: { email: string; roleId?: string } } & Ok<Employee>;
  'updateEmployee patch /store-api/b2b/employee/{id}': { pathParams: { id: string }; body?: Body } & Ok<Employee>;
  'deleteEmployee delete /store-api/b2b/employee/{id}': { pathParams: { id: string } } & Ok<Record<string, unknown>>;
  'listEmployeeRoles post /store-api/b2b/employee-roles': { body?: ListBody } & Ok<ShopwareListResponse<EmployeeRole>>;
  'listEmployeePermissions post /store-api/b2b/employee-permissions': { body?: ListBody } & Ok<ShopwareListResponse<EmployeePermission>>;
};

// ── /store-api/b2b: employee-order ────────────────────────────────────────
type EmployeeOrderOperations = {
  'listEmployeeOrders post /store-api/b2b/employee-orders': { body?: ListBody } & Ok<ShopwareListResponse<EmployeeOrder>>;
  'getEmployeeOrder get /store-api/b2b/employee-order/{id}': { pathParams: { id: string } } & Ok<EmployeeOrder>;
};

// ── /store-api/b2b: cost-center ───────────────────────────────────────────
type CostCenterOperations = {
  'listCostCenters post /store-api/b2b/cost-center/list': { body?: ShopwareCriteria } & Ok<ShopwareListResponse<CostCenter>>;
  'getCostCenter get /store-api/b2b/cost-center/{CostCenterId}': { pathParams: { CostCenterId: string } } & Ok<CostCenter>;
  'createCostCenter post /store-api/b2b/cost-center': { body: Body } & Ok<CostCenter>;
  'updateCostCenter put /store-api/b2b/cost-center/{CostCenterId}': { pathParams: { CostCenterId: string }; body: Body } & Ok<CostCenter>;
  'patchCostCenter patch /store-api/b2b/cost-center/{CostCenterId}': { pathParams: { CostCenterId: string }; body: Body } & Ok<CostCenter>;
  'deleteCostCenter delete /store-api/b2b/cost-center/{CostCenterId}': { pathParams: { CostCenterId: string } } & Ok<
    Record<string, unknown>
  >;
};

// ── /store-api/b2b: customer-product-number ───────────────────────────────
type CustomerProductNumberOperations = {
  'listCustomerProductNumbers post /store-api/b2b/customer-product-numbers': { body?: ListBody } & Ok<
    ShopwareListResponse<CustomerProductNumber>
  >;
  'createCustomerProductNumber post /store-api/b2b/customer-product-number': { body: Body } & Ok<CustomerProductNumber>;
  'deleteCustomerProductNumber delete /store-api/b2b/customer-product-number/{id}': { pathParams: { id: string } } & Ok<
    Record<string, unknown>
  >;
  'importCustomerProductNumbers post /store-api/b2b/customer-product-number-import': { body?: Body } & Ok<Record<string, unknown>>;
};

// ── /store-api/b2b: spare-parts ───────────────────────────────────────────
type SparePartsOperations = {
  'similarProducts post /store-api/b2b/property-similar-products/{productId}': { pathParams: { productId: string } } & Ok<
    ShopwareListResponse<Record<string, unknown>>
  >;
};

// ── budget: /store-api for the entity, /store-api/b2b for "mine" ──────────
type EmployeeBudgetOperations = {
  'budgetPeriodTypes post /store-api/budget-period-types': Ok<BudgetPeriodTypeOption[]>;
  'myEmployeeBudgets get /store-api/b2b/employee-budget': Ok<ShopwareListResponse<Budget>>;
  'budgetApprovalEmployees get /store-api/b2b/order-approval/budget-approval-employees': Ok<ShopwareListResponse<Employee>>;
  'listBudgets post /store-api/budget/list': { body?: ShopwareCriteria } & Ok<ShopwareListResponse<Budget>>;
  'getBudget get /store-api/budget/{BudgetId}': { pathParams: { BudgetId: string } } & Ok<Budget>;
  'createBudget post /store-api/budget': { body: Body } & Ok<Budget>;
  'updateBudget put /store-api/budget/{BudgetId}': { pathParams: { BudgetId: string }; body: Body } & Ok<Budget>;
  'patchBudget patch /store-api/budget/{BudgetId}': { pathParams: { BudgetId: string }; body: Body } & Ok<Budget>;
  'deleteBudget delete /store-api/budget/{BudgetId}': { pathParams: { BudgetId: string } } & Ok<Record<string, unknown>>;
  'budgetOrders get /store-api/budget/{budgetId}/orders': { pathParams: { budgetId: string } } & Ok<ShopwareListResponse<BudgetOrder>>;
  'budgetOrdersFiltered post /store-api/budget/{budgetId}/orders': { pathParams: { budgetId: string }; body?: ShopwareCriteria } & Ok<
    ShopwareListResponse<BudgetOrder>
  >;
};

// ── /store-api/b2b: order-approval ────────────────────────────────────────
// Both the OpenAPI document and the vendor documentation place `list` and
// `create` on the plain `/store-api/order-approval/...` path. The shop answers
// 404 there and serves them under `/b2b/` like the rest of the domain, so the
// live shop wins. Checked 2026-09-17.
type OrderApprovalOperations = {
  'listOrderApprovals post /store-api/b2b/order-approval/list': { body?: ShopwareCriteria } & Ok<ShopwareListResponse<OrderApproval>>;
  'createOrderApproval post /store-api/b2b/order-approval/create': { body: { cartToken: string; customerComment?: string } } & Ok<
    OrderApproval
  >;
  'getOrderApproval get /store-api/b2b/order-approval/{orderApprovalId}': { pathParams: { orderApprovalId: string } } & Ok<OrderApproval>;
  'orderApprovalActivity get /store-api/b2b/order-approval/{orderApprovalId}/activity': {
    pathParams: { orderApprovalId: string };
  } & Ok<OrderApprovalActivityEntry[]>;
  'orderApprovalApprovers get /store-api/b2b/order-approval/{orderApprovalId}/approvers': {
    pathParams: { orderApprovalId: string };
  } & Ok<OrderApprovalApprover[]>;
  'orderApprovalBudgetSummary get /store-api/b2b/order-approval/budget/{budgetId}/summary': { pathParams: { budgetId: string } } & Ok<
    Record<string, unknown>
  >;
  'orderApprovalCountPending get /store-api/b2b/order-approval/settings/count-pending': Ok<{ count: number }>;
  'getOrderApprovalCustomerSettings get /store-api/b2b/order-approval/customer-settings': Ok<OrderApprovalSettings>;
  'setOrderApprovalCustomerSettings post /store-api/b2b/order-approval/customer-settings': {
    body: { mode: string; approverEmployeeIds?: string[]; nValue?: number };
  } & Ok<OrderApprovalSettings>;
  'approveOrderApproval post /store-api/b2b/order-approval/{orderApprovalId}/approve': {
    pathParams: { orderApprovalId: string };
    body: { comment?: string; ccEmployeeIds?: string[] };
  } & Ok<OrderApproval>;
  'declineOrderApproval post /store-api/b2b/order-approval/{orderApprovalId}/decline': {
    pathParams: { orderApprovalId: string };
    body: { comment: string; ccEmployeeIds?: string[] };
  } & Ok<OrderApproval>;
  'executeOrderApproval post /store-api/b2b/order-approval/{orderApprovalId}/execute': {
    pathParams: { orderApprovalId: string };
    body?: { skipRefresh?: boolean };
  } & Ok<OrderApproval>;
  'refreshOrderApproval post /store-api/b2b/order-approval/{orderApprovalId}/refresh': {
    pathParams: { orderApprovalId: string };
    body?: { force?: boolean; sendEmailOnChanges?: boolean };
  } & Ok<OrderApproval>;
  'updateOrderApproval post /store-api/b2b/order-approval/{orderApprovalId}/update': { pathParams: { orderApprovalId: string } } & Ok<
    OrderApproval
  >;
  'remindOrderApproval post /store-api/b2b/order-approval/{orderApprovalId}/remind': {
    pathParams: { orderApprovalId: string };
    body: { approverId: string };
  } & Ok<Record<string, unknown>>;
  'remindAllOrderApproval post /store-api/b2b/order-approval/{orderApprovalId}/remind/all': {
    pathParams: { orderApprovalId: string };
  } & Ok<Record<string, unknown>>;
  'updatePendingOrderApproval post /store-api/b2b/order-approval/settings/update-pending': Ok<Record<string, unknown>>;
  'updateOrderApprovalLineItem patch /store-api/b2b/order-approval/{orderApprovalId}/line-items/{lineItemId}': {
    pathParams: { orderApprovalId: string; lineItemId: string };
    body: { quantity: number };
  } & Ok<Record<string, unknown>>;
  'deleteOrderApprovalLineItem post /store-api/b2b/order-approval/{orderApprovalId}/line-items/{lineItemId}/delete': {
    pathParams: { orderApprovalId: string; lineItemId: string };
    body: { reason: string };
  } & Ok<Record<string, unknown>>;
};

// ── /store-api/sales-representative: customers ────────────────────────────
type SalesRepCustomerOperations = {
  'listRepCustomers post /store-api/sales-representative/customers': { body?: ShopwareCriteria } & Ok<ShopwareListResponse<B2bCustomer>>;
  'searchCustomers post /store-api/sales-representative/customer-search': { body?: ShopwareCriteria } & Ok<
    ShopwareListResponse<B2bCustomer>
  >;
  'customerLastOrders post /store-api/sales-representative/customer-last-orders': { body?: ListBody } & Ok<
    ShopwareListResponse<CustomerLastOrder>
  >;
  'customerSalesRanking post /store-api/sales-representative/customer-sales-ranking': { body: Body } & Ok<
    ShopwareListResponse<CustomerSalesRankingEntry>
  >;
  'salesStatistics post /store-api/sales-representative/sales-statistics': { body?: Body } & Ok<Record<string, unknown>>;
};

// ── /store-api/sales-representative: customer-activity ────────────────────
// The type routes read oddly but match the shop: a GET lists the types, and a
// POST on `/{customerActivityTypeId}` loads one. There is no create or delete.
//
// `listCustomerActivity` is a POST, not a GET. As a GET the shop matches it
// against `/customer-activity/{customerActivityId}` and answers
// `400 FRAMEWORK__INVALID_UUID: Value is not a valid UUID: list` — the literal
// `list` being read as an id. Verified 2026-09-17 with a customer session; a
// session is what it took, since an unauthenticated call is refused before the
// route is ever resolved.
type CustomerActivityOperations = {
  'listCustomerActivity post /store-api/sales-representative/customer-activity/list': { body?: ShopwareCriteria } & Ok<
    ShopwareListResponse<CustomerActivity>
  >;
  'getCustomerActivity get /store-api/sales-representative/customer-activity/{customerActivityId}': {
    pathParams: { customerActivityId: string };
  } & Ok<CustomerActivity>;
  'createCustomerActivity post /store-api/sales-representative/customer-activity': { body: Body } & Ok<CustomerActivity>;
  'updateCustomerActivity put /store-api/sales-representative/customer-activity': { body: Body } & Ok<CustomerActivity>;
  'deleteCustomerActivity delete /store-api/sales-representative/customer-activity/{customerActivityId}': {
    pathParams: { customerActivityId: string };
  } & Ok<Record<string, unknown>>;
};

// `listCustomerActivityType` (`/customer-activity-type/list`) was here and is
// gone: the shop answers 404 for it under a valid session, while the bare
// `/customer-activity-type` above returns all ten types. Two entries for one
// route, one of which does not exist.
type CustomerActivityTypeOperations = {
  'listCustomerActivityTypes get /store-api/sales-representative/customer-activity-type': Ok<ShopwareListResponse<CustomerActivityType>>;
  'getCustomerActivityType get /store-api/sales-representative/customer-activity-type/{customerActivityTypeId}': {
    pathParams: { customerActivityTypeId: string };
  } & Ok<CustomerActivityType>;
};

/**
 * The full operations surface of the B2B Sellers Store API.
 */
export type B2bSellersOperations = AuthOperations &
  CustomerOperations &
  OfferOperations &
  ProductListOperations &
  CatalogMiscOperations &
  EmployeeOperations &
  EmployeeOrderOperations &
  CostCenterOperations &
  CustomerProductNumberOperations &
  SparePartsOperations &
  EmployeeBudgetOperations &
  OrderApprovalOperations &
  SalesRepCustomerOperations &
  CustomerActivityOperations &
  CustomerActivityTypeOperations;
