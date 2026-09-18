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

/**
 * A page of customer activity. `POST`, despite the other read routes here being
 * `GET`: as a `GET` the shop resolves the path against
 * `/customer-activity/{customerActivityId}` and rejects the literal `list` as a
 * malformed UUID.
 */
export function listCustomerActivity(client: B2bSellersClient, body: ShopwareCriteria = {}) {
  return client.invoke('listCustomerActivity post /store-api/sales-representative/customer-activity/list', { body });
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

export function getCustomerActivityType(client: B2bSellersClient, customerActivityTypeId: string) {
  return client.invoke('getCustomerActivityType get /store-api/sales-representative/customer-activity-type/{customerActivityTypeId}', {
    pathParams: { customerActivityTypeId },
  });
}
