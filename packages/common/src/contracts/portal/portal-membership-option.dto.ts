/**
 * One company a signed-in portal user can enter. Deliberately carries nothing beyond what the
 * company picker needs — no role or permission data, since those are re-resolved per request by
 * `requirePortalActor` once a company is chosen.
 */
export interface PortalMembershipOptionDto {
  /** `customers.id`; the path segment the picker links to. */
  customerId: string;
  /** Display name to recognise the company by. */
  displayName: string;
}
