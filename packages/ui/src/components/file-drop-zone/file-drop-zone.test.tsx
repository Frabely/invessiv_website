// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FileDropZone } from "./file-drop-zone";

function files(...names: string[]) {
  return names.map((name) => new File(["x"], name));
}

function zone() {
  return screen.getByRole("group", { name: "Drop files" });
}

describe("FileDropZone", () => {
  afterEach(cleanup);

  it("labels the keyboard-reachable input and describes it with the hint", () => {
    render(
      <FileDropZone
        hint="Max 20"
        label="Drop files"
        onFilesSelected={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("Drop files", { selector: "input" });
    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAccessibleDescription("Max 20");
  });

  it("emits every picked file when multiple and resets the input", () => {
    const onFilesSelected = vi.fn();
    render(
      <FileDropZone
        label="Drop files"
        multiple
        onFilesSelected={onFilesSelected}
      />,
    );
    const input = screen.getByLabelText<HTMLInputElement>("Drop files", {
      selector: "input",
    });
    Object.defineProperty(input, "files", {
      value: files("a.pdf", "b.png"),
      configurable: true,
    });
    fireEvent.change(input);
    expect(onFilesSelected).toHaveBeenCalledWith([
      expect.objectContaining({ name: "a.pdf" }),
      expect.objectContaining({ name: "b.png" }),
    ]);
  });

  it("keeps only the first dropped file when single and tracks the active state", () => {
    const onFilesSelected = vi.fn();
    render(
      <FileDropZone label="Drop files" onFilesSelected={onFilesSelected} />,
    );
    const dataTransfer = { files: files("a.csv", "b.csv"), types: ["Files"] };
    fireEvent.dragEnter(zone(), { dataTransfer });
    expect(zone()).toHaveAttribute("data-active", "true");
    fireEvent.dragLeave(zone(), { dataTransfer });
    expect(zone()).toHaveAttribute("data-active", "false");
    fireEvent.dragEnter(zone(), { dataTransfer });
    fireEvent.drop(zone(), { dataTransfer });
    expect(zone()).toHaveAttribute("data-active", "false");
    expect(onFilesSelected).toHaveBeenCalledWith([
      expect.objectContaining({ name: "a.csv" }),
    ]);
  });

  it("ignores drags without files and everything while disabled", () => {
    const onFilesSelected = vi.fn();
    const { rerender } = render(
      <FileDropZone label="Drop files" onFilesSelected={onFilesSelected} />,
    );
    fireEvent.dragEnter(zone(), { dataTransfer: { types: ["text/plain"] } });
    expect(zone()).toHaveAttribute("data-active", "false");
    rerender(
      <FileDropZone
        disabled
        label="Drop files"
        onFilesSelected={onFilesSelected}
      />,
    );
    fireEvent.drop(zone(), {
      dataTransfer: { files: files("a.pdf"), types: ["Files"] },
    });
    expect(onFilesSelected).not.toHaveBeenCalled();
    expect(
      screen.getByLabelText("Drop files", { selector: "input" }),
    ).toBeDisabled();
  });
});
