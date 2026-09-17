/**
 * Customer-activity + activity-type endpoints of the B2B Sellers Store API
 * (`/store-api/sales-representative/...`).
 *
 * The activity-type routes read oddly but match the shop: a GET lists the
 * types, and a POST on `/{customerActivityTypeId}` loads one. The installed
 * version exposes no create or delete for types.
 */
import type { B2bSellersClient } from '../client/b2bSellersClient';
import type { ShopwareCriteria } from '../types';

export function listCustomerActivity(client: B2bSellersClient, query: ShopwareCriteria = {}) {
  return client.invoke('listCustomerActivity get /store-api/sales-representative/customer-activity/list', { query });
}

export function getCustomerActivity(client: B2bSellersClient, customerActivityId: string) {
  return client.invoke('getCustomerActivity get /store-api/sales-representative/customer-activity/{customerActivityId}', {
    pathParams: { customerActivityId },
  });
}

export function createCustomerActivity(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('createCustomerActivity post /store-api/sales-representative/customer-activity', { body });
}

/** Update an activity. The record is addressed through the body, not the path. */
export function updateCustomerActivity(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('updateCustomerActivity put /store-api/sales-representative/customer-activity', { body });
}

export function deleteCustomerActivity(client: B2bSellersClient, customerActivityId: string) {
  return client.invoke('deleteCustomerActivity delete /store-api/sales-representative/customer-activity/{customerActivityId}', {
    pathParams: { customerActivityId },
  });
}

// activity types

export function listCustomerActivityTypes(client: B2bSellersClient) {
  return client.invoke('listCustomerActivityTypes get /store-api/sales-representative/customer-activity-type');
}

export function listCustomerActivityType(client: B2bSellersClient) {
  return client.invoke('listCustomerActivityType get /store-api/sales-representative/customer-activity-type/list');
}

export function getCustomerActivityType(client: B2bSellersClient, customerActivityTypeId: string) {
  return client.invoke('getCustomerActivityType post /store-api/sales-representative/customer-activity-type/{customerActivityTypeId}', {
    pathParams: { customerActivityTypeId },
  });
}
