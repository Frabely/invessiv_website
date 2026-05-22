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
    fit: "Angebotsseiten mit klarem Conversion-Ziel.",
    highlight: "schnell live & conversion-fokussiert",
    pricingHint: "Angebot nach Ziel, Umfang und Feedbackbedarf",
    delivery: "3-7 Tage",
    included: ["Rahmen", "Mobil klar", "Kontaktweg"],
  },
  {
    key: "process" as const,
    iconSrc: "/services/process-icon.svg",
    iconAlt: "Process Icon",
    title: "Prozessoptimierungs-Tools",
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
    fit: "Für Seiten mit Potenzial.",
    highlight: "spürbare UX- und Speed-Verbesserung",
    pricingHint: "Angebot nach Ist-Zustand und Eingriffstiefe",
    delivery: "2-5 Tage",
    included: ["Analyse", "UX", "Optimierung", "Review"],
    details: ["Zusatzhinweis"],
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
  { key: "more_inquiries", label: "Besucher zu Anfragen führen" },
  {
    key: "improve_existing_site",
    label: "bestehende Seite klarer ausrichten",
  },
  {
    key: "plan_new_website",
    label: "neue Website mit klarem Anfrageweg starten",
  },
];

function renderSection() {
  return render(
    <ServicesSection
      addonBadgeLabel="Add-on"
      deliveryLabel="Lieferzeit"
      detailPageCtaLabel="Ablauf & Kosten ansehen"
      detailsCtaLabel="Mehr Infos"
      fitLabel="Ideal für"
      goalOptions={goalOptions}
      goalTitle="Wähle dein Besucherziel. Die passende Leistung wird hervorgehoben."
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
      serviceDetailHrefs={{
        landing: "/de/services/landing-page",
      }}
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
        "Wähle dein Besucherziel. Die passende Leistung wird hervorgehoben.",
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
      screen.getByRole("button", { name: "Besucher zu Anfragen führen" }),
    ).toBeTruthy();
    expect(
      within(screen.getByRole("group"))
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual([
      "Besucher zu Anfragen führen",
      "bestehende Seite klarer ausrichten",
      "neue Website mit klarem Anfrageweg starten",
    ]);
    expect(
      screen.getByRole("button", {
        name: "bestehende Seite klarer ausrichten",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "neue Website mit klarem Anfrageweg starten",
      }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", {
        name: "interne Abläufe vereinfachen",
      }),
    ).toBeNull();
    expect(screen.queryByText("Umfang vor Start")).toBeNull();
    expect(screen.queryByText("Klare Lieferfenster")).toBeNull();
    expect(primaryCards).toHaveLength(3);
    expect(secondaryCards).toHaveLength(2);
    expect(
      primaryCards.map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["landing", "upgrade", "web"]);
    expect(primaryCards[0]?.getAttribute("data-mobile-priority")).toBe("top");
    expect(primaryCards[1]?.getAttribute("data-mobile-priority")).toBe(
      "default",
    );
    expect(primaryCards[2]?.getAttribute("data-mobile-priority")).toBe(
      "default",
    );
    expect(
      secondaryCards.map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["maintenance", "process"]);
    expect(
      within(getArticleByTitle("Landingpages")).getByText("Empfohlen"),
    ).toBeTruthy();
    expect(screen.getByText("klarer professioneller Auftritt")).toBeTruthy();
    expect(
      screen.getByText("Angebot nach Ziel, Umfang und Feedbackbedarf"),
    ).toBeTruthy();
    expect(screen.queryByText("KI-Templates & Agents")).toBeNull();
    const landingCard = getArticleByTitle("Landingpages");
    expect(landingCard.getAttribute("data-service-card")).toBeNull();
    expect(
      within(landingCard)
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("href"),
    ).toBe("#contact");
    expect(
      within(landingCard)
        .getByRole("link", { name: "Ablauf & Kosten ansehen" })
        .getAttribute("href"),
    ).toBe("/de/services/landing-page");
    expect(
      within(landingCard)
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("landing");
    expect(
      within(
        screen.getByText("Webseiten-Upgrade").closest("article") as HTMLElement,
      ).queryByRole("link", { name: "Projekt anfragen" }),
    ).toBeNull();
    expect(
      within(
        screen.getByText("Wartung & Support").closest("article") as HTMLElement,
      )
        .getByRole("link", { name: "Wartung & Support anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("maintenance");
  });

  it("recommends the upgrade service when improving an existing site while keeping the desktop card order stable", () => {
    const { container } = renderSection();

    fireEvent.click(
      screen.getByRole("button", {
        name: "bestehende Seite klarer ausrichten",
      }),
    );

    const primaryCards = Array.from(
      container.querySelectorAll("[data-service-variant='primary']"),
    );

    expect(
      primaryCards.map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["landing", "upgrade", "web"]);
    expect(primaryCards[0]?.getAttribute("data-mobile-priority")).toBe(
      "default",
    );
    expect(primaryCards[1]?.getAttribute("data-mobile-priority")).toBe("top");
    expect(primaryCards[2]?.getAttribute("data-mobile-priority")).toBe(
      "default",
    );
    expect(
      within(getArticleByTitle("Webseiten-Upgrade"))
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("upgrade");
    expect(
      within(getArticleByTitle("Webseiten-Upgrade"))
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-goal"),
    ).toBe("bestehende Seite klarer ausrichten");
    expect(
      within(getArticleByTitle("Prozessoptimierungs-Tools")).queryByRole(
        "link",
        {
          name: "Projekt anfragen",
        },
      ),
    ).toBeTruthy();
  });

  it("recommends the website service when planning a new website", () => {
    const { container } = renderSection();

    fireEvent.click(
      screen.getByRole("button", {
        name: "neue Website mit klarem Anfrageweg starten",
      }),
    );

    const primaryCards = Array.from(
      container.querySelectorAll("[data-service-variant='primary']"),
    );

    expect(
      primaryCards.map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["landing", "upgrade", "web"]);
    expect(primaryCards[0]?.getAttribute("data-mobile-priority")).toBe(
      "default",
    );
    expect(primaryCards[1]?.getAttribute("data-mobile-priority")).toBe(
      "default",
    );
    expect(primaryCards[2]?.getAttribute("data-mobile-priority")).toBe("top");
    expect(
      within(getArticleByTitle("Webseiten"))
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("web");
    expect(
      within(getArticleByTitle("Webseiten"))
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-goal"),
    ).toBe("neue Website mit klarem Anfrageweg starten");
  });

  it("keeps only one expandable primary card expanded at a time without changing the top selection", () => {
    renderSection();

    const upgradeArticle = getArticleByTitle("Webseiten-Upgrade");
    const webArticle = getArticleByTitle("Webseiten");
    const upgradeDetails = document.getElementById("services-details-upgrade");
    const webDetails = document.getElementById("services-details-web");

    expect(upgradeDetails?.hasAttribute("hidden")).toBe(true);
    expect(webDetails?.hasAttribute("hidden")).toBe(true);

    fireEvent.click(upgradeArticle as HTMLElement);
    expect(upgradeDetails?.hasAttribute("hidden")).toBe(false);
    expect(webDetails?.hasAttribute("hidden")).toBe(true);
    expect(
      within(upgradeArticle as HTMLElement)
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("upgrade");
    expect(
      screen
        .getByRole("button", { name: "Besucher zu Anfragen führen" })
        .getAttribute("aria-pressed"),
    ).toBe("true");

    fireEvent.click(webArticle as HTMLElement);
    expect(upgradeDetails?.hasAttribute("hidden")).toBe(true);
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
        .getByRole("button", { name: "Besucher zu Anfragen führen" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("keeps both secondary text links visible even before a secondary card is selected", () => {
    renderSection();

    expect(
      within(
        screen.getByText("Webseiten-Upgrade").closest("article") as HTMLElement,
      ).queryByRole("link", { name: "Projekt anfragen" }),
    ).toBeNull();
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
