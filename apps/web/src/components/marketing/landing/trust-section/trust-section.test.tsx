// @vitest-environment jsdom

import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TrustSection } from "./trust-section";

const CONTENT = {
  body: "Was das für dein Projekt heißt, liest du hier — Nachricht für Nachricht.",
  chat: {
    avatarAlt: "Moritz Hecht, dein direkter Ansprechpartner bei Invessiv",
    messages: [
      {
        title: "Eine Ansprechperson",
        body: "Du schreibst mit der Person, die deine Seite baut.",
      },
      {
        title: "Keine versteckten Kosten",
        body: "Mehrumfang wird vorher abgestimmt.",
      },
    ],
    name: "Moritz Hecht",
    replyCtaLabel: "Kostenlose Ersteinschätzung anfragen",
    role: "Baut deine Landingpage",
    statusLabel: "Antwortet innerhalb von 24 Std.",
    threadLabel: "Was du von der Zusammenarbeit erwarten kannst",
  },
  eyebrow: "So arbeite ich",
  title: "Du arbeitest direkt mit mir. Nicht mit einer Agentur.",
  titleHighlight: "mir",
};

function renderTrustSection() {
  return render(
    <TrustSection
      id="trust"
      locale="de"
      replyAnalyticsTarget="contact"
      replyHref="#contact"
      {...CONTENT}
    />,
  );
}

describe("TrustSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders heading, chat identity, and all messages in a labelled thread", () => {
    renderTrustSection();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Du arbeitest direkt mit mir/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("img", {
        name: "Moritz Hecht, dein direkter Ansprechpartner bei Invessiv",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Moritz Hecht")).toBeTruthy();
    expect(screen.getByText("Baut deine Landingpage")).toBeTruthy();
    expect(screen.getByText("Antwortet innerhalb von 24 Std.")).toBeTruthy();

    const thread = screen.getByRole("list", {
      name: "Was du von der Zusammenarbeit erwarten kannst",
    });
    expect(within(thread).getAllByRole("listitem")).toHaveLength(2);
    expect(within(thread).getByText("Eine Ansprechperson")).toBeTruthy();
    expect(within(thread).getByText("Keine versteckten Kosten")).toBeTruthy();
    expect(within(thread).queryByText(/Referenzprojekt/)).toBeNull();
  });

  it("renders the reply bar as the canonical CTA link with analytics attributes", () => {
    renderTrustSection();

    const reply = screen.getByRole("link", {
      name: /Kostenlose Ersteinschätzung anfragen/,
    });
    expect(reply.getAttribute("href")).toBe("#contact");
    expect(reply.dataset.analyticsEvent).toBe("cta_click");
    expect(reply.dataset.analyticsLocation).toBe("trust");
    expect(reply.dataset.analyticsTarget).toBe("contact");
    expect(reply.dataset.analyticsVariant).toBe("secondary");
  });

  it("marks messages as visible for the staggered reveal", async () => {
    renderTrustSection();

    const firstMessage = screen
      .getByText("Eine Ansprechperson")
      .closest("li") as HTMLElement;
    await waitFor(() => {
      expect(firstMessage.dataset.visible).toBe("true");
    });
  });
});
