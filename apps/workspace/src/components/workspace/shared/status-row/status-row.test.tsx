// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StatusRowTone } from "@/common/constants/ui/status-row-tones";
import { StatusRow } from "./status-row";

afterEach(cleanup);

function renderRow(props: Partial<Parameters<typeof StatusRow>[0]> = {}) {
  return render(
    <ul>
      <StatusRow
        status={<button type="button">Status ändern</button>}
        {...props}
      >
        <span>Inhalt</span>
      </StatusRow>
    </ul>,
  );
}

describe("StatusRow", () => {
  it("offers the status control and the open target as two separate targets", () => {
    const onOpenAction = vi.fn();
    renderRow({ onOpenAction, openLabel: "Zeile öffnen" });

    fireEvent.click(screen.getByRole("button", { name: "Zeile öffnen" }));
    expect(onOpenAction).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("button", { name: "Status ändern" }),
    ).toBeInTheDocument();
  });

  it("renders plain content without an open target when nothing opens", () => {
    renderRow();

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByText("Inhalt")).toBeInTheDocument();
  });

  it("exposes tone and pending state for styling", () => {
    renderRow({ pending: true, tone: StatusRowTone.Attention });

    const row = screen.getByRole("listitem");
    expect(row).toHaveAttribute("data-tone", "attention");
    expect(row).toHaveAttribute("data-pending", "true");
    expect(row).not.toHaveAttribute("data-align");
  });

  it("pins the status slot to the top on request", () => {
    renderRow({ alignStart: true });

    expect(screen.getByRole("listitem")).toHaveAttribute("data-align", "start");
  });
});
