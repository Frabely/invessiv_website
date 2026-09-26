export const PortalWidgetKey = {
  Onboarding: "onboarding",
  Project: "project",
  CustomerTasks: "customerTasks",
  OurTasks: "ourTasks",
  Feedback: "feedback",
  Hours: "hours",
  Contact: "contact",
  Files: "files",
  ServiceRequest: "serviceRequest",
  CompletedProjects: "completedProjects",
} as const;

export type PortalWidgetKey =
  (typeof PortalWidgetKey)[keyof typeof PortalWidgetKey];

export const PORTAL_WIDGET_KEY_VALUES = [
  PortalWidgetKey.Onboarding,
  PortalWidgetKey.Project,
  PortalWidgetKey.CustomerTasks,
  PortalWidgetKey.OurTasks,
  PortalWidgetKey.Feedback,
  PortalWidgetKey.Hours,
  PortalWidgetKey.Contact,
  PortalWidgetKey.Files,
  PortalWidgetKey.ServiceRequest,
  PortalWidgetKey.CompletedProjects,
] as const;
