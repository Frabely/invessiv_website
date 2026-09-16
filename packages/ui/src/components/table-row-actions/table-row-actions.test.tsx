// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TableRowActions } from "@invessiv/ui";

describe("TableRowActions", () => {
  afterEach(cleanup);

  it("exposes a labelled action group and toggles its expanded state", () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableRowActions
              menuIcon={<span aria-hidden="true">…</span>}
              menuLabel="Actions"
            >
              <button aria-label="Edit" type="button">
                Edit
              </button>
            </TableRowActions>
          </tr>
        </tbody>
      </table>,
    );

    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).not.toHaveAttribute("aria-haspopup");
    const actionGroupId = trigger.getAttribute("aria-controls");
    expect(actionGroupId).toBeTruthy();
    expect(document.getElementById(actionGroupId!)).toBeInTheDocument();

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("uses a stable caller-provided action group id", () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableRowActions
              actionGroupId="customer-1-actions"
              menuIcon={<span aria-hidden="true">…</span>}
              menuLabel="Actions"
            >
              <button type="button">Edit</button>
            </TableRowActions>
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByRole("button", { name: "Actions" })).toHaveAttribute(
      "aria-controls",
      "customer-1-actions",
    );
    expect(document.getElementById("customer-1-actions")).toBeInTheDocument();
  });
});
