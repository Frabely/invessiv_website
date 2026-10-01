/** Swaps a block with its neighbour in the step order of a form. */
export interface MoveOnboardingFormBlockRequestDto {
  /** -1 moves up, 1 moves down; past either end nothing changes. */
  direction: -1 | 1;
  /** Form version the client last read; a stale value answers with a 409 and the current form. */
  expectedFormVersion: number;
}
