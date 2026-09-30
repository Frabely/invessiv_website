/** Path segments of the pages below one project: `/portal/[customerId]/projects/[projectId]/…`. */
export const PortalProjectPage = {
  Feedback: "feedback",
} as const;

export type PortalProjectPage =
  (typeof PortalProjectPage)[keyof typeof PortalProjectPage];

export const PORTAL_PROJECT_PAGE_VALUES = [PortalProjectPage.Feedback] as const;
