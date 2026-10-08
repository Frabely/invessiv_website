import type { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import type { HourPurchaseSource } from "@invessiv/common/constants/crm/hour-purchase-sources";

/** Direct mirror of the `customer_hour_purchases` row shape as Drizzle returns it. */
export interface HourPurchaseRow {
  id: string;
  customer_id: string;
  kind: HourPurchaseKind;
  source: HourPurchaseSource;
  minutes: number;
  purchased_on: string;
  note: string;
  idempotency_key: string;
  created_by_member_id: string;
  created_at: Date;
}
