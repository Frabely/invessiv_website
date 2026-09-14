// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  DefinitionList,
  DefinitionListItem,
  DetailSection,
} from "@invessiv/ui";

afterEach(() => cleanup());

describe("detail components", () => {
  it("renders a labelled section and definition entries", () => {
    render(
      <DetailSection id="contact" title="Kontakt">
        <DefinitionList>
          <DefinitionListItem label="E-Mail" value="hello@example.com" />
        </DefinitionList>
      </DetailSection>,
    );

    expect(
      screen.getByRole("heading", { name: "Kontakt" }),
    ).toBeInTheDocument();
    expect(screen.getByText("E-Mail")).toBeInTheDocument();
    expect(screen.getByText("hello@example.com")).toBeInTheDocument();
  });
});
