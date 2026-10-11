import type { HourPurchaseKind } from "../../../constants/crm/hour-purchase-kinds";

/** The columns of `customer_hour_purchases` the portal selects; the author never leaves the database. */
export interface PortalHourPurchaseRow {
  kind: HourPurchaseKind;
  minutes: number;
  purchased_on: string;
  note: string;
}
