// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CustomerCredentialsQueryParam } from "@/common/constants/crm/credentials/customer-credentials-query-params";
import { useCredentialProjectFilter } from "./use-credential-project-filter";

const navigation = vi.hoisted(() => ({ search: "" }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/de/crm",
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  navigation.search = "";
  window.history.replaceState(null, "", "/");
});

describe("useCredentialProjectFilter", () => {
  it("updates the selection through Next's external history path and keeps other query parameters", () => {
    window.history.replaceState(
      { __NA: true },
      "",
      "/de/crm?customer=customer-1&filesKind=image",
    );
    navigation.search = window.location.search;
    const nativeReplace = window.history.replaceState.bind(window.history);
    const replace = vi
      .spyOn(window.history, "replaceState")
      .mockImplementation((data, unused, url) => {
        // Next skips search-param synchronization for writes carrying its internal marker.
        if (!data?.__NA && !data?._N) {
          navigation.search = new URL(String(url), window.location.href).search;
        }
        nativeReplace(data, unused, url);
      });
    const { result, rerender } = renderHook(() =>
      useCredentialProjectFilter(["project-1"]),
    );
    expect(result.current.projectId).toBeUndefined();

    act(() => result.current.setProjectId("project-1"));
    rerender();
    expect(result.current.projectId).toBe("project-1");
    expect(replace).toHaveBeenLastCalledWith(null, "", expect.any(String));
    expect(new URLSearchParams(window.location.search).get("customer")).toBe(
      "customer-1",
    );
    expect(new URLSearchParams(window.location.search).get("filesKind")).toBe(
      "image",
    );

    act(() => result.current.setProjectId(null));
    rerender();
    expect(result.current.projectId).toBeNull();

    act(() => result.current.setProjectId(undefined));
    rerender();
    expect(result.current.projectId).toBeUndefined();
    expect(
      new URLSearchParams(window.location.search).has(
        CustomerCredentialsQueryParam.Project,
      ),
    ).toBe(false);
  });

  it("follows router navigation and ignores projects without read access", () => {
    navigation.search = `${CustomerCredentialsQueryParam.Project}=project-1`;
    const { result, rerender } = renderHook(() =>
      useCredentialProjectFilter(["project-1"]),
    );
    expect(result.current.projectId).toBe("project-1");
    navigation.search = `${CustomerCredentialsQueryParam.Project}=other-project`;
    rerender();
    expect(result.current.projectId).toBeUndefined();
  });
});
