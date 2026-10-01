/** Swaps a group entry with its neighbour within its group. */
export interface MovePortalOnboardingGroupEntryRequestDto {
  /** -1 moves up, 1 moves down; past either end nothing changes. */
  direction: -1 | 1;
}
