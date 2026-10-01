/** Removes a field with its sub-fields and options; a field another one depends on stays. */
export interface DeleteQuestionnaireFieldRequestDto {
  /** Block version the client last read; every field change bumps it. */
  expectedBlockVersion: number;
}
