// @vitest-environment jsdom

import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProcessSection } from "./process-section";

describe("ProcessSection", () => {
  it("renders summary, roles, steps and cta content", () => {
    render(
      <ProcessSection
        description="Beschreibung"
        id="process"
        processCta={{
          href: "#contact",
          hint: "Unverbindlich",
          label: "Kickoff buchen",
        }}
        processDotRef={createRef<SVGCircleElement>()}
        processPathRef={createRef<SVGPathElement>()}
        processRoles={[
          { label: "Du lieferst", items: ["Ziel", "Angebot"] },
          { label: "Wir liefern", items: ["Struktur", "Launch"] },
        ]}
        processSectionRef={createRef<HTMLElement>()}
        processSteps={[
          {
            step: "01",
            title: "Briefing",
            deliverable: "30-min Briefing",
            effort: "30 Min",
            result: "Scope",
            description: "Kurze Beschreibung",
          },
        ]}
        processStepsRef={createRef<HTMLDivElement>()}
        summary="Draft in 48h"
        title="In 4 Schritten"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "In 4 Schritten" }),
    ).toBeTruthy();
    expect(screen.getByText("Draft in 48h")).toBeTruthy();
    expect(screen.getByText("Du lieferst:")).toBeTruthy();
    expect(screen.getByText("30-min Briefing")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Kickoff buchen" }).getAttribute("href"),
    ).toBe("#contact");
  });
});
