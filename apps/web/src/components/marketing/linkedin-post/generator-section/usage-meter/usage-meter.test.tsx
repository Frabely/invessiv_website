// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getLinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { UsageMeter } from "./usage-meter";

const content = getLinkedInPostGeneratorContent("de").usageMeter;

afterEach(cleanup);

describe("UsageMeter", () => {
  it("shows the idle hint and two free pips before the first run", () => {
    const { container } = render(<UsageMeter content={content} locale="de" />);

    expect(screen.getByText(content.idle)).toBeTruthy();
    const pips = container.querySelectorAll("[data-state]");
    expect(pips.length).toBe(2);
    expect(
      Array.from(pips).every(
        (pip) => pip.getAttribute("data-state") === "free",
      ),
    ).toBe(true);
  });

  it("shows remaining count and reset date after a run", () => {
    const { container } = render(
      <UsageMeter
        content={content}
        locale="de"
        usageLimit={{
          limit: 2,
          remaining: 1,
          resetAt: "2026-07-01T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText("Noch 1 von 2 Tests")).toBeTruthy();
    expect(screen.getByText(/Neue Tests ab/)).toBeTruthy();
    // 1 free + 1 used pip.
    const pips = container.querySelectorAll("[data-state]");
    expect(
      Array.from(pips).filter(
        (pip) => pip.getAttribute("data-state") === "free",
      ).length,
    ).toBe(1);
  });

  it("marks the meter depleted when no tests remain", () => {
    const { container } = render(
      <UsageMeter
        content={content}
        locale="de"
        usageLimit={{
          limit: 2,
          remaining: 0,
          resetAt: "2026-07-01T00:00:00.000Z",
        }}
      />,
    );

    expect(container.querySelector('[data-depleted="true"]')).toBeTruthy();
    expect(screen.getByText("Noch 0 von 2 Tests")).toBeTruthy();
  });
});
