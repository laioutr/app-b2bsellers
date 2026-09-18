import { defineOrchestr } from '#imports';
import { useB2bSellersClient } from '../client/useB2bSellersClient';

/**
 * Orchestr middleware for the B2B Sellers connector. Builds the request-scoped
 * client once and exposes it as `context.client` to every handler, so
 * individual handlers don't each wire up `useB2bSellersClient(event)`.
 *
 * The token-bound handler layer (queries/actions/resolvers) is added in a
 * later iteration once the B2B Sellers Orchestr tokens + canonical entity
 * types exist — see REQUIREMENTS-ORCHESTR.md. The binders below are exported
 * already so that layer can attach to this middleware unchanged.
 */
export const defineB2bSellers = defineOrchestr
  .meta({
    app: 'b2bsellers',
    label: 'B2B Sellers',
  })
  .extendRequest(async ({ event }) => ({
      context: {
        client: useB2bSellersClient(event),
      },
    }));

export const defineB2bSellersQuery = defineB2bSellers.queryHandler;
export const defineB2bSellersAction = defineB2bSellers.actionHandler;
export const defineB2bSellersLink = defineB2bSellers.linkHandler;
export const defineB2bSellersComponentResolver = defineB2bSellers.componentResolver;
