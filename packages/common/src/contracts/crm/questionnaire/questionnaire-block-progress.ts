/** Required-field progress of one block; drives the step indicator. */
export interface QuestionnaireBlockProgress {
  blockId: string;
  answeredRequired: number;
  totalRequired: number;
}
