// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkspaceDialogSize } from "@/common/constants/ui/workspace-dialog-sizes";
import { WorkspaceDialog } from "./workspace-dialog";

afterEach(() => {
  cleanup();
});

function renderDialog(props: { busy?: boolean; onClose?: () => void } = {}) {
  const onClose = props.onClose ?? vi.fn();
  render(
    <WorkspaceDialog
      busy={props.busy}
      closeLabel="Close dialog"
      description="Pick an account"
      footer={<button type="button">Save</button>}
      onCloseAction={onClose}
      size={WorkspaceDialogSize.Narrow}
      title="Add member"
    >
      <input aria-label="Search" />
    </WorkspaceDialog>,
  );
  return onClose;
}

describe("WorkspaceDialog", () => {
  it("labels the modal dialog by its title and description", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", { name: "Add member" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("Pick an account");
  });

  it("closes on escape and on the close button", () => {
    const onClose = renderDialog();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("keeps tab focus inside the dialog", () => {
    renderDialog();
    const save = screen.getByRole("button", { name: "Save" });
    const close = screen.getByRole("button", { name: "Close dialog" });

    save.focus();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });

    expect(close).toHaveFocus();
  });

  it("does not close while busy", () => {
    const onClose = renderDialog({ busy: true });

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });
});
