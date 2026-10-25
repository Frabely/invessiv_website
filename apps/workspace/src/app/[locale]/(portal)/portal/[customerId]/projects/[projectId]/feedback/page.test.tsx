// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import type { PortalProjectFeedbackDto } from "@invessiv/common/contracts/portal/portal-project-feedback.dto";
import type { FeedbackPageViewProps } from "@/components/portal/feedback/feedback-page-view/feedback-page-view";
import PortalFeedbackPage, { generateMetadata } from "./page";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  requirePortalReader: vi.fn(),
  getPortalProjectFeedback: vi.fn(),
  getPortalServices: vi.fn(),
  isPortalOwnerView: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  viewProps: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/server/portal/auth/require-portal-reader", () => ({
  requirePortalReader: mocks.requirePortalReader,
}));
vi.mock("@/server/portal/auth/portal-owner-view", () => ({
  isPortalOwnerView: mocks.isPortalOwnerView,
}));
vi.mock(
  "@/server/portal/query-handler/get-portal-project-feedback.query-handler",
  () => ({ getPortalProjectFeedback: mocks.getPortalProjectFeedback }),
);
vi.mock(
  "@/server/portal/query-handler/get-portal-services.query-handler",
  () => ({ getPortalServices: mocks.getPortalServices }),
);
vi.mock(
  "@/components/portal/feedback/feedback-page-view/feedback-page-view",
  () => ({
    FeedbackPageView: (props: FeedbackPageViewProps) => {
      mocks.viewProps(props);
      return <div data-testid="feedback" />;
    },
  }),
);

const READER = {
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: "customer-1",
  personId: "person-uuid-1",
  firstName: null,
  permissions: new Set([
    Permission.PortalFeedbackRead,
    Permission.PortalProjectsRead,
    Permission.PortalFilesWrite,
    Permission.PortalMessagesRead,
  ]),
  projectPermissions: new Map(),
};

const FEEDBACK: PortalProjectFeedbackDto = {
  projectId: "project-1",
  projectTitle: "Relaunch",
  quota: {
    included: 2,
    used: 0,
    remaining: 2,
    activeRoundNumber: null,
    approvedRoundNumber: null,
  },
  activeRound: null,
  history: [],
  canSubmit: true,
  canAttach: true,
  contact: null,
};

async function renderPage(customerId = "customer-1", projectId = "project-1") {
  render(
    await PortalFeedbackPage({
      params: Promise.resolve({ locale: "de", customerId, projectId }),
    }),
  );
  return mocks.viewProps.mock.calls.at(-1)![0] as FeedbackPageViewProps;
}

describe("PortalFeedbackPage", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockClear());
    mocks.requirePortalReader.mockResolvedValue(READER);
    mocks.getPortalProjectFeedback.mockResolvedValue(FEEDBACK);
    mocks.isPortalOwnerView.mockReturnValue(false);
    mocks.getPortalServices.mockResolvedValue(null);
  });

  afterEach(cleanup);

  it("loads the project's feedback for the resolved reader only", async () => {
    const props = await renderPage("CUSTOMER-1", "PROJECT-1");

    expect(mocks.requirePortalReader).toHaveBeenCalledWith("de", "customer-1");
    expect(mocks.getPortalProjectFeedback).toHaveBeenCalledWith(
      READER,
      "project-1",
    );
    expect(props.feedback).toBe(FEEDBACK);
    expect(props.canUpload).toBe(true);
    expect(props.cockpitHref).toBeNull();
    expect(props.dashboardHref).toBe("/de/portal/customer-1?project=project-1");
    expect(props.messagesHref).toBe(
      "/de/portal/customer-1?project=project-1&chat=open",
    );
  });

  it("loads no catalog while rounds are left", async () => {
    const props = await renderPage();

    expect(mocks.getPortalServices).not.toHaveBeenCalled();
    expect(props.extraRoundRequestHref).toBeNull();
  });

  it("links an exhausted quota to the further round of this project", async () => {
    mocks.getPortalProjectFeedback.mockResolvedValue({
      ...FEEDBACK,
      quota: { ...FEEDBACK.quota, used: 2, remaining: 0 },
    });
    mocks.getPortalServices.mockResolvedValue({
      services: [
        {
          id: "service-round",
          title: "Further feedback round",
          description: "One more round",
          kind: LineItemKind.FeedbackRound,
          projectMode: LineItemProjectMode.ExistingProject,
          projectIds: ["project-1"],
        },
      ],
      projects: [{ id: "project-1", title: "Relaunch" }],
      requests: [],
      canRequest: true,
    });

    const props = await renderPage();

    expect(mocks.getPortalServices).toHaveBeenCalledWith(READER);
    expect(props.extraRoundRequestHref).toBe(
      "/de/portal/customer-1?widget=serviceRequest&project=project-1&service=service-round",
    );
  });

  it("keeps the chat link when no further round can be requested", async () => {
    mocks.getPortalProjectFeedback.mockResolvedValue({
      ...FEEDBACK,
      quota: { ...FEEDBACK.quota, used: 2, remaining: 0 },
    });

    const props = await renderPage();

    expect(props.extraRoundRequestHref).toBeNull();
    expect(props.messagesHref).not.toBeNull();
  });

  it("answers 404 for a foreign, guessed or hidden project", async () => {
    mocks.getPortalProjectFeedback.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.viewProps).not.toHaveBeenCalled();
  });

  it("hides upload and chat link without their permissions", async () => {
    mocks.requirePortalReader.mockResolvedValue({
      ...READER,
      permissions: new Set([
        Permission.PortalFeedbackRead,
        Permission.PortalProjectsRead,
      ]),
    });

    const props = await renderPage();

    expect(props.canUpload).toBe(false);
    expect(props.messagesHref).toBeNull();
  });

  it("never lets the owner view upload and links it to the project in the CRM", async () => {
    mocks.isPortalOwnerView.mockReturnValue(true);

    const props = await renderPage();

    expect(props.canUpload).toBe(false);
    expect(props.cockpitHref).toBe(
      "/de/crm?cockpit=customer-1&project=project-1",
    );
  });

  it("returns localized no-index metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({
        locale: "en",
        customerId: "customer-1",
        projectId: "project-1",
      }),
    });

    expect(metadata.title).toBe("Feedback");
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });
});
