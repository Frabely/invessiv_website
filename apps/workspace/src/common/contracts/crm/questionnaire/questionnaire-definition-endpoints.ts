/**
 * Where an owner of blocks answers the writes of the block editor. The catalog and every form
 * have the same operations under different paths, so the client behind the editor is built once
 * from these.
 */
export interface QuestionnaireDefinitionEndpoints {
  /** The block itself: `PATCH` changes its head. */
  block(blockId: string): string;
  /** The fields of a block: `POST` appends one. */
  blockFields(blockId: string): string;
  /** One field: `PATCH` changes it, `DELETE` removes it. */
  field(fieldId: string): string;
  /** `POST` moves a field one step up or down. */
  fieldMove(fieldId: string): string;
}
