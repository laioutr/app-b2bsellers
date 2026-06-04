import type { ShopwareAuditFields, ShopwareMoney } from './shared';

export interface B2bCustomer extends ShopwareAuditFields {
  customerNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  vatIds: string[];
  active: boolean;
  groupId: string;
}

export interface CustomerLastOrder extends ShopwareAuditFields {
  orderNumber: string;
  amountTotal: number;
  currencyId: string;
  stateName: string;
}

export interface CustomerPrice {
  productId: string;
  price: ShopwareMoney;
  quantityStart: number;
  quantityEnd: number | null;
}

export interface CustomerSalesRankingEntry {
  customerId: string;
  customerNumber: string;
  amountTotal: number;
  orderCount: number;
  rank: number;
}
