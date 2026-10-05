// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePortalOnboardingStep } from "./use-portal-onboarding-step";

vi.mock("next/navigation", () => ({
  usePathname: () => "/de/portal/customer-1/onboarding/form-1",
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

describe("usePortalOnboardingStep", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState(null, "", "/");
  });

  it("keeps the selected project when moving between form steps", () => {
    window.history.replaceState(
      null,
      "",
      "/de/portal/customer-1/onboarding/form-1?project=project-2&section=first",
    );
    const { result } = renderHook(() =>
      usePortalOnboardingStep(["first", "second"]),
    );
    act(() => result.current.goTo({ section: "second" }));
    expect(window.location.search).toBe("?project=project-2&section=second");
    expect(result.current.section).toBe("second");
  });

  it("tracks leaving a section through navigation and browser history but not same-section jumps", () => {
    const { result } = renderHook(() =>
      usePortalOnboardingStep(["first", "second", "third"]),
    );
    expect([...result.current.leftSections]).toEqual([]);
    act(() => result.current.goTo({ section: "first", fieldId: "name" }));
    expect([...result.current.leftSections]).toEqual([]);
    act(() => result.current.goTo({ section: "second" }));
    expect([...result.current.leftSections]).toEqual(["first"]);

    act(() => {
      window.history.replaceState(null, "", "?section=first");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.section).toBe("first");
    expect([...result.current.leftSections]).toEqual(["first", "second"]);
    expect(result.current.leftSections.has("third")).toBe(false);
  });
});
