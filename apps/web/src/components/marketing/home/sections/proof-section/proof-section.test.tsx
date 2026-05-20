// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProofSection } from "./proof-section";

const GOOGLE_REVIEW_PLACEHOLDER_URL = "https://www.google.com";

describe("ProofSection", () => {
  it("renders two review cards and a tall placeholder card", () => {
    render(
      <ProofSection
        description="aus realen Web- & Softwareprojekten"
        featuredProject={{
          ariaLabel: "Umgesetztes Projekt für Kolja Wienigk",
          kicker: "Umgesetztes Projekt",
          title:
            "Neue Webseite für einen Finanzmakler mit klarer Positionierung",
          description:
            "Das ist das konkret umgesetzte Projekt für Kolja: ein ruhiger, vertrauenswürdiger Auftritt mit klarer Angebotsstruktur, sauberer Führung und einer Startseite, die Leistungen direkt verständlich macht.",
          meta: "Umgesetzt für Kolja Wienigk",
        }}
        highlightsAriaLabel="Highlights der Referenzsektion"
        id="proof"
        moreProjects={{
          title: "Projektübersicht",
          description:
            "In der Projektübersicht findest du aktuell noch ein weiteres umgesetztes Beispiel.",
          ctaLabel: "Projektübersicht öffnen",
          href: "/de/projects",
        }}
        ratingAriaLabel="5 von 5 Sternen"
        reviewLinkLabel="Bei Google ansehen"
        reviews={[
          {
            authorName: "Kolja Wienigk",
            context: "Finanzmakler aus Dresden",
            excerpt:
              "Vom ersten Gespräch an war klar, welche Schritte sinnvoll sind und worauf wir zuerst den Fokus legen sollten. Die Umsetzung wirkte strukturiert, schnell und ohne unnötige Schleifen.",
            profileImageSrc: "/assets/kolja.png",
            reviewHref: GOOGLE_REVIEW_PLACEHOLDER_URL,
            sourceLabel: "Google Bewertung",
          },
          {
            authorName: "Andreas H.",
            context: "Chemnitz",
            excerpt:
              "Besonders hilfreich war die klare Kommunikation im Projekt. Entscheidungen wurden sauber vorbereitet, Feedback schnell umgesetzt und das Ergebnis hat deutlich professioneller gewirkt als vorher.",
            reviewHref: GOOGLE_REVIEW_PLACEHOLDER_URL,
            sourceLabel: "Google Bewertung",
          },
        ]}
        summaryPoints={[
          "5,0 ★★★★★ bei Google",
          "echte Kundenstimmen",
          "klare Ergebnisse",
        ]}
        title="Was Kunden über die Zusammenarbeit sagen"
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Was Kunden über die Zusammenarbeit sagen",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("5,0 ★★★★★ bei Google")).toBeInTheDocument();
    expect(screen.getByText("echte Kundenstimmen")).toBeInTheDocument();
    expect(screen.getByText("klare Ergebnisse")).toBeInTheDocument();
    expect(screen.getByText("Kolja Wienigk")).toBeInTheDocument();
    expect(screen.getByText("Finanzmakler aus Dresden")).toBeInTheDocument();
    expect(screen.getByText("Andreas H.")).toBeInTheDocument();
    expect(screen.getByText("Chemnitz")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Besonders hilfreich war die klare Kommunikation im Projekt. Entscheidungen wurden sauber vorbereitet, Feedback schnell umgesetzt und das Ergebnis hat deutlich professioneller gewirkt als vorher.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Vom ersten Gespräch an war klar, welche Schritte sinnvoll sind und worauf wir zuerst den Fokus legen sollten. Die Umsetzung wirkte strukturiert, schnell und ohne unnötige Schleifen.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Google Bewertung")).toHaveLength(2);
    expect(
      screen.getAllByRole("link", { name: "Bei Google ansehen" }),
    ).toHaveLength(2);
    expect(
      screen.getByRole("listitem", {
        name: "Umgesetztes Projekt für Kolja Wienigk",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Umgesetztes Projekt")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Neue Webseite für einen Finanzmakler mit klarer Positionierung",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Umgesetzt für Kolja Wienigk")).toBeInTheDocument();
    expect(screen.getByText("Projektübersicht")).toBeInTheDocument();
    expect(
      screen.getByText(
        "In der Projektübersicht findest du aktuell noch ein weiteres umgesetztes Beispiel.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Projektübersicht öffnen" }),
    ).toHaveAttribute("href", "/de/projects");
    expect(screen.getByText("Projektübersicht")).toBeInTheDocument();
    expect(screen.queryByText("Projektbeispiel")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Erfassung und Auswertung von teschnische Daten und Verbräuchen",
      ),
    ).not.toBeInTheDocument();
  });
});
