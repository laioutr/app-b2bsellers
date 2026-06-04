import type { ShopwareAuditFields } from './shared';

export interface CustomerProductNumber extends ShopwareAuditFields {
  customerId: string;
  productId: string;
  customerProductNumber: string;
}

export interface ProductSubscription extends ShopwareAuditFields {
  customerId: string;
  productId: string;
  quantity: number;
  interval: string;
  nextDeliveryDate: string | null;
  active: boolean;
}

export interface DeliveryInterval {
  key: string;
  label: string;
}
