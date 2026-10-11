import { describe, expect, it } from "vitest";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { taskFixture } from "@/server/tests/workspace/crm/support/crm-fixtures";
import { project, viewModel } from "./hours-test-fixtures";
import { projectHoursCanvasContext } from "./project-hours-canvas-context";

describe("projectHoursCanvasContext", () => {
  it("does not create a context outside the readable hours projects", () => {
    expect(
      projectHoursCanvasContext(project().projectId, undefined, undefined),
    ).toBeNull();
    expect(
      projectHoursCanvasContext("another-project", viewModel(), undefined),
    ).toBeNull();
  });
  it("offers task options only with task read access on the active project", () => {
    const projectId = project().projectId;
    const tasks = {
      tasks: [taskFixture({ projectId, status: TaskStatus.Cancelled })],
      readableProjectIds: [],
      writableProjectIds: [],
      members: [],
      today: "2026-10-11",
    };
    expect(
      projectHoursCanvasContext(projectId, viewModel(), tasks)?.tasks,
    ).toBeNull();
    const readable = { ...tasks, readableProjectIds: [projectId] };
    expect(
      projectHoursCanvasContext(projectId, viewModel(), readable)?.tasks,
    ).toEqual([
      { id: tasks.tasks[0].id, title: tasks.tasks[0].title, linkable: false },
    ]);
  });
});
