/** Customer endpoints of the B2B Sellers Store API. */
import type { B2bSellersClient } from '../client/b2bSellersClient';
import type { ShopwareCriteria } from '../types';

/** Search business customers (Shopware Criteria). */
export function searchCustomers(client: B2bSellersClient, body: ShopwareCriteria = {}) {
  return client.invoke('searchCustomers post /store-api/customers', { body });
}

/** Last orders for the resolved customer(s). */
export function customerLastOrders(client: B2bSellersClient, body: { page?: number; limit?: number } = {}) {
  return client.invoke('customerLastOrders post /store-api/customer-last-orders', { body });
}

/** Customer-specific prices. */
export function customerPrices(client: B2bSellersClient, body: Record<string, unknown> = {}) {
  return client.invoke('customerPrices post /store-api/customer-prices', { body });
}
