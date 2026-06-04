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
 * baseURL is the shop **origin**, so paths carry their full `/store-api/...`
 * or `/b2b/...` prefix.
 *
 * NOTE: bodies/responses are typed to the best-known wire shapes. Where the
 * exact shape is not yet verified against a live tenant/OpenAPI doc, bodies
 * use `Record<string, unknown>` and responses use a domain DTO or `unknown`.
 * Tightening these is part of the Orchestr-token work (REQUIREMENTS-ORCHESTR.md).
 */
import type {
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
  DeliveryInterval,
  Employee,
  EmployeeOrder,
  EmployeePermission,
  EmployeeRole,
  Offer,
  OfferMailTemplate,
  OrderApproval,
  OrderApprovalActivityEntry,
  OrderApprovalApprover,
  OrderApprovalSettings,
  ProductList,
  ProductSubscription,
  ShopwareCriteria,
  ShopwareListResponse,
} from '../types';

export interface ListBody {
  page?: number;
  limit?: number;
}
type Body = Record<string, unknown>;
type Ok<T> = { response: T; responseCode: 200 };
type NoContent = { response: void; responseCode: 204 };

// ── /store-api: customer ──────────────────────────────────────────────────
type CustomerOperations = {
  'searchCustomers post /store-api/customers': { body?: ShopwareCriteria } & Ok<ShopwareListResponse<Record<string, unknown>>>;
  'customerLastOrders post /store-api/customer-last-orders': { body?: ListBody } & Ok<ShopwareListResponse<CustomerLastOrder>>;
  'customerPrices post /store-api/customer-prices': { body?: Body } & Ok<ShopwareListResponse<CustomerPrice>>;
};

// ── /store-api: customer-activity ─────────────────────────────────────────
type CustomerActivityOperations = {
  'listCustomerActivity post /store-api/customer-activity/list': { body?: ShopwareCriteria } & Ok<ShopwareListResponse<CustomerActivity>>;
  'getCustomerActivity get /store-api/customer-activity/{id}': { pathParams: { id: string } } & Ok<CustomerActivity>;
  'createCustomerActivity post /store-api/customer-activity': { body: Body } & Ok<CustomerActivity>;
  'updateCustomerActivity put /store-api/customer-activity/': { body: Body } & Ok<CustomerActivity>;
  'deleteCustomerActivity delete /store-api/customer-activity/{id}': { pathParams: { id: string } } & NoContent;
};

// ── /store-api: customer-activity-type ────────────────────────────────────
type CustomerActivityTypeOperations = {
  'listCustomerActivityType post /store-api/customer-activity-type/list': { body?: ShopwareCriteria } & Ok<ShopwareListResponse<CustomerActivityType>>;
  'createCustomerActivityType post /store-api/customer-activity-type': { body: Body } & Ok<CustomerActivityType>;
  'deleteCustomerActivityType delete /store-api/customer-activity-type/{id}': { pathParams: { id: string } } & NoContent;
};

// ── /store-api: customer-sales-ranking ────────────────────────────────────
type CustomerSalesRankingOperations = {
  'customerSalesRanking post /store-api/customer-sales-ranking': { body?: Body } & Ok<ShopwareListResponse<CustomerSalesRankingEntry>>;
};

// ── /store-api: employee ──────────────────────────────────────────────────
type EmployeeOperations = {
  'listEmployees post /store-api/employees': { body?: ListBody } & Ok<ShopwareListResponse<Employee>>;
  'getEmployee get /store-api/employee/{id}': { pathParams: { id: string } } & Ok<Employee>;
  'createEmployee post /store-api/employee': { body: Body } & Ok<Employee>;
  'addEmployee post /store-api/employee/add': { body: { email: string; roleId?: string } } & Ok<Employee>;
  'updateEmployee patch /store-api/employee/{id}': { pathParams: { id: string }; body: Body } & Ok<Employee>;
  'deleteEmployee delete /store-api/employee/{id}': { pathParams: { id: string } } & NoContent;
  'listEmployeeRoles post /store-api/employee-roles': { body?: ListBody } & Ok<ShopwareListResponse<EmployeeRole>>;
  'listEmployeePermissions post /store-api/employee-permissions': { body?: ListBody } & Ok<ShopwareListResponse<EmployeePermission>>;
};

