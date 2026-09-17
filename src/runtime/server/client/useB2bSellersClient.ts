import { getCookie, type H3Event, setCookie } from 'h3';
import { type B2bSellersClient, createB2bSellersClient } from './b2bSellersClient';
import { useRuntimeConfig } from '#imports';
import { APP_CONFIG_KEY } from '../const';
import { CONTEXT_TOKEN_COOKIE, CONTEXT_TOKEN_MAX_AGE } from '../const/cookieKeys';

/**
 * Runtime-config slice this module owns. The key mirrors the module
 * `configKey` (the package name). Kept local so this runtime util does not
 * import the build-time module definition.
 */
interface B2bSellersRuntimeConfig {
  endpoint?: string;
  accessToken?: string;
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
  const config = useRuntimeConfig(event)[APP_CONFIG_KEY] as B2bSellersRuntimeConfig | undefined;

  const client = createB2bSellersClient({
    baseUrl: config?.endpoint ?? '',
    accessToken: config?.accessToken ?? '',
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
