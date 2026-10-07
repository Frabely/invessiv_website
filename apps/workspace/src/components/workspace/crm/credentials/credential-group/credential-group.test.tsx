// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CredentialGroup } from "./credential-group";

afterEach(cleanup);
describe("CredentialGroup", () => {
  it("keeps an empty project group visible with its own explanation", () => {
    render(
      <CredentialGroup
        title="Website"
        emptyText="No project entries"
        hint="Customer entries also apply"
      >
        {[]}
      </CredentialGroup>,
    );
    const group = screen.getByRole("region", { name: "Website" });
    expect(within(group).getByText("No project entries")).toBeInTheDocument();
    expect(
      within(group).getByText("Customer entries also apply"),
    ).toBeInTheDocument();
    expect(within(group).queryByRole("list")).toBeNull();
  });
  it("uses the group label and hides the empty message when entries exist", () => {
    render(
      <CredentialGroup title="Website" emptyText="No project entries">
        {[<li key="one">Hosting</li>]}
      </CredentialGroup>,
    );
    expect(
      within(screen.getByRole("region", { name: "Website" })).getByRole(
        "listitem",
      ),
    ).toHaveTextContent("Hosting");
    expect(screen.queryByText("No project entries")).toBeNull();
  });
});
