export interface PortalCompletedProjectDto {
  /** Project identifier used to select its detail. */
  id: string;
  /** Customer-visible name of the completed project. */
  title: string;
  /** Optional preview or live link configured for this project. */
  previewUrl: string | null;
}
