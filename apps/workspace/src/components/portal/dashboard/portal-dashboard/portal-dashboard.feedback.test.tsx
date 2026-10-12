// @vitest-environment jsdom
import "@/test/portal/dashboard/portal-dashboard-mocks";
import "@testing-library/jest-dom/vitest";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import {
  setupPortalDashboardTests,
  portalDashboardTestContext,
} from "@/test/portal/dashboard/portal-dashboard-test-support";
const { content, FULL_READ, dto, renderDashboard } =
  portalDashboardTestContext();
setupPortalDashboardTests();
describe("PortalDashboard feedback", () => {
  it("shows each feedback round at its own place in the project track", () => {
    renderDashboard();

    const track = screen.getByRole("list", { name: "Project progress" });
    expect(
      [...track.querySelectorAll("li")].map(
        (item) => item.querySelector("[title]")?.textContent,
      ),
    ).toEqual([
      "Design",
      "Feedback round 1",
      "Build",
      "Feedback round 2",
      "Launch",
    ]);
  });
  it("marks the running round as the current step of the track", () => {
    const base = dto();
    renderDashboard({
      dashboard: dto({
        project: {
          ...base.project!,
          currentProcessStep: "Design",
          roundProgress: {
            activeRoundNumber: 1,
            completedRoundNumber: null,
            approvedRoundNumber: null,
          },
        },
      }),
    });

    const track = screen.getByRole("list", { name: "Project progress" });
    expect(track.querySelector('[aria-current="step"]')).toHaveTextContent(
      "Feedback round 1",
    );
  });
  it("shows whose turn it is and links to the feedback page", () => {
    renderDashboard({
      dashboard: dto({
        feedback: {
          projectId: "project-1",
          projectTitle: "Relaunch",
          roundNumber: 1,
          status: FeedbackRoundStatus.Open,
          dueOn: "2026-10-14",
          approvedAt: null,
          included: 2,
          used: 1,
        },
      }),
      permissions: new Set([...FULL_READ, Permission.PortalFeedbackRead]),
    });

    const widget = screen.getByRole("region", {
      name: content.widgets.feedback.title,
    });
    expect(widget).not.toHaveAttribute("data-mock", "true");
    expect(within(widget).getByText("Round 1 of 2")).toBeInTheDocument();
    expect(
      within(widget).getByText(content.widgets.feedback.turn.open),
    ).toBeInTheDocument();
    expect(
      within(widget).getByRole("link", { name: "Give feedback on Relaunch" }),
    ).toHaveAttribute(
      "href",
      "/en/portal/customer-1/projects/project-1/feedback?project=project-1",
    );
    expect(
      screen.getByRole("link", { name: content.widgets.feedback.projectLink }),
    ).toHaveAttribute(
      "href",
      "/en/portal/customer-1/projects/project-1/feedback?project=project-1",
    );
  });
  it("asks for the approval after the last round", () => {
    renderDashboard({
      dashboard: dto({
        feedback: {
          projectId: "project-1",
          projectTitle: "Relaunch",
          roundNumber: 2,
          status: FeedbackRoundStatus.Completed,
          dueOn: null,
          approvedAt: null,
          included: 2,
          used: 2,
        },
      }),
      permissions: new Set([...FULL_READ, Permission.PortalFeedbackRead]),
    });

    const widget = screen.getByRole("region", {
      name: content.widgets.feedback.title,
    });
    expect(
      within(widget).getByText(content.widgets.feedback.turn.approvalDue),
    ).toBeInTheDocument();
    expect(
      within(widget).getByRole("link", { name: "Approve Relaunch" }),
    ).toHaveAttribute("data-primary", "true");
  });
  it("dates the approval once the project is approved", () => {
    renderDashboard({
      dashboard: dto({
        feedback: {
          projectId: "project-1",
          projectTitle: "Relaunch",
          roundNumber: 1,
          status: FeedbackRoundStatus.Approved,
          dueOn: null,
          approvedAt: "2026-09-25T09:00:00.000Z",
          included: 2,
          used: 1,
        },
      }),
      permissions: new Set([...FULL_READ, Permission.PortalFeedbackRead]),
    });

    const widget = screen.getByRole("region", {
      name: content.widgets.feedback.title,
    });
    expect(within(widget).getByText(/^Approved on /)).toBeInTheDocument();
    expect(
      within(widget).getByRole("link", { name: "View feedback on Relaunch" }),
    ).toBeInTheDocument();
  });
  it("explains the feedback area while the project has no round steps", () => {
    renderDashboard({
      dashboard: dto({ feedback: null }),
      permissions: new Set([...FULL_READ, Permission.PortalFeedbackRead]),
    });

    expect(
      screen.getByText(content.widgets.feedback.emptyTitle),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: content.widgets.feedback.projectLink,
      }),
    ).not.toBeInTheDocument();
  });
  it("renders no feedback widget without portal.feedback.read", () => {
    renderDashboard({ dashboard: dto({ feedback: null }) });

    expect(
      screen.queryByRole("region", { name: content.widgets.feedback.title }),
    ).not.toBeInTheDocument();
  });
});
