// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useLeadsTableSelection } from "./leads-table-selection-context";
import { LeadsTableSelectionProvider } from "./leads-table-selection-provider";

function SelectionHarness() {
  const {
    allSelected,
    clearSelection,
    selectedCount,
    selectedIds,
    someSelected,
    toggleAll,
    toggleRow,
  } = useLeadsTableSelection();

  return (
    <div>
      <div data-testid="selected-count">{selectedCount}</div>
      <div data-testid="selected-ids">{selectedIds.join(",")}</div>
      <div data-testid="all-selected">{String(allSelected)}</div>
      <div data-testid="some-selected">{String(someSelected)}</div>
      <button onClick={() => toggleRow("lead-1")} type="button">
        toggle-1
      </button>
      <button onClick={() => toggleRow("lead-2")} type="button">
        toggle-2
      </button>
      <button onClick={toggleAll} type="button">
        toggle-all
      </button>
      <button onClick={clearSelection} type="button">
        clear
      </button>
    </div>
  );
}

function renderProvider(rowIds: string[], selectionResetKey?: string) {
  return render(
    <LeadsTableSelectionProvider
      rowIds={rowIds}
      selectionResetKey={selectionResetKey}
    >
      <SelectionHarness />
    </LeadsTableSelectionProvider>,
  );
}

afterEach(() => {
  cleanup();
});

describe("LeadsTableSelectionProvider", () => {
  it("drops selected ids that are no longer present in the current row ids", async () => {
    const { rerender } = renderProvider(["lead-1", "lead-2"]);

    fireEvent.click(screen.getByRole("button", { name: "toggle-1" }));
    fireEvent.click(screen.getByRole("button", { name: "toggle-2" }));

    expect(screen.getByTestId("selected-ids")).toHaveTextContent(
      "lead-1,lead-2",
    );

    rerender(
      <LeadsTableSelectionProvider rowIds={["lead-2"]}>
        <SelectionHarness />
      </LeadsTableSelectionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("selected-ids")).toHaveTextContent("lead-2");
    });
    expect(screen.getByTestId("selected-count")).toHaveTextContent("1");
    expect(screen.getByTestId("all-selected")).toHaveTextContent("true");
    expect(screen.getByTestId("some-selected")).toHaveTextContent("false");
  });

  it("clears the selection when the reset key changes", async () => {
    const { rerender } = renderProvider(["lead-1", "lead-2"], "initial");

    fireEvent.click(screen.getByRole("button", { name: "toggle-1" }));
    expect(screen.getByTestId("selected-count")).toHaveTextContent("1");

    rerender(
      <LeadsTableSelectionProvider
        rowIds={["lead-1", "lead-2"]}
        selectionResetKey="next"
      >
        <SelectionHarness />
      </LeadsTableSelectionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("selected-count")).toHaveTextContent("0");
    });
    expect(screen.getByTestId("selected-ids")).toHaveTextContent("");
  });
});
