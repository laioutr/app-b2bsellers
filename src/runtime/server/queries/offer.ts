/**
 * Offer endpoints (incl. document, mail, states) of the B2B Sellers Store API.
 *
 * There is no offer-status route in the installed version: an offer's status
 * changes through {@link updateOffer}. Deleting one is a sales-rep route.
 */
import type { B2bSellersClient } from '../client/b2bSellersClient';
import type { ShopwareCriteria } from '../types';

export function listOffers(client: B2bSellersClient, body: ShopwareCriteria = {}) {
  return client.invoke('listOffers post /store-api/offer/list', { body });
}

export function getOffer(client: B2bSellersClient, id: string) {
  return client.invoke('getOffer get /store-api/offer/{id}', { pathParams: { id } });
}

/** Update an offer — including its status. */
export function updateOffer(client: B2bSellersClient, id: string, body: Record<string, unknown>) {
  return client.invoke('updateOffer put /store-api/offer/{id}', { pathParams: { id }, body });
}

export function convertOfferToOrder(client: B2bSellersClient, id: string, body: Record<string, unknown> = {}) {
  return client.invoke('convertOfferToOrder post /store-api/offer-order/{id}', { pathParams: { id }, body });
}

export function generateOfferDocument(client: B2bSellersClient, id: string) {
  return client.invoke('generateOfferDocument get /store-api/offer-document/{id}', { pathParams: { id } });
}

export function sendOfferMail(client: B2bSellersClient, id: string, body: Record<string, unknown> = {}) {
  return client.invoke('sendOfferMail post /store-api/offer-mail/{id}', { pathParams: { id }, body });
}

export function listOfferStates(client: B2bSellersClient, body: ShopwareCriteria = {}) {
  return client.invoke('listOfferStates post /store-api/offer-states', { body });
}
