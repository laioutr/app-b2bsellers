import type { ShopwareAuditFields } from './shared';

export type CustomerActivityTypeKey = 'note' | 'call' | 'email' | 'meeting' | 'task' | string;

export interface CustomerActivity extends ShopwareAuditFields {
  customerId: string;
  type: CustomerActivityTypeKey;
  subject: string;
  body: string | null;
  dueDate: string | null;
  done: boolean;
  employeeId: string | null;
}

export interface CustomerActivityType extends ShopwareAuditFields {
  key: string;
  name: string;
  icon: string | null;
}
