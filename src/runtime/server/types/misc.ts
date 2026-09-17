import type { ShopwareAuditFields } from './shared';

export interface CustomerProductNumber extends ShopwareAuditFields {
  customerId: string;
  productId: string;
  customerProductNumber: string;
}

