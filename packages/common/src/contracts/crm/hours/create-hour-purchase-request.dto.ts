import type { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";

/** Records purchased hours for a customer, or corrects them downwards. */
export interface CreateHourPurchaseRequestDto {
  /** Created once when the dialog opens; a repeated request with it returns the first row instead of a second one. */
  idempotencyKey: string;
  /** Decides the sign the server expects on `minutes`. */
  kind: HourPurchaseKind;
  /** Signed whole minutes: positive for a purchase, negative for a correction. */
  minutes: number;
  /** Calendar day (`YYYY-MM-DD`), never in the future. */
  purchasedOn: string;
  /** Customer-visible label; send an empty string for none. */
  note: string;
}
