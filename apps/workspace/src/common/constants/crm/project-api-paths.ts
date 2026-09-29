/** Path segment of project routes, shared by the CRM and the portal API. */
export const ProjectApiPath = {
  Projects: "projects",
} as const;

export type ProjectApiPath =
  (typeof ProjectApiPath)[keyof typeof ProjectApiPath];
