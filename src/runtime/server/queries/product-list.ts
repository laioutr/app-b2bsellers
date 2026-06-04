/** Product-list endpoints of the B2B Sellers Store API. */
import type { B2bSellersClient } from '../client/b2bSellersClient';

export function listProductLists(client: B2bSellersClient, body: { page?: number; limit?: number } = {}) {
  return client.invoke('listProductLists post /store-api/product-lists', { body });
}

export function createProductList(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('createProductList post /store-api/product-lists/create', { body });
}

export function getProductList(client: B2bSellersClient, id: string) {
  return client.invoke('getProductList get /store-api/product-lists/detail/{id}', { pathParams: { id } });
}

export function updateProductList(client: B2bSellersClient, id: string, body: Record<string, unknown>) {
  return client.invoke('updateProductList patch /store-api/product-lists/{id}', { pathParams: { id }, body });
}

export function deleteProductList(client: B2bSellersClient, id: string) {
  return client.invoke('deleteProductList delete /store-api/product-lists/{id}', { pathParams: { id } });
}

export function removeProductListProduct(client: B2bSellersClient, id: string, listId: string) {
  return client.invoke('removeProductListProduct delete /store-api/product-lists/product/{id}/{listId}', { pathParams: { id, listId } });
}
