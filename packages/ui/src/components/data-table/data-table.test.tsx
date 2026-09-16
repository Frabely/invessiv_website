// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  DataTable,
  DataTableBody,
  DataTableCaption,
  DataTableCell,
  DataTableFrame,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableLayout,
  DataTableRow,
} from "./data-table";

afterEach(cleanup);

describe("DataTable", () => {
  it("renders semantic table sections and cells", () => {
    render(
      <DataTableFrame>
        <DataTable>
          <DataTableCaption>Customers</DataTableCaption>
          <DataTableHeader>
            <DataTableRow>
              <DataTableHeaderCell scope="col">Name</DataTableHeaderCell>
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            <DataTableRow>
              <DataTableCell>Nordlicht Coaching</DataTableCell>
            </DataTableRow>
          </DataTableBody>
        </DataTable>
      </DataTableFrame>,
    );

    expect(
      screen.getByRole("table", { name: "Customers" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
      "scope",
      "col",
    );
    expect(
      screen.getByRole("cell", { name: "Nordlicht Coaching" }),
    ).toBeInTheDocument();
  });

  it("marks a row for the shared mobile card shell", () => {
    render(
      <DataTable>
        <DataTableBody>
          <DataTableRow mobileCard>
            <DataTableCell>Nordlicht Coaching</DataTableCell>
          </DataTableRow>
        </DataTableBody>
      </DataTable>,
    );

    expect(screen.getByRole("row")).toHaveAttribute("data-mobile-card", "true");
  });
});

describe("DataTableLayout", () => {
  it("renders configured columns, headers, and body rows", () => {
    render(
      <DataTableLayout
        ariaLabel="Customers"
        caption="Customers"
        columns={[
          { id: "name", header: "Name", width: 192 },
          {
            header: "Actions",
            id: "actions",
            isPinned: true,
            isVisuallyHidden: true,
            width: 128,
          },
        ]}
      >
        <tr>
          <td>Nordlicht Coaching</td>
          <td />
        </tr>
      </DataTableLayout>,
    );

    expect(
      screen.getByRole("table", { name: "Customers" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Name" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Actions" }),
    ).toBeInTheDocument();
  });
});
