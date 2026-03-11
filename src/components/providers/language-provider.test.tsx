// @vitest-environment jsdom

import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LanguageProvider } from "./language-provider";
import {
  createLocaleScrollRestoreState,
  LOCALE_SCROLL_RESTORE_STORAGE_KEY,
} from "@/lib/navigation/locale-scroll-restoration";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("LanguageProvider", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/en");
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/en");
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("restores the stored scroll position after a locale route change", async () => {
    window.sessionStorage.setItem(
      LOCALE_SCROLL_RESTORE_STORAGE_KEY,
      createLocaleScrollRestoreState("/en", 0, 640),
    );

    render(
      <LanguageProvider initialLocale="en">
        <div>Child</div>
      </LanguageProvider>,
    );

    await waitFor(() => {
      expect(window.scrollTo).toHaveBeenCalledWith(0, 640);
    });
    expect(
      window.sessionStorage.getItem(LOCALE_SCROLL_RESTORE_STORAGE_KEY),
    ).toBeNull();
  });
});
