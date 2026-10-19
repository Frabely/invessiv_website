// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useFocusAfterVersion } from "./use-focus-after-version";

afterEach(cleanup);

function Probe({ version, moved }: { version: number; moved: boolean }) {
  const { ref, focusAfter } = useFocusAfterVersion<HTMLButtonElement>(version);
  const control = (
    <button ref={ref} type="button">
      Action
    </button>
  );
  return (
    <>
      <button onClick={() => focusAfter(2)} type="button">
        Save
      </button>
      {/* The control moves to another place in the tree, as a refreshed row does. */}
      {moved ? <section>{control}</section> : <div>{control}</div>}
    </>
  );
}

describe("useFocusAfterVersion", () => {
  it("focuses the control rendered with the saved version, not before", () => {
    const { rerender } = render(<Probe moved={false} version={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    rerender(<Probe moved={false} version={1} />);
    expect(screen.getByRole("button", { name: "Action" })).not.toHaveFocus();

    rerender(<Probe moved version={2} />);
    expect(screen.getByRole("button", { name: "Action" })).toHaveFocus();
  });

  it("focuses only once per request", () => {
    const { rerender } = render(<Probe moved={false} version={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    rerender(<Probe moved={false} version={2} />);
    screen.getByRole("button", { name: "Action" }).blur();
    rerender(<Probe moved={false} version={3} />);
    expect(screen.getByRole("button", { name: "Action" })).not.toHaveFocus();
  });
});
