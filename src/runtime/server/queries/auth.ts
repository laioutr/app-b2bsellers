/**
 * Authentication endpoints of the B2B Sellers Store API.
 *
 * Every other route in this connector answers 403 without a customer session,
 * so {@link login} is the entry point. The shop returns a `contextToken`; the
 * caller is responsible for persisting it — `defineB2bSellers` does that via
 * `persistContextToken`, so handlers built on the middleware get it for free.
 */
import type { B2bSellersClient } from '../client/b2bSellersClient';
import type { ShopwareCriteria } from '../types';

/** Log a customer in and obtain the `sw-context-token` for the session. */
export function login(client: B2bSellersClient, username: string, password: string) {
  return client.invoke('login post /store-api/account/login', { body: { username, password } });
}

/** End the current customer session. */
export function logout(client: B2bSellersClient) {
  return client.invoke('logout post /store-api/account/logout');
}

/** The current sales-channel context (currency, language, customer, …). */
export function getContext(client: B2bSellersClient) {
  return client.invoke('getContext get /store-api/context');
}

/** The logged-in customer. */
export function getCurrentCustomer(client: B2bSellersClient, body: ShopwareCriteria = {}) {
  return client.invoke('getCurrentCustomer post /store-api/account/customer', { body });
}
