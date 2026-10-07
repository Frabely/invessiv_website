export interface DeleteCredentialRequestDto {
  /** Version the viewer saw; deleting a row someone changed meanwhile answers with a conflict. */
  version: number;
}
