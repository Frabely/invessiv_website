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
  /** Shared by the files contact (A) and the feedback contact (B). */
  feedbackCustomer: string;
  /** Active project right before its first round step. */
  feedbackProject: string;
  /** Second project for the approval without changes. */
  feedbackApprovalProject: string;
  assignmentA: string;
  assignmentB: string;
  assignmentOther: string;
  expiredToken: string;
};
