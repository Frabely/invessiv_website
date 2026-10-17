// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TimeEntryListLoadStatus } from "@/common/constants/crm/time-entry-list-load-status";
import { usePortalTimeEntries } from "./use-portal-time-entries";

const api = vi.hoisted(() => ({ listTimeEntries: vi.fn() }));

vi.mock("@/client/portal/portal-hours-api-service", () => ({
  portalHoursApiService: api,
}));

beforeEach(() => {
  api.listTimeEntries.mockResolvedValue({
    ok: true,
    value: { entries: [], nextCursor: "next-page" },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("usePortalTimeEntries", () => {
  it("reloads the first page when the project changes without remounting", async () => {
    const { result, rerender } = renderHook(
      ({ projectId }) => usePortalTimeEntries("customer-1", projectId),
      { initialProps: { projectId: "project-a" as string | null } },
    );
    await waitFor(() =>
      expect(result.current.status).toBe(TimeEntryListLoadStatus.Ready),
    );
    expect(api.listTimeEntries).toHaveBeenLastCalledWith("customer-1", {
      projectId: "project-a",
    });

    rerender({ projectId: "project-b" });
    await waitFor(() =>
      expect(api.listTimeEntries).toHaveBeenLastCalledWith("customer-1", {
        projectId: "project-b",
      }),
    );
    await waitFor(() =>
      expect(result.current.status).toBe(TimeEntryListLoadStatus.Ready),
    );

    rerender({ projectId: null });
    await waitFor(() =>
      expect(api.listTimeEntries).toHaveBeenLastCalledWith("customer-1", {
        projectId: undefined,
      }),
    );
  });

  it("keeps the project for pagination and retry", async () => {
    const { result } = renderHook(() =>
      usePortalTimeEntries("customer-1", "project-a"),
    );
    await waitFor(() =>
      expect(result.current.status).toBe(TimeEntryListLoadStatus.Ready),
    );

    await act(async () => {
      await result.current.loadMore();
    });
    expect(api.listTimeEntries).toHaveBeenLastCalledWith("customer-1", {
      projectId: "project-a",
      cursor: "next-page",
    });
    act(() => result.current.retry());
    await waitFor(() =>
      expect(api.listTimeEntries).toHaveBeenLastCalledWith("customer-1", {
        projectId: "project-a",
      }),
    );
    expect(api.listTimeEntries).toHaveBeenCalledTimes(3);
  });
});
