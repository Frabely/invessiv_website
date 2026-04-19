// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ServicesSection } from "./services-section";

const serviceCards = [
  {
    key: "web" as const,
    iconSrc: "/services/coding-icon.svg",
    iconAlt: "Web Icon",
    title: "Webseiten",
    description: "Webseiten Paket.",
    fit: "Relaunches mit mehreren Kernseiten.",
    highlight: "klarer professioneller Auftritt",
    pricingHint: "Individuelles Angebot nach Seitenumfang und Tiefe",
    delivery: "7-14 Tage",
    included: ["Konzept", "UI", "Setup", "Review", "Übergabe"],
    details: ["Zweiter Zusatzhinweis"],
  },
  {
    key: "landing" as const,
    iconSrc: "/services/website-layout-icon.svg",
    iconAlt: "Landing Icon",
    title: "Landingpages",
    description: "Landingpage Paket.",
    fit: "Angebotsseiten mit klarem Conversion-Ziel.",
    highlight: "schnell live & conversion-fokussiert",
    pricingHint: "Angebot nach Ziel, Umfang und Feedbackbedarf",
    delivery: "3-7 Tage",
    included: ["Rahmen", "Design", "SEO", "Performance", "Tracking"],
    details: ["Zusatzhinweis"],
  },
  {
    key: "process" as const,
    iconSrc: "/services/process-icon.svg",
    iconAlt: "Process Icon",
    title: "Prozess-Tools",
    description: "Workflows digitalisieren.",
    fit: "Teams mit klaren Routineabläufen.",
    highlight: "weniger manuelle Schritte im Alltag",
    pricingHint: "Kalkulation nach Workflow, Daten und Integrationen",
    delivery: "1-2 Wochen",
    included: ["Audit", "Konzept", "Setup", "Testing"],
  },
  {
    key: "upgrade" as const,
    iconSrc: "/services/upgrade-icon.svg",
    iconAlt: "Upgrade Icon",
    title: "Webseiten-Upgrade",
    description: "Bestehendes verbessern.",
    fit: "Für Seiten mit Potenzial.",
    highlight: "spürbare UX- und Speed-Verbesserung",
    pricingHint: "Angebot nach Ist-Zustand und Eingriffstiefe",
    delivery: "2-5 Tage",
    included: ["Analyse", "UX", "Optimierung"],
  },
  {
    key: "maintenance" as const,
    iconSrc: "/services/customer-service-icon.svg",
    iconAlt: "Support Icon",
    title: "Wartung & Support",
    description: "Pflege und Support.",
    fit: "Für laufende Anpassungen.",
    highlight: "schnelle Hilfe für laufende Themen",
    pricingHint: "Nach Aufwand oder abgestimmtem Betreuungspaket",
    delivery: "24-72h",
    included: ["Bugfixes", "Anpassungen", "Checks"],
  },
];

const goalOptions = [
  { key: "more_inquiries", label: "mehr Anfragen gewinnen" },
  { key: "professional_presence", label: "professionell online auftreten" },
  { key: "simplify_workflows", label: "interne Abläufe vereinfachen" },
];

function renderSection() {
  return render(
    <ServicesSection
      addonBadgeLabel="Add-on"
      deliveryLabel="Lieferzeit"
      detailsCtaLabel="Mehr Infos"
      fitLabel="Ideal für"
      goalOptions={goalOptions}
      goalTitle="Wähle dein Ziel – wir markieren das passendste Leistungsmodell."
      id="services"
      moreItemsPluralLabel="weitere Punkte"
      moreItemsSingularLabel="weiterer Punkt"
      primaryCtaLabel="Projekt anfragen"
      primaryCtaLabels={{
        landing: "Projekt anfragen",
        maintenance: "Wartung & Support anfragen",
        process: "Projekt anfragen",
        upgrade: "Upgrade anfragen",
        web: "Projekt anfragen",
      }}
      recommendedBadgeLabel="Empfohlen"
      sectionRef={{ current: null }}
      serviceCards={serviceCards}
      serviceContextNote="Alle Projekte werden individuell kalkuliert. Du erhältst vor Start ein verbindliches Angebot in Textform."
      serviceSecondaryTitle="Schon etwas da?"
      title="Was brauchst du gerade?"
    />,
  );
}

function getArticleByTitle(title: string) {
  const matchingElements = screen.getAllByText(title);
  const article = matchingElements.find((element) =>
    element.closest("article"),
  );

  if (!article) {
    throw new Error(`No article found for title: ${title}`);
  }

  return article.closest("article") as HTMLElement;
}

