// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { ProjectsPage } from "./projects-page";

vi.mock("next/image", () => ({
  default: (
    props: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean },
  ) => {
    const { priority, ...imgProps } = props;
    void priority;

    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={imgProps.alt ?? ""} {...imgProps} />;
  },
}));

vi.mock("@/components/marketing/site-header/site-header", () => ({
  SiteHeader: () => <div data-testid="site-header" />,
}));

vi.mock(
  "@/components/marketing/home/sections/footer-section/footer-section",
  () => ({
    FooterSection: () => <div data-testid="footer-section" />,
  }),
);

describe("ProjectsPage", () => {
  it("renders breadcrumbs, both case studies, and primary actions", () => {
    render(
      <ProjectsPage
        content={{
          breadcrumbs: {
            navLabel: "Breadcrumb-Navigation",
            homeLabel: "Start",
            currentLabel: "Projekte",
          },
          hero: {
            kicker: "Ausgewählte Projekte",
            title:
              "Webseiten und Tools, die sichtbar ordnen, statt nur gut auszusehen.",
            intro:
              "Die Projektseite zeigt bewusst nur zwei live einsehbare Beispiele.",
            highlights: [
              "2 live einsehbare Referenzen",
              "Webseite + Software",
              "fokussiert statt überladen",
            ],
            supportingNote: "Die Mockups treten bewusst einen Schritt zurück.",
          },
          sectionIntro: {
            eyebrow: "Kuratierte Übersicht",
            title:
              "Zwei Umsetzungen, zwei Kontexte, ein gemeinsamer Qualitätsanspruch.",
            description:
              "Jedes Projekt wird als kompakte Fallstudie dargestellt.",
          },
          projects: [
            {
              imageKey: "broker",
              imageAlt:
                "Vorschau einer Finanzmakler-Webseite mit klarer Struktur",
              kicker: "Webseiten-Projekt",
              category: "Positionierung & Anfragen",
              title: "Finanzmakler-Webseite mit klarer Positionierung",
              summary:
                "Ein ruhiger, vertrauenswürdiger Auftritt für einen Finanzmakler.",
              focusLabel: "Projektfokus",
              focus:
                "Vertrauen aufbauen und Interessenten klar zur passenden Anfrage führen.",
              deliverablesLabel: "Leistungsbausteine",
              deliverables: [
                "Positionierung und Seiteneinstieg geschärft",
                "klare Angebots- und CTA-Hierarchie",
              ],
              outcomesLabel: "Was das Ergebnis leistet",
              outcomes: [
                "macht den Angebotsrahmen verständlicher",
                "führt Anfragen nachvollziehbar in den Kontakt",
              ],
              linkLabel: "Zur Webseite",
              href: "https://mywebpage-480c1.web.app",
            },
            {
              imageKey: "consumption",
              imageAlt:
                "Vorschau eines Tools zur Erfassung von Verbrauchsdaten",
              kicker: "Software-Projekt",
              category: "Datenerfassung & Verbrauch",
              title:
                "Consumption Trial zur strukturierten Erfassung von Verbrauchsdaten",
              summary:
                "Ein fokussiertes Tool, das technische Daten in einer klaren Oberfläche bündelt.",
              focusLabel: "Projektfokus",
              focus:
                "Wiederkehrende Eingaben vereinfachen und technische Daten lesbar machen.",
              deliverablesLabel: "Leistungsbausteine",
              deliverables: [
                "kompakte Eingabelogik statt unnötiger Reibung",
                "bessere Lesbarkeit im laufenden Workflow",
              ],
              outcomesLabel: "Was das Ergebnis leistet",
              outcomes: [
                "senkt manuellen Aufwand in der Erfassung",
                "ordnet den Prozess in einer klaren UI",
              ],
              linkLabel: "Zum Projekt",
              href: "https://consumption-trial.invessiv.com/",
            },
          ],
          closingCta: {
            title:
              "Wenn dein nächstes Projekt dieselbe Klarheit braucht, ist der nächste Schritt kurz.",
            supportingText:
              "Ob neue Webseite, Relaunch oder internes Tool: entscheidend ist eine klare Führung vor dem ersten Build.",
            primaryLabel: "Projekt anfragen",
            primaryHref: "/de#contact",
            secondaryLabel: "Leistungsmodelle",
            secondaryHref: "/de#services",
          },
        }}
        locale="de"
      />,
    );

    expect(screen.getByTestId("site-header")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb-Navigation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Webseiten und Tools, die sichtbar ordnen, statt nur gut auszusehen.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Finanzmakler-Webseite mit klarer Positionierung"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Consumption Trial zur strukturierten Erfassung von Verbrauchsdaten",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zur Webseite" })).toHaveAttribute(
      "href",
      "https://mywebpage-480c1.web.app",
    );
    expect(screen.getByRole("link", { name: "Zum Projekt" })).toHaveAttribute(
      "href",
      "https://consumption-trial.invessiv.com/",
    );
    expect(
      screen.getByRole("link", { name: "Projekt anfragen" }),
    ).toHaveAttribute("href", "/de#contact");
    expect(screen.getByTestId("footer-section")).toBeInTheDocument();
  });
});
