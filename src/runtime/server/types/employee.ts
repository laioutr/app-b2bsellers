import type { ShopwareAuditFields } from './shared';

/** A B2B employee role with its granted permission keys. */
export interface EmployeeRole extends ShopwareAuditFields {
  name: string;
  description: string | null;
  permissions: string[];
}

/** A B2B employee belonging to a business customer account. */
export interface Employee extends ShopwareAuditFields {
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  businessPartnerCustomerId: string;
  roleId: string | null;
  role?: EmployeeRole | null;
}

/** A single assignable permission. */
export interface EmployeePermission {
  key: string;
  name: string;
  group: string;
}

/** An order placed by / on behalf of an employee. */
export interface EmployeeOrder extends ShopwareAuditFields {
  orderNumber: string;
  amountTotal: number;
  stateName: string;
  employeeId: string | null;
}
