// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileListFrame } from "@invessiv/ui";

afterEach(cleanup);

describe("FileListFrame", () => {
  it("retries an initial failure without exposing stale rows", () => {
    const retry = vi.fn();
    render(
      <FileListFrame
        count={0}
        emptyState={<p>Nothing here</p>}
        errorLabel="Could not load"
        hasMore={false}
        isError
        isLoading={false}
        isLoadingMore={false}
        listLabel="Files"
        loadingLabel="Loading"
        loadMoreLabel="More"
        onLoadMoreAction={vi.fn()}
        onReloadAction={retry}
        retryLabel="Retry"
        rows={<li>stale row</li>}
        shownLabel="0 of 0"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load");
    expect(screen.queryByText("stale row")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("keeps loaded rows visible while a further page loads", () => {
    render(
      <FileListFrame
        count={1}
        emptyState={null}
        errorLabel="Error"
        hasMore
        isError={false}
        isLoading={false}
        isLoadingMore
        listLabel="Files"
        loadingLabel="Loading"
        loadMoreLabel="More"
        onLoadMoreAction={vi.fn()}
        onReloadAction={vi.fn()}
        retryLabel="Retry"
        rows={<li>Document</li>}
        shownLabel="1 of 2"
      />,
    );
    expect(screen.getByRole("list", { name: "Files" })).toHaveTextContent(
      "Document",
    );
    expect(screen.getByRole("button", { name: "More" })).toBeDisabled();
  });
});
