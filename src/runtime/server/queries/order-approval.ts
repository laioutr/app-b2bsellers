/**
 * Order-approval endpoints of the B2B Sellers Store API (`/store-api/b2b/...`).
 *
 * The whole domain lives under `/b2b/`, including `list` and `create` — both
 * the OpenAPI document and the vendor documentation place those two on the
 * plain path, where the shop answers 404. The API names the path parameter
 * `orderApprovalId`; these wrappers take a plain `id`.
 *
 * Several routes have required bodies (`decline` needs a comment, `remind` an
 * approver, the line-item routes a quantity/reason); the signatures below make
 * that explicit rather than defaulting to `{}`.
 */
import type { B2bSellersClient } from '../client/b2bSellersClient';
import type { ShopwareCriteria } from '../types';

export function listOrderApprovals(client: B2bSellersClient, body: ShopwareCriteria = {}) {
  return client.invoke('listOrderApprovals post /store-api/b2b/order-approval/list', { body });
}

export function createOrderApproval(client: B2bSellersClient, body: { cartToken: string; customerComment?: string }) {
  return client.invoke('createOrderApproval post /store-api/b2b/order-approval/create', { body });
}

export function getOrderApproval(client: B2bSellersClient, id: string) {
  return client.invoke('getOrderApproval get /store-api/b2b/order-approval/{orderApprovalId}', { pathParams: { orderApprovalId: id } });
}

export function orderApprovalActivity(client: B2bSellersClient, id: string) {
  return client.invoke('orderApprovalActivity get /store-api/b2b/order-approval/{orderApprovalId}/activity', {
    pathParams: { orderApprovalId: id },
  });
}

export function orderApprovalApprovers(client: B2bSellersClient, id: string) {
  return client.invoke('orderApprovalApprovers get /store-api/b2b/order-approval/{orderApprovalId}/approvers', {
    pathParams: { orderApprovalId: id },
  });
}

export function orderApprovalBudgetSummary(client: B2bSellersClient, budgetId: string) {
  return client.invoke('orderApprovalBudgetSummary get /store-api/b2b/order-approval/budget/{budgetId}/summary', {
    pathParams: { budgetId },
  });
}

export function orderApprovalCountPending(client: B2bSellersClient) {
  return client.invoke('orderApprovalCountPending get /store-api/b2b/order-approval/settings/count-pending');
}

export function getOrderApprovalCustomerSettings(client: B2bSellersClient) {
  return client.invoke('getOrderApprovalCustomerSettings get /store-api/b2b/order-approval/customer-settings');
}

export function setOrderApprovalCustomerSettings(
  client: B2bSellersClient,
  body: { mode: string; approverEmployeeIds?: string[]; nValue?: number }
) {
  return client.invoke('setOrderApprovalCustomerSettings post /store-api/b2b/order-approval/customer-settings', { body });
}

export function approveOrderApproval(client: B2bSellersClient, id: string, body: { comment?: string; ccEmployeeIds?: string[] } = {}) {
  return client.invoke('approveOrderApproval post /store-api/b2b/order-approval/{orderApprovalId}/approve', {
    pathParams: { orderApprovalId: id },
    body,
  });
}

export function declineOrderApproval(client: B2bSellersClient, id: string, body: { comment: string; ccEmployeeIds?: string[] }) {
  return client.invoke('declineOrderApproval post /store-api/b2b/order-approval/{orderApprovalId}/decline', {
    pathParams: { orderApprovalId: id },
    body,
  });
}

export function executeOrderApproval(client: B2bSellersClient, id: string, body: { skipRefresh?: boolean } = {}) {
  return client.invoke('executeOrderApproval post /store-api/b2b/order-approval/{orderApprovalId}/execute', {
    pathParams: { orderApprovalId: id },
    body,
  });
}

export function refreshOrderApproval(
  client: B2bSellersClient,
  id: string,
  body: { force?: boolean; sendEmailOnChanges?: boolean } = {}
) {
  return client.invoke('refreshOrderApproval post /store-api/b2b/order-approval/{orderApprovalId}/refresh', {
    pathParams: { orderApprovalId: id },
    body,
  });
}

export function updateOrderApproval(client: B2bSellersClient, id: string) {
  return client.invoke('updateOrderApproval post /store-api/b2b/order-approval/{orderApprovalId}/update', {
    pathParams: { orderApprovalId: id },
  });
}

export function remindOrderApproval(client: B2bSellersClient, id: string, body: { approverId: string }) {
  return client.invoke('remindOrderApproval post /store-api/b2b/order-approval/{orderApprovalId}/remind', {
    pathParams: { orderApprovalId: id },
    body,
  });
}

export function remindAllOrderApproval(client: B2bSellersClient, id: string) {
  return client.invoke('remindAllOrderApproval post /store-api/b2b/order-approval/{orderApprovalId}/remind/all', {
    pathParams: { orderApprovalId: id },
  });
}

export function updatePendingOrderApproval(client: B2bSellersClient) {
  return client.invoke('updatePendingOrderApproval post /store-api/b2b/order-approval/settings/update-pending');
}

export function updateOrderApprovalLineItem(client: B2bSellersClient, id: string, lineItemId: string, body: { quantity: number }) {
  return client.invoke('updateOrderApprovalLineItem patch /store-api/b2b/order-approval/{orderApprovalId}/line-items/{lineItemId}', {
    pathParams: { orderApprovalId: id, lineItemId },
    body,
  });
}

export function deleteOrderApprovalLineItem(client: B2bSellersClient, id: string, lineItemId: string, body: { reason: string }) {
  return client.invoke(
    'deleteOrderApprovalLineItem post /store-api/b2b/order-approval/{orderApprovalId}/line-items/{lineItemId}/delete',
    { pathParams: { orderApprovalId: id, lineItemId }, body }
  );
}
