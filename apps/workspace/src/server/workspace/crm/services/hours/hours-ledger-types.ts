import type { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import type { HourPurchaseSource } from "@invessiv/common/constants/crm/hour-purchase-sources";

export type InsertHourPurchaseInput = {
  customerId: string;
  kind: HourPurchaseKind;
  source: HourPurchaseSource;
  minutes: number;
  purchasedOn: string;
  note: string;
  idempotencyKey: string;
  createdByMemberId: string;
};

export type InsertHourAllocationInput = {
  customerId: string;
  projectId: string;
  minutes: number;
  note: string;
  idempotencyKey: string;
  createdByMemberId: string;
};
