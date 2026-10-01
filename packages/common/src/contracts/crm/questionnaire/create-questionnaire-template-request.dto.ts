/** Creates an empty, active template; blocks are chosen in the template editor. */
export interface CreateQuestionnaireTemplateRequestDto {
  /** Internal name; not translated because customers never see it. */
  title: string;
  /** Internal note on when to use the template; null or blank leaves it out. */
  description: string | null;
}
