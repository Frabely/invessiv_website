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
} as const;

export type PortalE2eFixture = {
  customerA: string;
  customerB: string;
  assignmentA: string;
  assignmentB: string;
  assignmentOther: string;
  expiredToken: string;
};
