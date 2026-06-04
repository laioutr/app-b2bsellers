/**
 * Order-approval endpoints (mixed /store-api + /b2b prefixes) of the B2B
 * Sellers Store API.
 */
import type { B2bSellersClient } from '../client/b2bSellersClient';
import type { ShopwareCriteria } from '../types';

export function listOrderApprovals(client: B2bSellersClient, body: ShopwareCriteria = {}) {
  return client.invoke('listOrderApprovals post /store-api/order-approval/list', { body });
}

export function getOrderApproval(client: B2bSellersClient, id: string) {
  return client.invoke('getOrderApproval get /b2b/order-approval/{id}', { pathParams: { id } });
}

export function orderApprovalActivity(client: B2bSellersClient, id: string) {
  return client.invoke('orderApprovalActivity get /b2b/order-approval/{id}/activity', { pathParams: { id } });
}

export function orderApprovalApprovers(client: B2bSellersClient, id: string) {
  return client.invoke('orderApprovalApprovers get /b2b/order-approval/{id}/approvers', { pathParams: { id } });
}

export function orderApprovalBudgetSummary(client: B2bSellersClient, budgetId: string) {
  return client.invoke('orderApprovalBudgetSummary get /b2b/order-approval/budget/{budgetId}/summary', { pathParams: { budgetId } });
}

export function orderApprovalCountPending(client: B2bSellersClient) {
  return client.invoke('orderApprovalCountPending get /b2b/order-approval/settings/count-pending');
}

export function getOrderApprovalCustomerSettings(client: B2bSellersClient) {
  return client.invoke('getOrderApprovalCustomerSettings get /b2b/order-approval/customer-settings');
}

export function setOrderApprovalCustomerSettings(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('setOrderApprovalCustomerSettings post /b2b/order-approval/customer-settings', { body });
}

export function createOrderApproval(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('createOrderApproval post /store-api/order-approval/create', { body });
}

export function approveOrderApproval(client: B2bSellersClient, id: string, body: Record<string, unknown> = {}) {
  return client.invoke('approveOrderApproval post /b2b/order-approval/{id}/approve', { pathParams: { id }, body });
}

export function declineOrderApproval(client: B2bSellersClient, id: string, body: Record<string, unknown> = {}) {
  return client.invoke('declineOrderApproval post /b2b/order-approval/{id}/decline', { pathParams: { id }, body });
}

export function executeOrderApproval(client: B2bSellersClient, id: string, body: Record<string, unknown> = {}) {
  return client.invoke('executeOrderApproval post /b2b/order-approval/{id}/execute', { pathParams: { id }, body });
}

export function refreshOrderApproval(client: B2bSellersClient, id: string, body: Record<string, unknown> = {}) {
  return client.invoke('refreshOrderApproval post /b2b/order-approval/{id}/refresh', { pathParams: { id }, body });
}

export function updateOrderApproval(client: B2bSellersClient, id: string, body: Record<string, unknown> = {}) {
  return client.invoke('updateOrderApproval post /b2b/order-approval/{id}/update', { pathParams: { id }, body });
}

export function remindOrderApproval(client: B2bSellersClient, id: string, body: Record<string, unknown> = {}) {
  return client.invoke('remindOrderApproval post /b2b/order-approval/{id}/remind', { pathParams: { id }, body });
}

export function remindAllOrderApproval(client: B2bSellersClient, id: string, body: Record<string, unknown> = {}) {
  return client.invoke('remindAllOrderApproval post /b2b/order-approval/{id}/remind/all', { pathParams: { id }, body });
}

export function updatePendingOrderApproval(client: B2bSellersClient, body: Record<string, unknown> = {}) {
  return client.invoke('updatePendingOrderApproval post /b2b/order-approval/settings/update-pending', { body });
}

export function updateOrderApprovalLineItem(client: B2bSellersClient, id: string, lineItemId: string, body: Record<string, unknown> = {}) {
  return client.invoke('updateOrderApprovalLineItem patch /b2b/order-approval/{id}/line-items/{lineItemId}', { pathParams: { id, lineItemId }, body });
}

export function deleteOrderApprovalLineItem(client: B2bSellersClient, id: string, lineItemId: string, body: Record<string, unknown> = {}) {
  return client.invoke('deleteOrderApprovalLineItem post /b2b/order-approval/{id}/line-items/{lineItemId}/delete', { pathParams: { id, lineItemId }, body });
}
