/**
 * Cost-center endpoints of the B2B Sellers Store API (`/store-api/b2b/...`).
 *
 * The API names the path parameter `CostCenterId`; these wrappers take a plain
 * `id` and map it, so callers do not have to carry the API's spelling.
 */
import type { B2bSellersClient } from '../client/b2bSellersClient';
import type { ShopwareCriteria } from '../types';

export function listCostCenters(client: B2bSellersClient, body: ShopwareCriteria = {}) {
  return client.invoke('listCostCenters post /store-api/b2b/cost-center/list', { body });
}

export function getCostCenter(client: B2bSellersClient, id: string) {
  return client.invoke('getCostCenter get /store-api/b2b/cost-center/{CostCenterId}', { pathParams: { CostCenterId: id } });
}

export function createCostCenter(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('createCostCenter post /store-api/b2b/cost-center', { body });
}

export function updateCostCenter(client: B2bSellersClient, id: string, body: Record<string, unknown>) {
  return client.invoke('updateCostCenter put /store-api/b2b/cost-center/{CostCenterId}', { pathParams: { CostCenterId: id }, body });
}

export function patchCostCenter(client: B2bSellersClient, id: string, body: Record<string, unknown>) {
  return client.invoke('patchCostCenter patch /store-api/b2b/cost-center/{CostCenterId}', { pathParams: { CostCenterId: id }, body });
}

export function deleteCostCenter(client: B2bSellersClient, id: string) {
  return client.invoke('deleteCostCenter delete /store-api/b2b/cost-center/{CostCenterId}', { pathParams: { CostCenterId: id } });
}
