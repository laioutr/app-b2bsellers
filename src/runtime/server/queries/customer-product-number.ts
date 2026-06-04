/** Customer-product-number endpoints (/b2b prefix) of the B2B Sellers Store API. */
import type { B2bSellersClient } from '../client/b2bSellersClient';

export function listCustomerProductNumbers(client: B2bSellersClient, body: { page?: number; limit?: number } = {}) {
  return client.invoke('listCustomerProductNumbers post /b2b/customer-product-numbers', { body });
}

export function createCustomerProductNumber(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('createCustomerProductNumber post /b2b/customer-product-number', { body });
}

export function deleteCustomerProductNumber(client: B2bSellersClient, id: string) {
  return client.invoke('deleteCustomerProductNumber delete /b2b/customer-product-number/{id}', { pathParams: { id } });
}

export function importCustomerProductNumbers(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('importCustomerProductNumbers post /b2b/customer-product-number-import', { body });
}
