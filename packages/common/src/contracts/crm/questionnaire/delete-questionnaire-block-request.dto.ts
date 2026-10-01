/** Deletes a catalog block that no template uses; a used block can only be archived. */
export interface DeleteQuestionnaireBlockRequestDto {
  /** Block version the client last read; a stale value answers with a 409 and the current block. */
  version: number;
}
