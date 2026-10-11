import type { HourPurchaseKind } from "../../../constants/crm/hour-purchase-kinds";
import type { HourPurchaseSource } from "../../../constants/crm/hour-purchase-sources";

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
