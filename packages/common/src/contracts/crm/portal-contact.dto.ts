export interface PortalContactDto {
  /** Assignment ID, not the global person ID. */
  assignmentId: string;
  /** Contact label shown only inside the authorized CRM view. */
  displayName: string;
}
