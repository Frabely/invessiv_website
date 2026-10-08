import type { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import type { HourPurchaseSource } from "@invessiv/common/constants/crm/hour-purchase-sources";

/** One immutable row of the customer's purchase ledger. There is no update or delete for it. */
export interface HourPurchaseDto {
  /** Id of the ledger row; nothing addresses it, it only keys the list. */
  id: string;
  /** A correction always carries negative minutes, a purchase positive ones. */
  kind: HourPurchaseKind;
  /** How the row came to be; today always entered by hand. */
  source: HourPurchaseSource;
  /** Signed whole minutes, a multiple of the booking step. */
  minutes: number;
  /** Calendar day (`YYYY-MM-DD`) the hours count from; chosen by the member, not the insert time. */
  purchasedOn: string;
  /** Customer-visible label; empty string when nothing was noted, never null. */
  note: string;
  /** Internal author. Never part of a portal contract. */
  createdByMemberId: string;
  /** When the row was written, as ISO timestamp; breaks ties between rows of the same day. */
  createdAt: string;
}