// ── /store-api: employee-order ────────────────────────────────────────────
type EmployeeOrderOperations = {
  'listEmployeeOrders post /store-api/employee-orders': { body?: ListBody } & Ok<ShopwareListResponse<EmployeeOrder>>;
  'getEmployeeOrder get /store-api/employee-order/{id}': { pathParams: { id: string } } & Ok<EmployeeOrder>;
};

// ── /store-api: event-product ─────────────────────────────────────────────
type EventProductOperations = {
  'listEventProducts post /store-api/event-products': { body?: Body } & Ok<ShopwareListResponse<Record<string, unknown>>>;
};

// ── /store-api: offer (+ document / mail / status) ────────────────────────
type OfferOperations = {
  'listOffers post /store-api/offer/list': { body?: ShopwareCriteria } & Ok<ShopwareListResponse<Offer>>;
  'getOffer get /store-api/offer/{id}': { pathParams: { id: string } } & Ok<Offer>;
  'deleteOffer delete /store-api/offer/{id}': { pathParams: { id: string } } & NoContent;
  'convertOfferToOrder post /store-api/offer-order/{id}': { pathParams: { id: string }; body?: Body } & Ok<Record<string, unknown>>;
  'generateOfferDocument post /store-api/offer-document/{id}': { pathParams: { id: string }; body?: Body } & Ok<Record<string, unknown>>;
  'sendOfferMail post /store-api/offer-mail/{id}': { pathParams: { id: string }; body?: Body } & Ok<Record<string, unknown>>;
  'offerMailTemplates post /store-api/offer-mail-templates': { body?: ListBody } & Ok<ShopwareListResponse<OfferMailTemplate>>;
  'updateOfferStatus patch /store-api/offer/{id}/status': { pathParams: { id: string }; body: { status: string } } & Ok<Offer>;
};

// ── /store-api: platform-cms ──────────────────────────────────────────────
type PlatformCmsOperations = {
  'getPlatformCms post /store-api/platform-cms': { body?: Body } & Ok<Record<string, unknown>>;
};

// ── /store-api: product-list ──────────────────────────────────────────────
type ProductListOperations = {
  'listProductLists post /store-api/product-lists': { body?: ListBody } & Ok<ShopwareListResponse<ProductList>>;
  'createProductList post /store-api/product-lists/create': { body: Body } & Ok<ProductList>;
  'getProductList get /store-api/product-lists/detail/{id}': { pathParams: { id: string } } & Ok<ProductList>;
  'updateProductList patch /store-api/product-lists/{id}': { pathParams: { id: string }; body: Body } & Ok<ProductList>;
  'deleteProductList delete /store-api/product-lists/{id}': { pathParams: { id: string } } & NoContent;
  'removeProductListProduct delete /store-api/product-lists/product/{id}/{listId}': { pathParams: { id: string; listId: string } } & NoContent;
};

// ── /store-api: product-subscription ──────────────────────────────────────
type ProductSubscriptionOperations = {
  'listProductSubscriptions post /store-api/product-subscription-list': { body?: ListBody } & Ok<ShopwareListResponse<ProductSubscription>>;
  'getProductSubscription get /store-api/product-subscription-list/{id}': { pathParams: { id: string } } & Ok<ProductSubscription>;
  'deleteProductSubscription delete /store-api/product-subscription/{id}': { pathParams: { id: string } } & NoContent;
};

// ── /store-api: product-table-listing / snippets / login-targets ──────────
type ProductTableListingOperations = {
  'productTableListing post /store-api/product-table-listing': { body?: Body } & Ok<ShopwareListResponse<Record<string, unknown>>>;
};
type SnippetsOperations = {
  'getSnippets post /store-api/snippets': { body?: Body } & Ok<Record<string, string>>;
};
type LoginTargetsOperations = {
  'listLoginTargets post /store-api/login-targets': { body?: Body } & Ok<ShopwareListResponse<Record<string, unknown>>>;
};

