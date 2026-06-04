/** Product-subscription endpoints of the B2B Sellers Store API. */
import type { B2bSellersClient } from '../client/b2bSellersClient';

export function listProductSubscriptions(client: B2bSellersClient, body: { page?: number; limit?: number } = {}) {
  return client.invoke('listProductSubscriptions post /store-api/product-subscription-list', { body });
}

export function getProductSubscription(client: B2bSellersClient, id: string) {
  return client.invoke('getProductSubscription get /store-api/product-subscription-list/{id}', { pathParams: { id } });
}

export function deleteProductSubscription(client: B2bSellersClient, id: string) {
  return client.invoke('deleteProductSubscription delete /store-api/product-subscription/{id}', { pathParams: { id } });
}
