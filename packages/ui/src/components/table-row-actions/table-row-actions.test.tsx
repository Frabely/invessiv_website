// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableRowActions } from "./table-row-actions";

describe("TableRowActions", () => {
  it("exposes a labelled action menu and toggles its expanded state", () => {
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

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });
});
