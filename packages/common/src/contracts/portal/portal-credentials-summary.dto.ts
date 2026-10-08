/**
 * What the dashboard widget knows about the company's credentials: a number and what its buttons
 * may offer. Never a title, login name or value — those are loaded only when the dialog opens.
 */
export interface PortalCredentialsSummaryDto {
  /** Released entries the viewer may see. */
  count: number;
  /** Offers "add credential" in the widget. Always false in the owner's read-only view. */
  canWrite: boolean;
  /** False without an encryption key on the server: adding is offered but inert. */
  configured: boolean;
}
