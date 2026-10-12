export interface PortalServiceProjectOptionDto {
  /** Project a request may name; the server re-checks it against the service on write. */
  id: string;
  /** Title as released to the portal. */
  title: string;
}
