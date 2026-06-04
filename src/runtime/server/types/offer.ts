import type { ShopwareAuditFields, ShopwareMoney } from './shared';

export type OfferState = 'open' | 'accepted' | 'declined' | 'expired';

export interface OfferLineItem {
  id: string;
  productId: string | null;
  label: string;
  quantity: number;
  unitPrice: ShopwareMoney | null;
  totalPrice: ShopwareMoney | null;
}

export interface Offer extends ShopwareAuditFields {
  offerNumber: string;
  state: OfferState;
  validUntil: string | null;
  customerId: string;
  lineItems: OfferLineItem[];
  price: ShopwareMoney | null;
  comment: string | null;
}

export interface OfferMailTemplate extends ShopwareAuditFields {
  name: string;
  subject: string;
  contentHtml: string | null;
  contentPlain: string | null;
}
