/**
 * Smaller single-endpoint domains of the B2B Sellers Store API:
 * event-product, platform-cms, product-table-listing, snippets, login-targets,
 * pdp-variant-list, product-request, sales-representative, and misc.
 */
import type { B2bSellersClient } from '../client/b2bSellersClient';
import type { ShopwareCriteria } from '../types';

export function listEventProducts(client: B2bSellersClient, body: Record<string, unknown> = {}) {
  return client.invoke('listEventProducts post /store-api/event-products', { body });
}

export function getPlatformCms(client: B2bSellersClient, body: Record<string, unknown> = {}) {
  return client.invoke('getPlatformCms post /store-api/platform-cms', { body });
}

export function productTableListing(client: B2bSellersClient, body: Record<string, unknown> = {}) {
  return client.invoke('productTableListing post /store-api/product-table-listing', { body });
}

export function getSnippets(client: B2bSellersClient, body: Record<string, unknown> = {}) {
  return client.invoke('getSnippets post /store-api/snippets', { body });
}

export function listLoginTargets(client: B2bSellersClient, body: Record<string, unknown> = {}) {
  return client.invoke('listLoginTargets post /store-api/login-targets', { body });
}

export function pdpVariantList(client: B2bSellersClient, productId: string, body: ShopwareCriteria = {}) {
  return client.invoke('pdpVariantList post /store-api/variant-list/{productId}', { pathParams: { productId }, body });
}

export function sendProductRequest(client: B2bSellersClient, productId: string, body: Record<string, unknown> = {}) {
  return client.invoke('sendProductRequest post /store-api/product-request/{productId}/send', { pathParams: { productId }, body });
}

export function salesRepFastOrder(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('salesRepFastOrder post /store-api/sales-representative/fast-order', { body });
}

// misc
export function deliveryIntervals(client: B2bSellersClient) {
  return client.invoke('deliveryIntervals get /store-api/delivery-interval');
}

export function paymentConditions(client: B2bSellersClient, body: Record<string, unknown> = {}) {
  return client.invoke('paymentConditions post /store-api/payment-conditions', { body });
}

export function salesStatistics(client: B2bSellersClient, body: Record<string, unknown> = {}) {
  return client.invoke('salesStatistics post /store-api/sales-statistics', { body });
}

export function accountRequest(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('accountRequest post /store-api/account-request', { body });
}
