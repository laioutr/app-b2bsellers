import { getCookie, type H3Event } from 'h3';
import { type B2bSellersClient, createB2bSellersClient } from './b2bSellersClient';
import { useRuntimeConfig } from '#imports';
import { APP_CONFIG_KEY } from '../const';
import { CONTEXT_TOKEN_COOKIE } from '../const/cookieKeys';

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
 * `runtimeConfig[APP_CONFIG_KEY]` by frontend-core. The `sw-context-token` is
 * read from the request cookie so per-session context is honoured.
 *
 * @param event - the current H3 request event. Omit only outside a request.
 */
export function useB2bSellersClient(event?: H3Event): B2bSellersClient {
  const config = useRuntimeConfig(event)[APP_CONFIG_KEY] as B2bSellersRuntimeConfig | undefined;

  return createB2bSellersClient({
    baseUrl: config?.endpoint ?? '',
    accessToken: config?.accessToken ?? '',
    contextToken: event ? getCookie(event, CONTEXT_TOKEN_COOKIE) : undefined,
  });
}
