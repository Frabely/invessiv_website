/** Progress of one block; drives the step indicator. */
export interface QuestionnaireBlockProgress {
  blockId: string;
  answeredRequired: number;
  totalRequired: number;
  /** Visible questions with any answer, required or not. A group counts once, plus its sub-fields per entry. */
  answered: number;
  /** All visible questions of the block; never decides whether a form may be submitted. */
  total: number;
}
