/** Offer endpoints (incl. document, mail, status) of the B2B Sellers Store API. */
import type { B2bSellersClient } from '../client/b2bSellersClient';
import type { ShopwareCriteria } from '../types';

export function listOffers(client: B2bSellersClient, body: ShopwareCriteria = {}) {
  return client.invoke('listOffers post /store-api/offer/list', { body });
}

export function getOffer(client: B2bSellersClient, id: string) {
  return client.invoke('getOffer get /store-api/offer/{id}', { pathParams: { id } });
}

export function deleteOffer(client: B2bSellersClient, id: string) {
  return client.invoke('deleteOffer delete /store-api/offer/{id}', { pathParams: { id } });
}

export function convertOfferToOrder(client: B2bSellersClient, id: string, body: Record<string, unknown> = {}) {
  return client.invoke('convertOfferToOrder post /store-api/offer-order/{id}', { pathParams: { id }, body });
}

export function generateOfferDocument(client: B2bSellersClient, id: string, body: Record<string, unknown> = {}) {
  return client.invoke('generateOfferDocument post /store-api/offer-document/{id}', { pathParams: { id }, body });
}

export function sendOfferMail(client: B2bSellersClient, id: string, body: Record<string, unknown> = {}) {
  return client.invoke('sendOfferMail post /store-api/offer-mail/{id}', { pathParams: { id }, body });
}

export function offerMailTemplates(client: B2bSellersClient, body: { page?: number; limit?: number } = {}) {
  return client.invoke('offerMailTemplates post /store-api/offer-mail-templates', { body });
}

export function updateOfferStatus(client: B2bSellersClient, id: string, status: string) {
  return client.invoke('updateOfferStatus patch /store-api/offer/{id}/status', { pathParams: { id }, body: { status } });
}
