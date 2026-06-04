/**
 * Employee-budget endpoints (mixed /store-api + /b2b prefixes) of the B2B
 * Sellers Store API.
 */
import type { B2bSellersClient } from '../client/b2bSellersClient';
import type { ShopwareCriteria } from '../types';

export function budgetPeriodTypes(client: B2bSellersClient, body: Record<string, unknown> = {}) {
  return client.invoke('budgetPeriodTypes post /store-api/budget-period-types', { body });
}

export function budgetApprovalEmployees(client: B2bSellersClient) {
  return client.invoke('budgetApprovalEmployees get /store-api/budget-approval-employees');
}

export function myEmployeeBudgets(client: B2bSellersClient) {
  return client.invoke('myEmployeeBudgets get /b2b/employee-budget');
}

export function listBudgets(client: B2bSellersClient, body: ShopwareCriteria = {}) {
  return client.invoke('listBudgets post /store-api/budget/list', { body });
}

export function getBudget(client: B2bSellersClient, id: string) {
  return client.invoke('getBudget get /store-api/budget/{id}', { pathParams: { id } });
}

export function createBudget(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('createBudget post /store-api/budget', { body });
}

export function updateBudget(client: B2bSellersClient, id: string, body: Record<string, unknown>) {
  return client.invoke('updateBudget put /store-api/budget/{id}', { pathParams: { id }, body });
}

export function patchBudget(client: B2bSellersClient, id: string, body: Record<string, unknown>) {
  return client.invoke('patchBudget patch /store-api/budget/{id}', { pathParams: { id }, body });
}

export function deleteBudget(client: B2bSellersClient, id: string) {
  return client.invoke('deleteBudget delete /store-api/budget/{id}', { pathParams: { id } });
}

export function budgetOrders(client: B2bSellersClient, budgetId: string) {
  return client.invoke('budgetOrders get /store-api/budget/{budgetId}/orders', { pathParams: { budgetId } });
}

export function budgetOrdersFiltered(client: B2bSellersClient, budgetId: string, body: ShopwareCriteria = {}) {
  return client.invoke('budgetOrdersFiltered post /store-api/budget/{budgetId}/orders', { pathParams: { budgetId }, body });
}
