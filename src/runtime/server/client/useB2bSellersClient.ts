import { getCookie, type H3Event, setCookie } from 'h3';
import { type B2bSellersClient, createB2bSellersClient } from './b2bSellersClient';
import { useRuntimeConfig } from '#imports';
import { type AppConfig, resolveConnectionConfig } from '../config';
import { APP_CONFIG_KEY } from '../const';
import { CONTEXT_TOKEN_COOKIE, CONTEXT_TOKEN_MAX_AGE } from '../const/cookieKeys';

/**
 * The validated connection, resolved once per process.
 *
 * The generic handler applies the precedence (injected project config → env var
 * → fail) and validates against the manifest; this only supplies the injected
 * config and caches the success, so a misconfiguration keeps failing loudly
 * until it is fixed rather than being cached.
 */
let validated: AppConfig | undefined;
function resolveConnection(event?: H3Event): AppConfig {
  if (validated) return validated;
  const injected = useRuntimeConfig(event)[APP_CONFIG_KEY] as Partial<AppConfig> | undefined;
  validated = resolveConnectionConfig(injected);
  return validated;
}

/**
 * Build an authenticated {@link B2bSellersClient} from the server runtime
 * config. Auto-imported in Nitro (server routes, Orchestr handlers).
 *
 * The connection (`endpoint`, `accessToken`) is delivered through the Laioutr
 * project config: each `laioutrrc.json` app entry's `config` is injected into
 * `runtimeConfig[APP_CONFIG_KEY]` by frontend-core.
 *
 * ## Context-token lifecycle
 *
 * Nearly every B2B route answers 403 without a customer session, so the
 * `sw-context-token` matters as much as the access key. It is read from the
 * request cookie on the way in, and written back on the way out: the SDK fires
 * `onContextChanged` whenever the shop rotates the token — on login, on logout,
 * and whenever the sales-channel context changes — and the hook below persists
 * the new value so the next request carries it.
 *
 * Without that hook a login would succeed and then be forgotten one request
 * later.
 *
 * @param event - the current H3 request event. Omit only outside a request, in
 * which case no session is attached and only public routes will answer.
 */
export function useB2bSellersClient(event?: H3Event): B2bSellersClient {
  const config = resolveConnection(event);

  const client = createB2bSellersClient({
    baseUrl: config.endpoint,
    accessToken: config.accessToken,
    contextToken: event ? getCookie(event, CONTEXT_TOKEN_COOKIE) : undefined,
  });

  if (event) {
    client.hook('onContextChanged', (contextToken: string) => {
      setCookie(event, CONTEXT_TOKEN_COOKIE, contextToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: !import.meta.dev,
        path: '/',
        maxAge: CONTEXT_TOKEN_MAX_AGE,
      });
    });
  }

  return client;
}
