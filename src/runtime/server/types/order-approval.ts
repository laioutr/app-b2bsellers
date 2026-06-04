import type { ShopwareAuditFields } from './shared';

export type ApproverStatus = 'pending' | 'approved' | 'declined' | string;

export interface OrderApprovalApprover {
  employeeId: string;
  status: ApproverStatus;
  decidedAt: string | null;
}

export interface OrderApprovalActivityEntry {
  id: string;
  type: string;
  employeeId: string | null;
  message: string | null;
  createdAt: string;
}

export interface OrderApproval extends ShopwareAuditFields {
  orderId: string | null;
  customerId: string;
  requesterId: string;
  status: ApproverStatus;
  amountTotal: number;
  approvers: OrderApprovalApprover[];
}

export interface OrderApprovalSettings {
  customerId: string;
  enabled: boolean;
  threshold: number | null;
  approverEmployeeIds: string[];
}
