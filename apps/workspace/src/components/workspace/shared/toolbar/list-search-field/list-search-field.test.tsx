// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ListSearchField } from "./list-search-field";

const DEBOUNCE_MS = 250;

function renderField(onCommitAction: (value: string | undefined) => void) {
  return render(
    <ListSearchField
      currentValue=""
      label="Search"
      onCommitAction={onCommitAction}
      placeholder="Search tasks"
    />,
  );
}

describe("ListSearchField", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("commits the trimmed text once after the debounce", () => {
    const onCommit = vi.fn();
    renderField(onCommit);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search" }), {
      target: { value: "  logo  " },
    });
    expect(onCommit).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("logo");
  });

  it("commits undefined for an emptied field", () => {
    const onCommit = vi.fn();
    render(
      <ListSearchField
        currentValue="logo"
        label="Search"
        onCommitAction={onCommit}
        placeholder="Search tasks"
      />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Search" }), {
      target: { value: "   " },
    });
    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(onCommit).toHaveBeenCalledWith(undefined);
  });

  it("does not restart the debounce when the parent re-renders with a new callback", () => {
    const first = vi.fn();
    const second = vi.fn();
    const view = renderField(first);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search" }), {
      target: { value: "logo" },
    });
    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS - 50);
    });
    // A fresh function identity on every render is what real callers pass.
    view.rerender(
      <ListSearchField
        currentValue=""
        label="Search"
        onCommitAction={second}
        placeholder="Search tasks"
      />,
    );
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // The original timer still fires on time and reaches the latest callback.
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith("logo");
  });
});
