/** Swaps a field with its neighbour on the same level. */
export interface MoveQuestionnaireFieldRequestDto {
  /** -1 moves up, 1 moves down; past either end nothing changes. */
  direction: -1 | 1;
  /** Block version the client last read; every field change bumps it. */
  expectedBlockVersion: number;
}
