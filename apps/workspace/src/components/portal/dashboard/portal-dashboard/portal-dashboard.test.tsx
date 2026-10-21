// @vitest-environment jsdom
import "@/test/portal/dashboard/portal-dashboard-mocks";
import "@testing-library/jest-dom/vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import {
  setupPortalDashboardTests,
  portalDashboardTestContext,
} from "@/test/portal/dashboard/portal-dashboard-test-support";
const {
  mocks,
  content,
  CONVERSATION,
  FILES_WIDGET_NAME,
  FILES,
  FULL_READ,
  dto,
  renderDashboard,
  ourTasksWidget,
  CAN_CREATE,
} = portalDashboardTestContext();
setupPortalDashboardTests();
describe("PortalDashboard composition", () => {
  it("renders the project with its step, next step and preview link", () => {
    renderDashboard();

    expect(screen.getByText("Step 3 of 5")).toBeInTheDocument();
    expect(screen.getByText("First version")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open preview/ })).toHaveAttribute(
      "href",
      "https://preview.example.test",
    );
  });
  it("shows the onboarding of the company with its progress and the way into the form", () => {
    renderDashboard({
      dashboard: undefined,
      permissions: undefined,
      cockpitHref: null,
      conversation: CONVERSATION,
      filesOverview: FILES,
      onboarding: {
        id: "form-1",
        projectId: "project-1",
        projectTitle: "Relaunch",
        status: OnboardingFormStatus.Open,
        progress: { answeredRequired: 1, totalRequired: 4, ratio: 0.25 },
        submittedAt: null,
        completedAt: null,
        canEdit: true,
      },
    });

    const widget = screen.getByRole("region", {
      name: content.widgets.onboarding.title,
    });
    expect(widget).not.toHaveAttribute("data-mock", "true");
    expect(
      within(widget).getByRole("link", {
        name: "Continue the onboarding for Relaunch",
      }),
    ).toHaveAttribute(
      "href",
      "/en/portal/customer-1/onboarding/form-1?project=project-1",
    );
  });
  it("has no onboarding widget while the company has no form", () => {
    renderDashboard();

    expect(
      screen.queryByRole("region", { name: content.widgets.onboarding.title }),
    ).toBeNull();
  });
  it("shows the newest released files and links to the files page", () => {
    renderDashboard();

    const widget = screen.getByRole("region", { name: FILES_WIDGET_NAME });
    expect(widget).not.toHaveAttribute("data-mock", "true");
    expect(within(widget).getByText("Offer.pdf")).toBeInTheDocument();
    expect(within(widget).getByText("and 3 more")).toBeInTheDocument();
    expect(
      within(widget).getByRole("link", { name: content.widgets.files.all }),
    ).toHaveAttribute("href", "/en/portal/customer-1/files");

    fireEvent.click(
      within(widget).getByRole("tab", { name: content.widgets.files.fromYou }),
    );
    expect(
      within(widget).getByText(content.widgets.files.emptyFromYou),
    ).toBeInTheDocument();
  });
  it.each([PortalFileOrigin.FromUs, PortalFileOrigin.FromYou])(
    "shows image thumbnails in the files widget's %s tab and falls back on failure",
    (origin) => {
      const thumbnailUrl = "https://storage.invalid/photo.thumb.webp";
      renderDashboard({
        filesOverview: {
          ...FILES,
          [origin]: {
            ...FILES.fromUs,
            files: [
              {
                ...FILES.fromUs.files[0],
                assetKind: AssetKind.Image,
                extension: UploadExtension.Jpg,
                displayName: "Photo.jpg",
                origin,
                thumbnailUrl,
              },
            ],
          },
        },
      });
      const widget = screen.getByRole("region", { name: FILES_WIDGET_NAME });
      fireEvent.click(
        within(widget).getByRole("tab", {
          name: content.widgets.files[origin],
        }),
      );
      const image = widget.querySelector("img");
      expect(image).toHaveAttribute("src", thumbnailUrl);
      expect(image).toHaveAttribute("alt", "");
      fireEvent.error(image!);
      expect(widget.querySelector("img")).toBeNull();
      expect(within(widget).getByText("Photo.jpg")).toBeInTheDocument();
    },
  );

  it("keeps the files page reachable when the preview is unavailable", () => {
    renderDashboard({
      dashboard: dto(),
      permissions: FULL_READ,
      cockpitHref: null,
      conversation: null,
      filesOverview: null,
    });
    const widget = screen.getByRole("region", { name: FILES_WIDGET_NAME });
    expect(
      within(widget).getByRole("link", { name: content.widgets.files.all }),
    ).toHaveAttribute("href", "/en/portal/customer-1/files");
    expect(within(widget).queryByRole("tab")).not.toBeInTheDocument();
    expect(within(widget).getByRole("status")).toHaveTextContent(
      content.widgets.files.previewUnavailable,
    );
  });
  it("omits the files widget without portal.files.read", () => {
    renderDashboard({
      dashboard: dto(),
      permissions: new Set([
        Permission.PortalAccess,
        Permission.PortalProjectsRead,
      ]),
      cockpitHref: null,
      conversation: CONVERSATION,
      filesOverview: null,
    });

    expect(
      screen.queryByRole("region", { name: FILES_WIDGET_NAME }),
    ).toBeNull();
  });
  it("opens the request dialog through the URL", () => {
    renderDashboard({ dashboard: dto({ capabilities: CAN_CREATE }) });

    fireEvent.click(
      within(ourTasksWidget()).getByRole("button", {
        name: "Create a task for us",
      }),
    );

    expect(mocks.push).toHaveBeenCalledWith(
      "/en/portal/customer-1?widget=ourTasks",
      { scroll: false },
    );
  });
  it("points the owner view to the CRM instead of the request button", () => {
    renderDashboard({
      dashboard: dto({
        capabilities: {
          canCompleteTasks: false,
          canCreateTasks: false,
          isOwnerView: true,
        },
      }),
      permissions: FULL_READ,
      cockpitHref: "/en/crm?cockpit=customer-1",
    });

    expect(
      within(ourTasksWidget()).getByRole("link", { name: "Create in the CRM" }),
    ).toHaveAttribute("href", "/en/crm?cockpit=customer-1");
  });
  it("ignores a dialog parameter for a widget the reader cannot see", () => {
    mocks.search.value = "widget=customerTasks";
    renderDashboard({
      dashboard: dto(),
      permissions: new Set([
        Permission.PortalAccess,
        Permission.PortalProjectsRead,
      ]),
    });

    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("shows the server-selected project without a widget tab", () => {
    const project = {
      ...dto().project!,
      id: "project-2",
      title: "Shop",
      status: ProjectStatus.Planned,
    };
    renderDashboard({
      dashboard: dto({ project }),
      permissions: FULL_READ,
      cockpitHref: null,
      conversation: CONVERSATION,
      filesOverview: FILES,
      onboarding: null,
    });

    expect(screen.getByText("Shop")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Relaunch|Shop/ })).toBeNull();
  });
  it("shows the friendly empty state for a customer without projects", () => {
    renderDashboard({ dashboard: dto({ project: null }) });

    expect(
      screen.getByRole("heading", {
        name: content.widgets.project.emptyTitle,
      }),
    ).toBeInTheDocument();
  });
});
