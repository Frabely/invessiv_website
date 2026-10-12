/** Fields of the service request form that can carry a validation message. */
export const PortalServiceRequestFormField = {
  Title: "title",
  Note: "note",
  Hours: "hours",
  Project: "project",
} as const;

export type PortalServiceRequestFormField =
  (typeof PortalServiceRequestFormField)[keyof typeof PortalServiceRequestFormField];

/** Whole hours the form offers as one-click amounts. */
export const PORTAL_SERVICE_REQUEST_QUICK_HOURS = [5, 10, 20] as const;
