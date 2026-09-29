// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectErrorCode } from "@invessiv/common/constants/crm/errors/project-error-codes";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { getCrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import { projectFixture } from "@/server/tests/workspace/crm/support/crm-fixtures";
import { ProjectEditorDialog } from "./project-editor-dialog";

const mocks = vi.hoisted(() => ({
  createProject: vi.fn(),
  updateProject: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/crm/projects-api-service", () => ({
  projectsApiService: {
    createProject: mocks.createProject,
    updateProject: mocks.updateProject,
  },
}));

const content = getCrmCockpitDictionary("de").projects;

describe("ProjectEditorDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createProject.mockImplementation(async () => ({
      ok: true,
      project: projectFixture(),
    }));
    mocks.updateProject.mockImplementation(async () => ({
      ok: true,
      project: projectFixture(),
    }));
  });
  afterEach(cleanup);

  it("keeps the stored phase when editing a project", async () => {
    const project = projectFixture({
      phase: ProjectPhase.Development,
      version: 5,
    });
    const onCloseAction = vi.fn();
    render(
      <ProjectEditorDialog
        content={content}
        customerId={project.customerId}
        onCloseAction={onCloseAction}
        project={project}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: content.save }));

    await waitFor(() => expect(onCloseAction).toHaveBeenCalled());
    expect(mocks.updateProject).toHaveBeenCalledWith(
      project.id,
      expect.objectContaining({
        phase: ProjectPhase.Development,
        version: 5,
      }),
    );
  });

  it("creates a project with two single feedback rounds before Launch", async () => {
    render(
      <ProjectEditorDialog
        content={content}
        customerId="customer-1"
        onCloseAction={vi.fn()}
        project={null}
      />,
    );

    fireEvent.change(screen.getByLabelText(content.title, { exact: false }), {
      target: { value: "Relaunch" },
    });
    fireEvent.click(screen.getByRole("button", { name: content.save }));

    await waitFor(() => expect(mocks.createProject).toHaveBeenCalled());
    expect(mocks.createProject).toHaveBeenCalledWith(
      "customer-1",
      expect.objectContaining({
        phase: ProjectPhase.Onboarding,
        processSteps: [
          "Onboarding",
          "Design",
          "Entwicklung",
          "Launch",
          "Wartung",
        ],
        feedbackRoundPositions: [3, 3],
      }),
    );
  });

  it("offers only free-text steps as current step", () => {
    render(
      <ProjectEditorDialog
        content={content}
        customerId="customer-1"
        onCloseAction={vi.fn()}
        project={null}
      />,
    );

    const options = within(
      screen.getByRole("combobox", { name: content.currentProcessStep }),
    )
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toEqual([
      "Onboarding",
      "Design",
      "Entwicklung",
      "Launch",
      "Wartung",
    ]);
    expect(
      screen.getByText(content.currentProcessStepHint),
    ).toBeInTheDocument();
  });

  it("keeps the input on a version conflict and retries with the fresh version", async () => {
    const project = projectFixture({ title: "Alt", version: 2 });
    mocks.updateProject.mockResolvedValueOnce({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: { ...project, title: "Von jemand anderem", version: 3 },
    });
    render(
      <ProjectEditorDialog
        content={content}
        customerId={project.customerId}
        onCloseAction={vi.fn()}
        project={project}
      />,
    );

    fireEvent.change(screen.getByLabelText(content.title, { exact: false }), {
      target: { value: "Meine Änderung" },
    });
    fireEvent.click(screen.getByRole("button", { name: content.save }));

    expect(await screen.findByText(content.saveConflict)).toBeVisible();
    expect(screen.getByLabelText(content.title, { exact: false })).toHaveValue(
      "Meine Änderung",
    );

    fireEvent.click(screen.getByRole("button", { name: content.save }));
    await waitFor(() => expect(mocks.updateProject).toHaveBeenCalledTimes(2));
    expect(mocks.updateProject).toHaveBeenLastCalledWith(
      project.id,
      expect.objectContaining({ title: "Meine Änderung", version: 3 }),
    );
  });

  it("shows the save error for any other failure", async () => {
    mocks.createProject.mockResolvedValueOnce({
      ok: false,
      code: ProjectErrorCode.Internal,
    });
    render(
      <ProjectEditorDialog
        content={content}
        customerId="customer-1"
        onCloseAction={vi.fn()}
        project={null}
      />,
    );

    fireEvent.change(screen.getByLabelText(content.title, { exact: false }), {
      target: { value: "Relaunch" },
    });
    fireEvent.click(screen.getByRole("button", { name: content.save }));

    expect(await screen.findByText(content.saveError)).toBeVisible();
  });

  it("explains why handed-over feedback rounds cannot move", async () => {
    mocks.createProject.mockResolvedValueOnce({
      ok: false,
      code: ProjectErrorCode.FeedbackRoundInUse,
    });
    render(
      <ProjectEditorDialog
        content={content}
        customerId="customer-1"
        onCloseAction={vi.fn()}
        project={null}
      />,
    );

    fireEvent.change(screen.getByLabelText(content.title, { exact: false }), {
      target: { value: "Relaunch" },
    });
    fireEvent.click(screen.getByRole("button", { name: content.save }));

    expect(await screen.findByText(content.feedbackRoundInUse)).toBeVisible();
    expect(screen.queryByText(content.saveError)).toBeNull();
  });
});
