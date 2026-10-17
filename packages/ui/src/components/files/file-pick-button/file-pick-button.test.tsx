// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FilePickButton } from "./file-pick-button";

function fileInput(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("file input missing");
  return input;
}

describe("FilePickButton", () => {
  afterEach(cleanup);

  it("opens the hidden file input from the button", () => {
    const { container } = render(
      <FilePickButton accept=".pdf" onFilesSelected={vi.fn()}>
        Upload
      </FilePickButton>,
    );
    const input = fileInput(container);
    const click = vi.spyOn(input, "click");

    fireEvent.click(screen.getByRole("button", { name: "Upload" }));

    expect(click).toHaveBeenCalledOnce();
    expect(input).toHaveAttribute("accept", ".pdf");
    expect(input).not.toBeVisible();
  });

  it("emits every picked file when multiple and resets the input", () => {
    const onFilesSelected = vi.fn();
    const { container } = render(
      <FilePickButton multiple onFilesSelected={onFilesSelected}>
        Upload
      </FilePickButton>,
    );
    const input = fileInput(container);
    Object.defineProperty(input, "files", {
      value: [new File(["x"], "a.pdf"), new File(["x"], "b.png")],
      configurable: true,
    });

    fireEvent.change(input);

    expect(onFilesSelected).toHaveBeenCalledWith([
      expect.objectContaining({ name: "a.pdf" }),
      expect.objectContaining({ name: "b.png" }),
    ]);
    expect(input.value).toBe("");
  });

  it("does not open the picker while disabled", () => {
    const { container } = render(
      <FilePickButton disabled onFilesSelected={vi.fn()}>
        Upload
      </FilePickButton>,
    );
    const click = vi.spyOn(fileInput(container), "click");

    fireEvent.click(screen.getByRole("button", { name: "Upload" }));

    expect(click).not.toHaveBeenCalled();
  });
});
