export const ProjectPhase = {
  Onboarding: "onboarding",
  Design: "design",
  Development: "development",
  Feedback: "feedback",
  Launch: "launch",
  Maintenance: "maintenance",
} as const;

export type ProjectPhase = (typeof ProjectPhase)[keyof typeof ProjectPhase];

export const PROJECT_PHASE_SEQUENCE = [
  ProjectPhase.Onboarding,
  ProjectPhase.Design,
  ProjectPhase.Development,
  ProjectPhase.Feedback,
  ProjectPhase.Launch,
  ProjectPhase.Maintenance,
] as const;