// ── /store-api: misc ──────────────────────────────────────────────────────
type MiscOperations = {
  'deliveryIntervals get /store-api/delivery-interval': Ok<DeliveryInterval[]>;
  'paymentConditions post /store-api/payment-conditions': { body?: Body } & Ok<ShopwareListResponse<Record<string, unknown>>>;
  'salesStatistics post /store-api/sales-statistics': { body?: Body } & Ok<Record<string, unknown>>;
  'accountRequest post /store-api/account-request': { body: Body } & Ok<Record<string, unknown>>;
};

// ── /store-api: pdp-variant-list / product-request / sales-representative ──
type PdpVariantListOperations = {
  'pdpVariantList post /store-api/variant-list/{productId}': { pathParams: { productId: string }; body?: ShopwareCriteria } & Ok<ShopwareListResponse<Record<string, unknown>>>;
};
type ProductRequestOperations = {
  'sendProductRequest post /store-api/product-request/{productId}/send': { pathParams: { productId: string }; body?: Body } & Ok<Record<string, unknown>>;
};
type SalesRepresentativeOperations = {
  'salesRepFastOrder post /store-api/sales-representative/fast-order': { body: Body } & Ok<Record<string, unknown>>;
};

// ── /b2b: cost-center ─────────────────────────────────────────────────────
type CostCenterOperations = {
  'listCostCenters post /b2b/cost-center/list': { body?: ShopwareCriteria } & Ok<ShopwareListResponse<CostCenter>>;
  'getCostCenter get /b2b/cost-center/{id}': { pathParams: { id: string } } & Ok<CostCenter>;
  'createCostCenter post /b2b/cost-center': { body: Body } & Ok<CostCenter>;
  'updateCostCenter put /b2b/cost-center/{id}': { pathParams: { id: string }; body: Body } & Ok<CostCenter>;
  'patchCostCenter patch /b2b/cost-center/{id}': { pathParams: { id: string }; body: Body } & Ok<CostCenter>;
  'deleteCostCenter delete /b2b/cost-center/{id}': { pathParams: { id: string } } & NoContent;
};

// ── /b2b: customer-product-number ─────────────────────────────────────────
type CustomerProductNumberOperations = {
  'listCustomerProductNumbers post /b2b/customer-product-numbers': { body?: ListBody } & Ok<ShopwareListResponse<CustomerProductNumber>>;
  'createCustomerProductNumber post /b2b/customer-product-number': { body: Body } & Ok<CustomerProductNumber>;
  'deleteCustomerProductNumber delete /b2b/customer-product-number/{id}': { pathParams: { id: string } } & NoContent;
  'importCustomerProductNumbers post /b2b/customer-product-number-import': { body: Body } & Ok<Record<string, unknown>>;
};

// ── /b2b: spare-parts ─────────────────────────────────────────────────────
type SparePartsOperations = {
  'similarProducts post /b2b/property-similar-products/{productId}': { pathParams: { productId: string }; body?: Body } & Ok<ShopwareListResponse<Record<string, unknown>>>;
};

// ── mixed prefix: employee-budget ─────────────────────────────────────────
type EmployeeBudgetOperations = {
  'budgetPeriodTypes post /store-api/budget-period-types': { body?: Body } & Ok<BudgetPeriodTypeOption[]>;
  'budgetApprovalEmployees get /store-api/budget-approval-employees': Ok<ShopwareListResponse<Employee>>;
  'myEmployeeBudgets get /b2b/employee-budget': Ok<ShopwareListResponse<Budget>>;
  'listBudgets post /store-api/budget/list': { body?: ShopwareCriteria } & Ok<ShopwareListResponse<Budget>>;
  'getBudget get /store-api/budget/{id}': { pathParams: { id: string } } & Ok<Budget>;
  'createBudget post /store-api/budget': { body: Body } & Ok<Budget>;
  'updateBudget put /store-api/budget/{id}': { pathParams: { id: string }; body: Body } & Ok<Budget>;
  'patchBudget patch /store-api/budget/{id}': { pathParams: { id: string }; body: Body } & Ok<Budget>;
  'deleteBudget delete /store-api/budget/{id}': { pathParams: { id: string } } & NoContent;
  'budgetOrders get /store-api/budget/{budgetId}/orders': { pathParams: { budgetId: string } } & Ok<ShopwareListResponse<BudgetOrder>>;
  'budgetOrdersFiltered post /store-api/budget/{budgetId}/orders': { pathParams: { budgetId: string }; body?: ShopwareCriteria } & Ok<ShopwareListResponse<BudgetOrder>>;
};

