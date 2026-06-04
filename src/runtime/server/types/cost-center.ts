import type { ShopwareAuditFields } from './shared';

export interface CostCenter extends ShopwareAuditFields {
  name: string;
  number: string | null;
  customerId: string;
  active: boolean;
}
