/** Customer sales-ranking endpoint of the B2B Sellers Store API. */
import type { B2bSellersClient } from '../client/b2bSellersClient';

export function customerSalesRanking(client: B2bSellersClient, body: Record<string, unknown> = {}) {
  return client.invoke('customerSalesRanking post /store-api/customer-sales-ranking', { body });
}