describe("ServicesSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders chips, three primary cards, two secondary cards, and marks landing as the mobile priority by default", () => {
    const { container } = renderSection();

    const primaryCards = Array.from(
      container.querySelectorAll("[data-service-variant='primary']"),
    );
    const secondaryCards = Array.from(
      container.querySelectorAll("[data-service-variant='secondary']"),
    );

    expect(
      screen.getByText(
        "Wähle dein Ziel – wir markieren das passendste Leistungsmodell.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Alle Projekte werden individuell kalkuliert. Du erhältst vor Start ein verbindliches Angebot in Textform.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Was brauchst du gerade?",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Wähle dein Ziel – wir markieren das passendste Leistungsmodell.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "mehr Anfragen gewinnen" }),
    ).toBeTruthy();
    expect(screen.queryByText("Umfang vor Start")).toBeNull();
    expect(screen.queryByText("Klare Lieferfenster")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Bestehendes verbessern/i }),
    ).toBeNull();
    expect(primaryCards).toHaveLength(3);
    expect(secondaryCards).toHaveLength(2);
    expect(
      primaryCards.map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["web", "landing", "process"]);
    expect(primaryCards[0]?.getAttribute("data-mobile-priority")).toBe(
      "default",
    );
    expect(primaryCards[1]?.getAttribute("data-mobile-priority")).toBe("top");
    expect(primaryCards[2]?.getAttribute("data-mobile-priority")).toBe(
      "default",
    );
    expect(
      secondaryCards.map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["upgrade", "maintenance"]);
    expect(
      within(getArticleByTitle("Landingpages")).getByText("Empfohlen"),
    ).toBeTruthy();
    expect(screen.getByText("klarer professioneller Auftritt")).toBeTruthy();
    expect(
      screen.getByText("Angebot nach Ziel, Umfang und Feedbackbedarf"),
    ).toBeTruthy();
    expect(screen.queryByText("KI-Templates & Agents")).toBeNull();
    const landingCard = getArticleByTitle("Landingpages");
    expect(
      within(landingCard)
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("landing");
    expect(
      within(
        screen.getByText("Webseiten-Upgrade").closest("article") as HTMLElement,
      )
        .getByRole("link", { name: "Upgrade anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("upgrade");
    expect(
      within(
        screen.getByText("Wartung & Support").closest("article") as HTMLElement,
      )
        .getByRole("link", { name: "Wartung & Support anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("maintenance");
  });

  it("updates recommendation and CTA copy when another goal is chosen while keeping the desktop card order stable", () => {
    const { container } = renderSection();

    fireEvent.click(
      screen.getByRole("button", { name: "interne Abläufe vereinfachen" }),
    );

    const primaryCards = Array.from(
      container.querySelectorAll("[data-service-variant='primary']"),
    );

    expect(
      primaryCards.map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["web", "landing", "process"]);
    expect(primaryCards[0]?.getAttribute("data-mobile-priority")).toBe(
      "default",
    );
    expect(primaryCards[1]?.getAttribute("data-mobile-priority")).toBe(
      "default",
    );
    expect(primaryCards[2]?.getAttribute("data-mobile-priority")).toBe("top");
    expect(
      within(getArticleByTitle("Prozess-Tools"))
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("process");
    expect(
      within(getArticleByTitle("Prozess-Tools")).getByText("Empfohlen"),
    ).toBeTruthy();
    expect(
      within(getArticleByTitle("Prozess-Tools"))
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-goal"),
    ).toBe("interne Abläufe vereinfachen");
    expect(
      within(
        screen.getByText("Webseiten-Upgrade").closest("article") as HTMLElement,
      ).getByRole("link", { name: "Upgrade anfragen" }),
    ).toBeTruthy();
  });

  it("keeps only one primary card expanded at a time without changing the top selection", () => {
    renderSection();

    const landingArticle = getArticleByTitle("Landingpages");
    const webArticle = getArticleByTitle("Webseiten");
    const landingDetails = document.getElementById("services-details-landing");
    const webDetails = document.getElementById("services-details-web");

    expect(landingDetails?.hasAttribute("hidden")).toBe(true);
    expect(webDetails?.hasAttribute("hidden")).toBe(true);

    fireEvent.click(landingArticle as HTMLElement);
    expect(landingDetails?.hasAttribute("hidden")).toBe(false);
    expect(webDetails?.hasAttribute("hidden")).toBe(true);
    expect(
      within(landingArticle as HTMLElement)
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("landing");
    expect(
      screen
        .getByRole("button", { name: "mehr Anfragen gewinnen" })
        .getAttribute("aria-pressed"),
    ).toBe("true");

    fireEvent.click(webArticle as HTMLElement);
    expect(landingDetails?.hasAttribute("hidden")).toBe(true);
    expect(webDetails?.hasAttribute("hidden")).toBe(false);
    expect(
      within(webArticle as HTMLElement)
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("web");
    expect(
      within(getArticleByTitle("Landingpages"))
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("landing");
    expect(
      screen
        .getByRole("button", { name: "mehr Anfragen gewinnen" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("keeps both secondary text links visible even before a secondary card is selected", () => {
    renderSection();

    expect(
      within(
        screen.getByText("Webseiten-Upgrade").closest("article") as HTMLElement,
      ).getByRole("link", { name: "Upgrade anfragen" }),
    ).toBeTruthy();
    expect(
      within(
        screen.getByText("Wartung & Support").closest("article") as HTMLElement,
      ).getByRole("link", { name: "Wartung & Support anfragen" }),
    ).toBeTruthy();
    expect(
      screen
        .getByText("Webseiten-Upgrade")
        .closest("article")
        ?.getAttribute("data-selected"),
    ).toBeNull();
  });
});
