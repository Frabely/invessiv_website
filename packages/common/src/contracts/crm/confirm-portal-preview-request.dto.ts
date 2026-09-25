export interface ConfirmPortalPreviewRequestDto {
  /** Expected customer version; prevents overwriting a concurrent CRM change. */
  version: number;
}
