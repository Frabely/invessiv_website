import path from "node:path";

export const portalE2ePaths = {
  directory: path.join(process.cwd(), ".playwright"),
  fixture: path.join(process.cwd(), ".playwright", "portal-fixture.json"),
  managerState: path.join(process.cwd(), ".playwright", "portal-manager.json"),
  contactAState: path.join(
    process.cwd(),
    ".playwright",
    "portal-contact-a.json",
  ),
  contactBState: path.join(
    process.cwd(),
    ".playwright",
    "portal-contact-b.json",
  ),
  filesContactState: path.join(
    process.cwd(),
    ".playwright",
    "portal-files-contact.json",
  ),
  feedbackContactState: path.join(
    process.cwd(),
    ".playwright",
    "portal-feedback-contact.json",
  ),
} as const;

export type PortalE2eFixture = {
  customerA: string;
  customerB: string;
  filesCustomer: string;
  /** Isolated customer for credential grants, releases and revocation. */
  credentialsCustomer: string;
  credentialsProject: string;
  credentialsHiddenProject: string;
  credentialsMembership: string;
  credentialsRole: string;
  standardRole: string;
  /** Shared by the files contact (A) and the feedback contact (B). */
  feedbackCustomer: string;
  /** Active project right before its first round step. */
  feedbackProject: string;
  /** Second project for the approval without changes. */
  feedbackApprovalProject: string;
  /** Active project of the feedback customer without a form; the onboarding flow starts one. */
  onboardingProject: string;
  /** Dedicated active project for the customer task browser flow. */
  taskProject: string;
  /** Released customer-side task the portal contact can complete and reopen. */
  customerTaskId: string;
  assignmentA: string;
  assignmentB: string;
  assignmentOther: string;
  expiredToken: string;
};
