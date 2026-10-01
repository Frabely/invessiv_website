import type { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";

/** What the onboarding needs to know about its project. */
export type OnboardingProjectRef = {
  id: string;
  customerId: string;
  status: ProjectStatus;
};
