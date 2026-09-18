/** Shopware context-token cookie (carries the `sw-context-token`). */
export const CONTEXT_TOKEN_COOKIE = 'b2bs-ctx-token';

/**
 * How long the context-token cookie survives, in seconds.
 *
 * The token is the customer's session with the shop; a short value logs people
 * out mid-demo, a long one keeps a stale token around after the shop has
 * dropped it. Thirty days matches Shopware's own storefront cookie.
 */
export const CONTEXT_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;
