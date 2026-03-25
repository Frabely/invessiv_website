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
    price: "ab 2490 EUR einmalig",
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
    price: "ab 990 EUR einmalig",
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
    price: "ab 1490 EUR einmalig",
    delivery: "1-2 Wochen",
    included: ["Audit", "Konzept", "Setup", "Testing"],
  },
  {
    key: "upgrade" as const,
    iconSrc: "/services/upgrade-icon.svg",
    iconAlt: "Upgrade Icon",
    title: "Website-Upgrade",
    description: "Bestehendes verbessern.",
    fit: "Für Seiten mit Potenzial.",
    price: "ab 690 EUR einmalig",
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
    price: "50 EUR / h",
    delivery: "24-72h",
    included: ["Bugfixes", "Anpassungen", "Checks"],
  },
];

const goalOptions = [
  { key: "more_inquiries", label: "mehr Anfragen gewinnen" },
  { key: "professional_presence", label: "professionell online auftreten" },
  { key: "simplify_workflows", label: "interne Abläufe vereinfachen" },
  { key: "improve_existing", label: "etwas Bestehendes verbessern" },
];

function renderSection() {
  return render(
    <ServicesSection
      addonBadgeLabel="Add-on"
      deliveryLabel="Lieferzeit"
      detailsCtaLabel="Mehr Infos"
      description="Leistungen als Richtwerte."
      fitLabel="Ideal für"
      goalOptions={goalOptions}
      goalTitle="Wähle dein Ziel – wir markieren das passendste Angebot."
      id="services"
      moreItemsPluralLabel="weitere Punkte"
      moreItemsSingularLabel="weiterer Punkt"
      oneTimeLabel="einmalig"
      primaryCtaLabel="Projekt anfragen"
      primaryCtaLabels={{
        landing: "Landingpage anfragen",
        maintenance: "Wartung anfragen",
        process: "Prozess-Tool anfragen",
        upgrade: "Upgrade anfragen",
        web: "Webseite anfragen",
      }}
      recommendedBadgeLabel="Empfohlen"
      sectionRef={{ current: null }}
      serviceCards={serviceCards}
      serviceSecondaryTitle="Schon etwas da?"
      summaryPoints={["Umfang vor Start", "Klare Lieferfenster"]}
      title="Was brauchst du gerade?"
    />,
  );
}

describe("ServicesSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders chips, three primary cards, two secondary cards, and defaults to landing without reordering the grid", () => {
    const { container } = renderSection();

    const primaryCards = Array.from(
      container.querySelectorAll("[data-service-variant='primary']"),
    );
    const secondaryCards = Array.from(
      container.querySelectorAll("[data-service-variant='secondary']"),
    );

    expect(
      screen.getByText(
        "Wähle dein Ziel – wir markieren das passendste Angebot.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "mehr Anfragen gewinnen" }),
    ).toBeTruthy();
    expect(primaryCards).toHaveLength(3);
    expect(secondaryCards).toHaveLength(2);
    expect(
      primaryCards.map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["web", "landing", "process"]);
    expect(
      secondaryCards.map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["upgrade", "maintenance"]);
    expect(screen.getByText("Empfohlen")).toBeTruthy();
    expect(screen.queryByText("KI-Templates & Agents")).toBeNull();
    const landingCard = screen.getByText("Landingpages").closest("article");
    expect(
      within(landingCard as HTMLElement)
        .getByRole("link", { name: "Landingpage anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("landing");
    expect(screen.queryByRole("link", { name: "Upgrade anfragen" })).toBeNull();
  });

  it("updates recommendation and CTA copy when another goal is chosen while keeping the card order stable", () => {
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
    expect(
      within(
        screen.getByText("Prozess-Tools").closest("article") as HTMLElement,
      )
        .getByRole("link", { name: "Prozess-Tool anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("process");
    expect(
      within(
        screen.getByText("Prozess-Tools").closest("article") as HTMLElement,
      ).getByText("Empfohlen"),
    ).toBeTruthy();
    expect(
      within(
        screen.getByText("Prozess-Tools").closest("article") as HTMLElement,
      )
        .getByRole("link", { name: "Prozess-Tool anfragen" })
        .getAttribute("data-project-goal"),
    ).toBe("interne Abläufe vereinfachen");
    expect(
      screen.queryByRole("link", { name: "Landingpage anfragen" }),
    ).toBeNull();
  });

  it("keeps only one primary card expanded at a time without changing the top selection", () => {
    renderSection();

    const landingArticle = screen.getByText("Landingpages").closest("article");
    const webArticle = screen.getByText("Webseiten").closest("article");
    const landingDetails = document.getElementById("services-details-landing");
    const webDetails = document.getElementById("services-details-web");

    expect(landingDetails?.hasAttribute("hidden")).toBe(true);
    expect(webDetails?.hasAttribute("hidden")).toBe(true);

    fireEvent.click(landingArticle as HTMLElement);
    expect(landingDetails?.hasAttribute("hidden")).toBe(false);
    expect(webDetails?.hasAttribute("hidden")).toBe(true);
    expect(
      within(landingArticle as HTMLElement)
        .getByRole("link", { name: "Landingpage anfragen" })
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
      within(screen.getByText("Landingpages").closest("article") as HTMLElement)
        .getByRole("link", { name: "Landingpage anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("landing");
    expect(
      screen
        .getByRole("button", { name: "mehr Anfragen gewinnen" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("keeps the top goal selection stable when a secondary card is chosen", () => {
    renderSection();

    fireEvent.click(
      screen.getByText("Website-Upgrade").closest("article") as HTMLElement,
    );

    const upgradeCard = screen.getByText("Website-Upgrade").closest("article");
    expect(
      within(upgradeCard as HTMLElement)
        .getByRole("link", { name: "Upgrade anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("upgrade");
    expect(
      within(upgradeCard as HTMLElement)
        .getByRole("link", { name: "Upgrade anfragen" })
        .getAttribute("data-project-goal"),
    ).toBe("mehr Anfragen gewinnen");
    expect(
      screen.queryByRole("link", { name: "Landingpage anfragen" }),
    ).toBeNull();
    expect(
      screen
        .getByRole("button", { name: "mehr Anfragen gewinnen" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("keeps the secondary block neutral while marking website upgrade for the improvement goal", () => {
    renderSection();

    fireEvent.click(
      screen.getByRole("button", { name: "etwas Bestehendes verbessern" }),
    );

    const upgradeCard = screen.getByText("Website-Upgrade").closest("article");
    expect(
      within(upgradeCard as HTMLElement)
        .getByRole("link", { name: "Upgrade anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("upgrade");
    expect(
      screen.queryByRole("link", { name: "Landingpage anfragen" }),
    ).toBeNull();
    expect(
      screen
        .getByText("Website-Upgrade")
        .closest("article")
        ?.getAttribute("data-selected"),
    ).toBe("true");
  });
});
