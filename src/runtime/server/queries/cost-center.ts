/** Cost-center endpoints (/b2b prefix) of the B2B Sellers Store API. */
import type { B2bSellersClient } from '../client/b2bSellersClient';
import type { ShopwareCriteria } from '../types';

export function listCostCenters(client: B2bSellersClient, body: ShopwareCriteria = {}) {
  return client.invoke('listCostCenters post /b2b/cost-center/list', { body });
}

export function getCostCenter(client: B2bSellersClient, id: string) {
  return client.invoke('getCostCenter get /b2b/cost-center/{id}', { pathParams: { id } });
}

export function createCostCenter(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('createCostCenter post /b2b/cost-center', { body });
}

export function updateCostCenter(client: B2bSellersClient, id: string, body: Record<string, unknown>) {
  return client.invoke('updateCostCenter put /b2b/cost-center/{id}', { pathParams: { id }, body });
}

export function patchCostCenter(client: B2bSellersClient, id: string, body: Record<string, unknown>) {
  return client.invoke('patchCostCenter patch /b2b/cost-center/{id}', { pathParams: { id }, body });
}

export function deleteCostCenter(client: B2bSellersClient, id: string) {
  return client.invoke('deleteCostCenter delete /b2b/cost-center/{id}', { pathParams: { id } });
}
