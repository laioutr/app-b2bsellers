/** Spare-parts endpoint of the B2B Sellers Store API (`/store-api/b2b/...`). */
import type { B2bSellersClient } from '../client/b2bSellersClient';

export function similarProducts(client: B2bSellersClient, productId: string) {
  return client.invoke('similarProducts post /store-api/b2b/property-similar-products/{productId}', { pathParams: { productId } });
}
