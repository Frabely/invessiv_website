/** A task a customer contact creates for the team. The customer comes from the verified actor. */
export interface CreatePortalTaskRequestDto {
  /** The selected portal project; checked against the actor's visible current projects. */
  projectId: string;
  /** What the team should do; required and trimmed on the server. */
  title: string;
  /** Optional detail; an empty string when the contact wrote nothing. */
  description: string;
  /** Wished deadline as `YYYY-MM-DD`; null when the contact named none. A wish, not a promise. */
  dueOn: string | null;
}
