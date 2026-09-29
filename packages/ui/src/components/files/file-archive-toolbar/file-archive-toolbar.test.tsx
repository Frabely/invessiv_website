// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileArchiveToolbar } from "./file-archive-toolbar";

afterEach(cleanup);

describe("FileArchiveToolbar", () => {
  it("shows the selection limit and blocks a second archive request while busy", () => {
    const download = vi.fn();
    render(
      <FileArchiveToolbar
        busy
        hasFiles
        hasVideo
        labels={{
          groupLabel: "Archive",
          selectShown: "Select shown",
          selected: "{count} selected",
          clear: "Clear",
          preparing: "Preparing",
          download: "Download",
          limitReached: "Limit reached",
          videoHint: "Videos excluded",
        }}
        limitReached
        onClearAction={vi.fn()}
        onDownloadAction={download}
        onSelectShownAction={vi.fn()}
        selectedCount={20}
      />,
    );
    expect(screen.getByRole("group", { name: "Archive" })).toHaveTextContent(
      "Limit reached",
    );
    expect(screen.getByText("Videos excluded")).toBeVisible();
    const button = screen.getByRole("button", { name: "Preparing" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(download).not.toHaveBeenCalled();
  });
});
