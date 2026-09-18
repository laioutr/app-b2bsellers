import type { ShopwareAuditFields } from './shared';

/**
 * A shipping or payment method as the Store API lists it.
 *
 * Both routes answer the same envelope over the same fields, so one shape
 * covers them. `translated.name` is what a storefront shows — the untranslated
 * `name` is the admin's label and stays German on an English session.
 */
export interface ShopwareMethod extends ShopwareAuditFields {
  name: string;
  active?: boolean;
  description?: string | null;
  position?: number;
  translated?: { name?: string; description?: string | null };
}

export interface ShippingMethod extends ShopwareMethod {
  deliveryTimeId?: string | null;
  taxType?: string;
}

export interface PaymentMethod extends ShopwareMethod {
  /** Set when the method cannot be used with the current cart or customer. */
  afterOrderEnabled?: boolean;
  shortName?: string;
  technicalName?: string;
}
