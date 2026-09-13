/**
 * Visibility flags for lead actions, derived once on the server from the actor. Hiding an action
 * is a courtesy against dead buttons; the API routes still reject a missing permission.
 */
export interface LeadActionPermissions {
  /** `leads.write`: create, edit, archive and bulk edit. */
  canWrite: boolean;
  /** `leads.delete`: single and bulk delete. */
  canDelete: boolean;
  /** `leads.import`: CSV import. */
  canImport: boolean;
  /** `outreach.generate`: outreach drafts in table, detail panel and form. */
  canGenerateOutreach: boolean;
}
