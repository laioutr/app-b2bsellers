/**
 * Smaller single-endpoint domains of the B2B Sellers Store API:
 * platform-cms, product-table-listing, snippets, login-targets,
 * pdp-variant-list, product-request, sales-representative, and misc.
 */
import type { B2bSellersClient } from '../client/b2bSellersClient';
import type { ShopwareCriteria } from '../types';

export function productTableListing(client: B2bSellersClient, body: Record<string, unknown> = {}) {
  return client.invoke('productTableListing post /store-api/product-table-listing', { body });
}

export function pdpVariantList(client: B2bSellersClient, productId: string, body: ShopwareCriteria = {}) {
  return client.invoke('pdpVariantList post /store-api/variant-list/{productId}', { pathParams: { productId }, body });
}

export function sendProductRequest(client: B2bSellersClient, productId: string, body: Record<string, unknown>) {
  return client.invoke('sendProductRequest post /store-api/product-request/{productId}/send', { pathParams: { productId }, body });
}

export function salesRepFastOrder(client: B2bSellersClient, body: Record<string, unknown> = {}) {
  return client.invoke('salesRepFastOrder post /store-api/sales-representative/fast-order', { body });
}

export function getSnippets(client: B2bSellersClient) {
  return client.invoke('getSnippets get /store-api/snippets');
}

export function listLoginTargets(client: B2bSellersClient) {
  return client.invoke('listLoginTargets get /store-api/login-targets');
}

/** Render a platform CMS page by id. */
export function getPlatformCms(client: B2bSellersClient, id: string) {
  return client.invoke('getPlatformCms get /store-api/platform-cms/{id}', { pathParams: { id } });
}

export function salesStatistics(client: B2bSellersClient, body: Record<string, unknown> = {}) {
  return client.invoke('salesStatistics post /store-api/sales-representative/sales-statistics', { body });
}

export function accountRequest(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('accountRequest post /store-api/account-request', { body });
}
