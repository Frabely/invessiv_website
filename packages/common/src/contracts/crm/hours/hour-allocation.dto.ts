/** One immutable movement between the customer's free hours and a project. */
export interface HourAllocationDto {
  /** Id of the ledger row; nothing addresses it, it only keys the list. */
  id: string;
  /** Project the hours were allocated to or released from. */
  projectId: string;
  /** Signed whole minutes: positive allocates free hours, negative releases unused ones. */
  minutes: number;
  /** Internal remark; empty string when nothing was noted. Never shown in the portal. */
  note: string;
  /** Internal author. Never part of a portal contract. */
  createdByMemberId: string;
  /** When the row was written, as ISO timestamp. */
  createdAt: string;
}
