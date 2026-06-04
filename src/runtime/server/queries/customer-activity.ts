/** Customer-activity + activity-type endpoints of the B2B Sellers Store API. */
import type { B2bSellersClient } from '../client/b2bSellersClient';
import type { ShopwareCriteria } from '../types';

export function listCustomerActivity(client: B2bSellersClient, body: ShopwareCriteria = {}) {
  return client.invoke('listCustomerActivity post /store-api/customer-activity/list', { body });
}

export function getCustomerActivity(client: B2bSellersClient, id: string) {
  return client.invoke('getCustomerActivity get /store-api/customer-activity/{id}', { pathParams: { id } });
}

export function createCustomerActivity(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('createCustomerActivity post /store-api/customer-activity', { body });
}

export function updateCustomerActivity(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('updateCustomerActivity put /store-api/customer-activity/', { body });
}

export function deleteCustomerActivity(client: B2bSellersClient, id: string) {
  return client.invoke('deleteCustomerActivity delete /store-api/customer-activity/{id}', { pathParams: { id } });
}

// activity types
export function listCustomerActivityType(client: B2bSellersClient, body: ShopwareCriteria = {}) {
  return client.invoke('listCustomerActivityType post /store-api/customer-activity-type/list', { body });
}

export function createCustomerActivityType(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('createCustomerActivityType post /store-api/customer-activity-type', { body });
}

export function deleteCustomerActivityType(client: B2bSellersClient, id: string) {
  return client.invoke('deleteCustomerActivityType delete /store-api/customer-activity-type/{id}', { pathParams: { id } });
}
