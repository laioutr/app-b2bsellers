import { createAPIClient } from '@shopware/api-client';
import type { B2bSellersOperations } from './operations';

/** Connection configuration for the B2B Sellers Store API. */
export interface B2bSellersClientConfig {
  /** Shop origin, e.g. `https://shop.example.com` (no `/store-api` suffix). */
  baseUrl: string;
  /** Shopware sales-channel access key (`sw-access-key`). */
  accessToken: string;
  /** Current `sw-context-token` (per session, read from the request cookie). */
  contextToken?: string;
}

/**
 * A configured `@shopware/api-client` instance typed against the B2B Sellers
 * operations. Created once per request via {@link createB2bSellersClient}.
 *
 * Use `client.invoke("<op> <method> /<path>", { pathParams, query, body })`;
 * the SDK applies `sw-access-key` / `sw-context-token` and rotates the context
 * token automatically.
 *
 * Typed off `createAPIClient` directly (not `ReturnType<typeof
 * createB2bSellersClient>`) so the generated `.d.ts` references
 * `@shopware/api-client` rather than ofetch-internal paths (avoids the
 * non-portable-inferred-type declaration error TS2742).
 */
export type B2bSellersClient = ReturnType<typeof createAPIClient<B2bSellersOperations>>;

export function createB2bSellersClient(config: B2bSellersClientConfig): B2bSellersClient {
  return createAPIClient<B2bSellersOperations>({
    baseURL: config.baseUrl,
    accessToken: config.accessToken,
    contextToken: config.contextToken,
  });
}
