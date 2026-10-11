export interface PortalTimeEntryListQueryDto {
  /** A project the portal shows; absent lists the entries of every project of the company. */
  projectId?: string;
  /** `nextCursor` of the previous page; absent starts with the newest entry. */
  cursor?: string;
}
