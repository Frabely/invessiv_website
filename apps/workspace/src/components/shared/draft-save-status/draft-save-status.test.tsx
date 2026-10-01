// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DraftSaveState } from "@/common/constants/shared/draft-save-states";
import { DraftSaveStatus } from "./draft-save-status";

const texts = {
  saving: "Saving …",
  saved: "Saved · {time}",
  unsaved: "Not saved yet",
  failed: "Saving failed.",
  retry: "Try again",
  editedBy: "last edited by {name}",
  justNow: "just now",
  minutesAgo: "{count} min ago",
  at: "on {date}",
};

function renderStatus(
  overrides: Partial<Parameters<typeof DraftSaveStatus>[0]> = {},
) {
  const onRetryAction = vi.fn();
  render(
    <DraftSaveStatus
      errorText={null}
      locale="en"
      onRetryAction={onRetryAction}
      saveState={DraftSaveState.Idle}
      savedAt={null}
      savedByName={null}
      texts={texts}
      {...overrides}
    />,
  );
  return { onRetryAction };
}

describe("DraftSaveStatus", () => {
  afterEach(cleanup);

  it("words the last save and who made it in a polite status region", () => {
    renderStatus({
      saveState: DraftSaveState.Saved,
      savedAt: new Date().toISOString(),
      savedByName: "Ada",
    });

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Saved · just now");
    expect(status).toHaveTextContent("last edited by Ada");
  });

  it("counts minutes since the last save", () => {
    renderStatus({
      saveState: DraftSaveState.Saved,
      savedAt: new Date(Date.now() - 2 * 60_000).toISOString(),
    });

    expect(screen.getByRole("status")).toHaveTextContent("Saved · 2 min ago");
  });

  it("hides the editor's name while a save runs", () => {
    renderStatus({ saveState: DraftSaveState.Saving, savedByName: "Ada" });

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Saving …");
    expect(status).not.toHaveTextContent("Ada");
  });

  it("offers a retry with the reason after a failed save", () => {
    const { onRetryAction } = renderStatus({
      saveState: DraftSaveState.Failed,
      errorText: "Something went wrong.",
    });

    expect(screen.getByRole("status")).toHaveTextContent("Saving failed.");
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetryAction).toHaveBeenCalledOnce();
  });

  it("renders the conflict slot of its user", () => {
    renderStatus({ conflict: <p role="alert">Someone else saved</p> });

    expect(screen.getByRole("alert")).toHaveTextContent("Someone else saved");
  });
});
