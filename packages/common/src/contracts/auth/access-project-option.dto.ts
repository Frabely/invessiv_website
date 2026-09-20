/**
 * A project as offered when granting access. Deliberately carries nothing beyond identification:
 * the lookup is not scope-filtered, so it must never leak CRM content.
 */
export interface AccessProjectOptionDto {
  /** `projects.id`; the value a project-level grant addresses. */
  id: string;
  /** Owning customer. A project-level grant must name the same customer or the server rejects it. */
  customerId: string;
  /** Title to recognise the project by. */
  title: string;
}
