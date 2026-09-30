/** One catalog block in the ordered selection of a template. */
export interface OnboardingTemplateBlockDto {
  /** Catalog block id; a template never references a block owned by a form. */
  blockId: string;
  /** Order within the template, starting at 0. */
  position: number;
}
