import type { ShopwareAuditFields } from './shared';

export type BudgetPeriodType = 'monthly' | 'quarterly' | 'yearly' | 'once' | string;

export interface Budget extends ShopwareAuditFields {
  name: string;
  customerId: string;
  employeeId: string | null;
  periodType: BudgetPeriodType;
  amount: number;
  spent: number;
  remaining: number;
  active: boolean;
}

export interface BudgetOrder extends ShopwareAuditFields {
  budgetId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
}

export interface BudgetPeriodTypeOption {
  key: BudgetPeriodType;
  label: string;
}
