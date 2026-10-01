// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { getCrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { OrderedBlockListEditor } from "./ordered-block-list-editor";

const labels = getCrmQuestionnaireDictionary("de").templateEditor.blocks;
const NAMES: Record<string, string> = {
  a: "Ansprechpartner",
  b: "Unternehmen",
  c: "Rechtliches",
};

function Harness() {
  const [ids, setIds] = useState(["a", "b", "c"]);
  const [announcement, setAnnouncement] = useState("");
  return (
    <>
      <OrderedBlockListEditor
        empty={<p>leer</p>}
        items={ids.map((id) => ({ id, name: NAMES[id]! }))}
        labels={labels}
        onAnnounceAction={setAnnouncement}
        onChangeAction={setIds}
      />
      <output data-testid="announcement">{announcement}</output>
    </>
  );
}

function order() {
  return screen
    .getAllByRole("listitem")
    .map((row) => row.textContent?.replace(/^\d+/, ""));
}

describe("OrderedBlockListEditor", () => {
  afterEach(cleanup);

  it("moves, announces and keeps focus on the moved row", () => {
    render(<Harness />);
    const down = screen.getByRole("button", {
      name: "„Ansprechpartner“ nach unten",
    });
    fireEvent.click(down);

    expect(order()).toEqual(["Unternehmen", "Ansprechpartner", "Rechtliches"]);
    expect(screen.getByTestId("announcement")).toHaveTextContent(
      "„Ansprechpartner“ steht jetzt an Position 2.",
    );
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "„Ansprechpartner“ nach unten" }),
    );
  });

  it("disables moves past either end and removes rows", () => {
    render(<Harness />);
    expect(
      screen.getByRole("button", { name: "„Ansprechpartner“ nach oben" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "„Rechtliches“ nach unten" }),
    ).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", { name: "„Unternehmen“ entfernen" }),
    );
    expect(order()).toEqual(["Ansprechpartner", "Rechtliches"]);
    expect(screen.getByTestId("announcement")).toHaveTextContent(
      "„Unternehmen“ wurde entfernt.",
    );
  });

  it("shows the order without any control when it is read-only", () => {
    render(
      <OrderedBlockListEditor
        empty={<p>leer</p>}
        items={[
          { id: "a", name: NAMES.a! },
          { id: "b", name: NAMES.b! },
        ]}
        labels={labels}
        onAnnounceAction={() => undefined}
        onChangeAction={() => undefined}
        readOnly
      />,
    );
    expect(order()).toEqual(["Ansprechpartner", "Unternehmen"]);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
