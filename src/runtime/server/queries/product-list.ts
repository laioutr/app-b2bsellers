/** Product-list endpoints of the B2B Sellers Store API. */
import type { B2bSellersClient } from '../client/b2bSellersClient';
import type { ShopwareCriteria } from '../types';

export function listProductLists(client: B2bSellersClient, body: ShopwareCriteria = {}) {
  return client.invoke('listProductLists post /store-api/product-lists', { body });
}

export function createProductList(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('createProductList post /store-api/product-lists/create', { body });
}

export function getProductList(client: B2bSellersClient, id: string) {
  return client.invoke('getProductList get /store-api/product-lists/{id}', { pathParams: { id } });
}

export function updateProductList(client: B2bSellersClient, id: string, body: Record<string, unknown>) {
  return client.invoke('updateProductList patch /store-api/product-lists/{id}', { pathParams: { id }, body });
}

export function deleteProductList(client: B2bSellersClient, id: string) {
  return client.invoke('deleteProductList delete /store-api/product-lists/{id}', { pathParams: { id } });
}

/** Remove one product from a list. `id` is the list, `productId` the product. */
export function removeProductListProduct(client: B2bSellersClient, id: string, productId: string) {
  return client.invoke('removeProductListProduct delete /store-api/product-lists/{id}/product/{productId}', {
    pathParams: { id, productId },
  });
}
