// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePortalHoursProject } from "./use-portal-hours-project";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const PROJECTS = ["project-a", "project-b"];

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

describe("usePortalHoursProject", () => {
  it("follows the dashboard project until the URL names another", () => {
    window.history.replaceState(null, "", "?widget=hours");
    const { result, rerender } = renderHook(() =>
      usePortalHoursProject(PROJECTS, "project-a"),
    );
    expect(result.current.projectId).toBe("project-a");

    act(() => result.current.selectProject("project-b"));
    rerender();
    expect(window.location.search).toBe("?widget=hours&hoursProject=project-b");
    expect(result.current.projectId).toBe("project-b");
  });

  it("writes `all` for every project so the dashboard project does not return", () => {
    window.history.replaceState(null, "", "?widget=hours");
    const { result, rerender } = renderHook(() =>
      usePortalHoursProject(PROJECTS, "project-a"),
    );

    act(() => result.current.selectProject(null));
    rerender();
    expect(window.location.search).toBe("?widget=hours&hoursProject=all");
    expect(result.current.projectId).toBeNull();
  });

  it("writes without Next.js history state so the router picks up the new URL", () => {
    window.history.replaceState({ __NA: true }, "", "?widget=hours");
    const replaceState = vi.spyOn(window.history, "replaceState");
    const { result } = renderHook(() => usePortalHoursProject(PROJECTS, null));

    act(() => result.current.selectProject(null));

    expect(replaceState).toHaveBeenCalledWith(null, "", expect.any(URL));
    replaceState.mockRestore();
  });

  it("drops a project that is no longer visible", () => {
    window.history.replaceState(
      null,
      "",
      "?widget=hours&hoursProject=project-b",
    );
    const { result, rerender } = renderHook(
      ({ projectIds }) => usePortalHoursProject(projectIds, null),
      { initialProps: { projectIds: PROJECTS } },
    );
    expect(result.current.projectId).toBe("project-b");

    rerender({ projectIds: ["project-a"] });
    expect(result.current.projectId).toBeNull();
  });
});
