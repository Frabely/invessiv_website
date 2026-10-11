// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TimeEntryListLoadStatus } from "@/common/constants/crm/time-entry-list-load-status";
import { usePortalTimeEntries } from "./use-portal-time-entries";

const api = vi.hoisted(() => ({ listTimeEntries: vi.fn() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
vi.mock("@/client/portal/portal-hours-api-service", () => ({
  portalHoursApiService: api,
}));

beforeEach(() => {
  window.history.replaceState(null, "", "?widget=hours&hoursProject=project-a");
  api.listTimeEntries.mockResolvedValue({
    ok: true,
    value: { entries: [], nextCursor: "next-page" },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/");
});

describe("usePortalTimeEntries", () => {
  it("reloads the first page when the URL filter changes without remounting", async () => {
    const { result, rerender } = renderHook(() =>
      usePortalTimeEntries("customer-1", ["project-a", "project-b"]),
    );
    await waitFor(() =>
      expect(result.current.status).toBe(TimeEntryListLoadStatus.Ready),
    );
    expect(result.current.projectId).toBe("project-a");

    window.history.replaceState(
      null,
      "",
      "?widget=hours&hoursProject=project-b",
    );
    rerender();
    expect(result.current.projectId).toBe("project-b");
    await waitFor(() =>
      expect(api.listTimeEntries).toHaveBeenLastCalledWith("customer-1", {
        projectId: "project-b",
      }),
    );
    await waitFor(() =>
      expect(result.current.status).toBe(TimeEntryListLoadStatus.Ready),
    );

    window.history.replaceState(null, "", "?widget=hours");
    rerender();
    expect(result.current.projectId).toBeNull();
    await waitFor(() =>
      expect(api.listTimeEntries).toHaveBeenLastCalledWith("customer-1", {
        projectId: undefined,
      }),
    );
  });

  it("drops a removed project filter for reload, pagination and retry", async () => {
    const { result, rerender } = renderHook(
      ({ projectIds }) => usePortalTimeEntries("customer-1", projectIds),
      { initialProps: { projectIds: ["project-a", "project-b"] } },
    );
    await waitFor(() =>
      expect(result.current.status).toBe(TimeEntryListLoadStatus.Ready),
    );
    api.listTimeEntries.mockClear();

    rerender({ projectIds: ["project-b"] });
    expect(result.current.projectId).toBeNull();
    await waitFor(() =>
      expect(result.current.status).toBe(TimeEntryListLoadStatus.Ready),
    );
    expect(api.listTimeEntries).toHaveBeenLastCalledWith("customer-1", {
      projectId: undefined,
    });
    await act(async () => {
      await result.current.loadMore();
    });
    expect(api.listTimeEntries).toHaveBeenLastCalledWith("customer-1", {
      projectId: undefined,
      cursor: "next-page",
    });
    act(() => result.current.retry());
    await waitFor(() =>
      expect(api.listTimeEntries).toHaveBeenLastCalledWith("customer-1", {
        projectId: undefined,
      }),
    );
    expect(api.listTimeEntries).toHaveBeenCalledTimes(3);
  });

  it("treats a new unknown URL project as unfiltered without remounting", async () => {
    const { result, rerender } = renderHook(() =>
      usePortalTimeEntries("customer-1", ["project-a"]),
    );
    await waitFor(() =>
      expect(result.current.status).toBe(TimeEntryListLoadStatus.Ready),
    );

    window.history.replaceState(null, "", "?widget=hours&hoursProject=foreign");
    rerender();
    expect(result.current.projectId).toBeNull();
    await waitFor(() =>
      expect(api.listTimeEntries).toHaveBeenLastCalledWith("customer-1", {
        projectId: undefined,
      }),
    );
  });
});
