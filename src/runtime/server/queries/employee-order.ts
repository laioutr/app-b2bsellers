/** Employee-order endpoints of the B2B Sellers Store API (`/store-api/b2b/...`). */
import type { B2bSellersClient } from '../client/b2bSellersClient';

/** List orders placed by / for employees (paginated). */
export function listEmployeeOrders(client: B2bSellersClient, body: { page?: number; limit?: number } = {}) {
  return client.invoke('listEmployeeOrders post /store-api/b2b/employee-orders', { body });
}

/** Fetch a single employee order by id. */
export function getEmployeeOrder(client: B2bSellersClient, id: string) {
  return client.invoke('getEmployeeOrder get /store-api/b2b/employee-order/{id}', { pathParams: { id } });
}
