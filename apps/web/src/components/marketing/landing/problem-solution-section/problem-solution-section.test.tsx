// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LANDING_PREVIEW_ANCHOR_ORDER,
  LandingPreviewAnchor,
} from "@/common/constants/marketing";
import { ProblemSolutionSection } from "./problem-solution-section";

const CONTENT = {
  body: "Eine Landingpage bündelt dein Angebot auf einer Seite.",
  eyebrow: "Was sich ändert",
  labels: {
    problem: "Problem",
    solution: "Lösung",
  },
  pairs: {
    cta: {
      problem: "Nächster Schritt unklar",
      solution: "Nächster Schritt eindeutig",
    },
    form: {
      problem: "Kontakt wirkt wie Aufwand",
      solution: "Anfrage in zwei Minuten",
    },
    headline: {
      problem: "Angebot zu allgemein",
      solution: "Angebot klar auf den Punkt",
    },
    offer: {
      problem: "Unklar, was man bekommt",
      solution: "Der Umfang steht auf der Seite",
    },
    problems: {
      problem: "Besucher fühlen sich nicht gemeint",
      solution: "Ihre Lage, in ihren Worten",
    },
  },
  title: "Warum Besucher abspringen — und was deine Landingpage anders macht.",
};

function renderSection({
  activeAnchor = null,
  selectedAnchor = null,
  usesTapToggle = false,
}: {
  activeAnchor?: LandingPreviewAnchor | null;
  selectedAnchor?: LandingPreviewAnchor | null;
  usesTapToggle?: boolean;
} = {}) {
  const onAnchorFocus = vi.fn();
  const onAnchorHover = vi.fn();
  const onAnchorToggle = vi.fn();

  render(
    <ProblemSolutionSection
      {...CONTENT}
      activeAnchor={activeAnchor}
      id="solution"
      locale="de"
      onAnchorFocus={onAnchorFocus}
      onAnchorHover={onAnchorHover}
      onAnchorToggle={onAnchorToggle}
      selectedAnchor={selectedAnchor}
      usesTapToggle={usesTapToggle}
    />,
  );

  return { onAnchorFocus, onAnchorHover, onAnchorToggle };
}

describe("ProblemSolutionSection", () => {
  afterEach(cleanup);

  it("renders heading, body, and every anchor with its problem and solution", () => {
    renderSection();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Warum Besucher abspringen/,
      }),
    ).toBeTruthy();
    expect(screen.getByText(CONTENT.body)).toBeTruthy();
    expect(screen.getByText(CONTENT.labels.problem)).toBeTruthy();
    expect(screen.getByText(CONTENT.labels.solution)).toBeTruthy();

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(LANDING_PREVIEW_ANCHOR_ORDER.length);

    LANDING_PREVIEW_ANCHOR_ORDER.forEach((anchor, position) => {
      const pair = CONTENT.pairs[anchor];
      const text = items[position]?.textContent ?? "";

      expect(text).toContain(pair.problem);
      expect(text).toContain(pair.solution);
    });
  });

  it("reports the hovered anchor and releases it when the mouse leaves", () => {
    const { onAnchorFocus, onAnchorHover } = renderSection();

    const [firstRow] = screen.getAllByRole("button");
    fireEvent.pointerEnter(firstRow as HTMLElement, { pointerType: "mouse" });
    expect(onAnchorHover).toHaveBeenCalledWith(LandingPreviewAnchor.Headline);

    fireEvent.pointerLeave(firstRow as HTMLElement, { pointerType: "mouse" });
    expect(onAnchorHover).toHaveBeenCalledWith(null);
    expect(onAnchorFocus).toHaveBeenCalledWith(null);
  });

  it("keeps the anchor when a touch pointer leaves", () => {
    const { onAnchorHover } = renderSection();

    const [firstRow] = screen.getAllByRole("button");
    fireEvent.pointerLeave(firstRow as HTMLElement, { pointerType: "touch" });

    expect(onAnchorHover).not.toHaveBeenCalled();
  });

  it("reports the focused anchor and releases it on blur", () => {
    const { onAnchorFocus } = renderSection();

    const rows = screen.getAllByRole("button");
    fireEvent.focus(rows[1] as HTMLElement);
    expect(onAnchorFocus).toHaveBeenCalledWith(LandingPreviewAnchor.Cta);

    fireEvent.blur(rows[1] as HTMLElement);
    expect(onAnchorFocus).toHaveBeenCalledWith(null);
  });

  it("ignores clicks while the pointer layout is active", () => {
    const { onAnchorToggle } = renderSection();

    fireEvent.click(screen.getAllByRole("button")[2] as HTMLElement);
    expect(onAnchorToggle).not.toHaveBeenCalled();
  });

  it("offers no toggle state while the pointer layout is active", () => {
    renderSection({ activeAnchor: LandingPreviewAnchor.Problems });

    const withToggleState = screen
      .getAllByRole("button")
      .filter((row) => row.hasAttribute("aria-pressed"));

    expect(withToggleState).toHaveLength(0);
  });

  it("reports the clicked anchor in the tap layout", () => {
    const { onAnchorToggle } = renderSection({ usesTapToggle: true });

    fireEvent.click(screen.getAllByRole("button")[3] as HTMLElement);
    expect(onAnchorToggle).toHaveBeenCalledWith(LandingPreviewAnchor.Offer);
  });

  it("keeps focus from driving the highlight in the tap layout", () => {
    const { onAnchorFocus } = renderSection({ usesTapToggle: true });

    const rows = screen.getAllByRole("button");
    fireEvent.focus(rows[1] as HTMLElement);

    expect(onAnchorFocus).not.toHaveBeenCalledWith(LandingPreviewAnchor.Cta);
  });

  it("marks exactly the active row", () => {
    renderSection({ activeAnchor: LandingPreviewAnchor.Problems });

    const active = screen
      .getAllByRole("button")
      .filter((row) => row.dataset.active === "true");

    expect(active).toHaveLength(1);
    expect(active[0]?.textContent).toContain(CONTENT.pairs.problems.solution);
  });

  it("exposes the tapped selection with aria-pressed", () => {
    renderSection({
      activeAnchor: LandingPreviewAnchor.Problems,
      selectedAnchor: LandingPreviewAnchor.Problems,
      usesTapToggle: true,
    });

    const pressed = screen
      .getAllByRole("button")
      .filter((row) => row.getAttribute("aria-pressed") === "true");

    expect(pressed).toHaveLength(1);
    expect(pressed[0]?.textContent).toContain(CONTENT.pairs.problems.solution);
  });

  it("marks items as visible for the staggered reveal", async () => {
    renderSection();

    const firstPair = screen
      .getByText(CONTENT.pairs.headline.problem)
      .closest("li") as HTMLElement;

    await waitFor(() => {
      expect(firstPair.dataset.visible).toBe("true");
    });
  });
});
