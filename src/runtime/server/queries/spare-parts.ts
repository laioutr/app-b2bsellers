/** Spare-parts endpoint (/b2b prefix) of the B2B Sellers Store API. */
import type { B2bSellersClient } from '../client/b2bSellersClient';

export function similarProducts(client: B2bSellersClient, productId: string, body: Record<string, unknown> = {}) {
  return client.invoke('similarProducts post /b2b/property-similar-products/{productId}', { pathParams: { productId }, body });
}
