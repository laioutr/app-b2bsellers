import { defineNitroPlugin } from '#imports';
import type { H3Event } from 'h3';
import { useB2bSellersClient } from '../client/useB2bSellersClient';
import { CLIENT_CONTEXT_KEY } from '../const';

/**
 * Hand the request-scoped client to whoever else is installed, through the
 * request context.
 *
 * `useB2bSellersClient` is also a Nitro auto-import, which is enough for an app
 * built from workspace source. It is not enough for a released one: unimport
 * skips every file under `node_modules` (`defaultExcludes`), so an app that
 * reaches this connector through the bare identifier finds nothing there once
 * both are installed from the registry — and the failure looks like a missing
 * shop connection rather than a missing import.
 *
 * A context entry has no such blind spot: nothing resolves it at build time. It
 * stays a factory rather than a client so the cost is paid only by a request
 * that actually talks to the shop.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event: H3Event) => {
    event.context[CLIENT_CONTEXT_KEY] = () => useB2bSellersClient(event);
  });
});
