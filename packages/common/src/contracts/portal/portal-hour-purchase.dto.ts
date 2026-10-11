/** One row of the company's purchase history. It carries no id: nothing addresses a single row. */
export interface PortalHourPurchaseDto {
  /** Calendar day (`YYYY-MM-DD`) the hours count from, chosen by the team. */
  purchasedOn: string;
  /** Signed whole minutes: positive for a purchase, negative for a correction. */
  minutes: number;
  /** True for a correction row; the sign alone would not tell why the stock shrank. */
  isCorrection: boolean;
  /** Label written for the customer; empty string when nothing was noted, never null. */
  note: string;
}
