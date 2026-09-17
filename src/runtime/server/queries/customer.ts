/**
 * Customer endpoints of the B2B Sellers Store API.
 *
 * The sales-rep views of a customer live under `/store-api/sales-representative`;
 * customer pricing is a plain core route.
 */
import type { B2bSellersClient } from '../client/b2bSellersClient';
import type { ShopwareCriteria } from '../types';

/** The customers assigned to the logged-in sales representative. */
export function listRepCustomers(client: B2bSellersClient, body: ShopwareCriteria = {}) {
  return client.invoke('listRepCustomers post /store-api/sales-representative/customers', { body });
}

/** Search business customers (Shopware Criteria). */
export function searchCustomers(client: B2bSellersClient, body: ShopwareCriteria = {}) {
  return client.invoke('searchCustomers post /store-api/sales-representative/customer-search', { body });
}

/** Last orders for the resolved customer(s). */
export function customerLastOrders(client: B2bSellersClient, body: { page?: number; limit?: number } = {}) {
  return client.invoke('customerLastOrders post /store-api/sales-representative/customer-last-orders', { body });
}

/** Customer-specific prices. */
export function customerPrices(client: B2bSellersClient, body: Record<string, unknown> = {}) {
  return client.invoke('customerPrices post /store-api/customer-prices', { body });
}