// ── mixed prefix: order-approval ──────────────────────────────────────────
type OrderApprovalOperations = {
  'listOrderApprovals post /store-api/order-approval/list': { body?: ShopwareCriteria } & Ok<ShopwareListResponse<OrderApproval>>;
  'getOrderApproval get /b2b/order-approval/{id}': { pathParams: { id: string } } & Ok<OrderApproval>;
  'orderApprovalActivity get /b2b/order-approval/{id}/activity': { pathParams: { id: string } } & Ok<OrderApprovalActivityEntry[]>;
  'orderApprovalApprovers get /b2b/order-approval/{id}/approvers': { pathParams: { id: string } } & Ok<OrderApprovalApprover[]>;
  'orderApprovalBudgetSummary get /b2b/order-approval/budget/{budgetId}/summary': { pathParams: { budgetId: string } } & Ok<Record<string, unknown>>;
  'orderApprovalCountPending get /b2b/order-approval/settings/count-pending': Ok<{ count: number }>;
  'getOrderApprovalCustomerSettings get /b2b/order-approval/customer-settings': Ok<OrderApprovalSettings>;
  'setOrderApprovalCustomerSettings post /b2b/order-approval/customer-settings': { body: Body } & Ok<OrderApprovalSettings>;
  'createOrderApproval post /store-api/order-approval/create': { body: Body } & Ok<OrderApproval>;
  'approveOrderApproval post /b2b/order-approval/{id}/approve': { pathParams: { id: string }; body?: Body } & Ok<OrderApproval>;
  'declineOrderApproval post /b2b/order-approval/{id}/decline': { pathParams: { id: string }; body?: Body } & Ok<OrderApproval>;
  'executeOrderApproval post /b2b/order-approval/{id}/execute': { pathParams: { id: string }; body?: Body } & Ok<OrderApproval>;
  'refreshOrderApproval post /b2b/order-approval/{id}/refresh': { pathParams: { id: string }; body?: Body } & Ok<OrderApproval>;
  'updateOrderApproval post /b2b/order-approval/{id}/update': { pathParams: { id: string }; body?: Body } & Ok<OrderApproval>;
  'remindOrderApproval post /b2b/order-approval/{id}/remind': { pathParams: { id: string }; body?: Body } & Ok<Record<string, unknown>>;
  'remindAllOrderApproval post /b2b/order-approval/{id}/remind/all': { pathParams: { id: string }; body?: Body } & Ok<Record<string, unknown>>;
  'updatePendingOrderApproval post /b2b/order-approval/settings/update-pending': { body?: Body } & Ok<Record<string, unknown>>;
  'updateOrderApprovalLineItem patch /b2b/order-approval/{id}/line-items/{lineItemId}': { pathParams: { id: string; lineItemId: string }; body?: Body } & Ok<Record<string, unknown>>;
  'deleteOrderApprovalLineItem post /b2b/order-approval/{id}/line-items/{lineItemId}/delete': { pathParams: { id: string; lineItemId: string }; body?: Body } & Ok<Record<string, unknown>>;
};

/**
 * The full operations surface of the B2B Sellers Store API (~91 endpoints).
 */
export type B2bSellersOperations = CustomerOperations &
  CustomerActivityOperations &
  CustomerActivityTypeOperations &
  CustomerSalesRankingOperations &
  EmployeeOperations &
  EmployeeOrderOperations &
  EventProductOperations &
  OfferOperations &
  PlatformCmsOperations &
  ProductListOperations &
  ProductSubscriptionOperations &
  ProductTableListingOperations &
  SnippetsOperations &
  LoginTargetsOperations &
  MiscOperations &
  PdpVariantListOperations &
  ProductRequestOperations &
  SalesRepresentativeOperations &
  CostCenterOperations &
  CustomerProductNumberOperations &
  SparePartsOperations &
  EmployeeBudgetOperations &
  OrderApprovalOperations;
