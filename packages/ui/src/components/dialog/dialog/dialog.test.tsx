// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import { Dialog } from "./dialog";

describe("Dialog", () => {
  afterEach(cleanup);

  it("closes only the innermost dialog on Escape", () => {
    const closeOuter = vi.fn();
    const closeInner = vi.fn();
    render(
      <Dialog
        closeLabel="Close outer"
        onCloseAction={closeOuter}
        size={DialogSize.Full}
        title="Outer"
      >
        <Dialog
          closeLabel="Close inner"
          onCloseAction={closeInner}
          size={DialogSize.Narrow}
          title="Inner"
        >
          <input aria-label="Field" />
        </Dialog>
      </Dialog>,
    );

    fireEvent.keyDown(screen.getByRole("textbox", { name: "Field" }), {
      key: "Escape",
    });

    expect(closeInner).toHaveBeenCalledTimes(1);
    expect(closeOuter).not.toHaveBeenCalled();
  });

  it("closes a full-size dialog on Escape", () => {
    const close = vi.fn();
    render(
      <Dialog
        closeLabel="Close"
        onCloseAction={close}
        size={DialogSize.Full}
        title="Cockpit"
      >
        <input aria-label="Field" />
      </Dialog>,
    );

    fireEvent.keyDown(screen.getByRole("textbox", { name: "Field" }), {
      key: "Escape",
    });

    expect(close).toHaveBeenCalledTimes(1);
  });
});
