// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import type { RefObject } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ServicesSection } from "./services-section";

const serviceCards = [
  {
    key: "web" as const,
    iconSrc: "/services/coding-icon.svg",
    iconAlt: "Web Icon",
    title: "Webseite",
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
    title: "Webauftritt & Landingpages",
    fit: "Angebotsseiten mit klarem Conversion-Ziel.",
    highlight: "schnell live & conversion-fokussiert",
    pricingHint: "Angebot nach Ziel, Umfang und Feedbackbedarf",
    delivery: "3-7 Tage",
    included: ["Rahmen", "Mobil klar", "Kontaktweg"],
    details: [
      "Landingpages sind der schnellste Einstieg.",
      "Website und Relaunch bleiben möglich.",
    ],
  },
  {
    key: "process" as const,
    iconSrc: "/services/process-icon.svg",
    iconAlt: "Process Icon",
    title: "Prozessoptimierung & digitale Workflows",
    description: "Custom KI-Skills oder individuelle Softwarelösungen.",
    fit: "Teams mit klaren Routineabläufen.",
    highlight: "weniger manuelle Schritte im Alltag",
    pricingHint: "Kalkulation nach Workflow, Daten und Integrationen",
    delivery: "1-2 Wochen",
    included: ["Audit", "Konzept", "Setup", "Testing"],
    details: [
      "Kleine Vorhaben starten als KI-Skill.",
      "Größere Vorhaben werden als zentrale Software geplant.",
    ],
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

const serviceOptions = [
  {
    key: "more_inquiries",
    label: "Mehr passende Anfragen",
    serviceKey: "landing",
  },
  {
    key: "simplify_processes",
    label: "Interne Abläufe vereinfachen",
    serviceKey: "process",
  },
];

const servicePickerName =
  "Wähle die Leistung, die gerade am besten zu deinem nächsten Schritt passt.";

function renderSection(options?: {
  sectionRef?: RefObject<HTMLElement | null>;
}) {
  return render(
    <ServicesSection
      deliveryLabel="Zeitrahmen"
      detailPageCtaLabel="Ablauf & Kosten ansehen"
      detailsCtaLabel="Mehr Infos"
      id="services"
      kicker="LEISTUNGEN"
      launchAddonTitle="Ergänzend nach dem Launch"
      otherServicesTitle="Andere mögliche Leistungen"
      primaryCtaLabel="Angebot einschätzen lassen"
      primaryCtaLabels={{
        landing: "Angebot einschätzen lassen",
        maintenance: "Wartung & Support anfragen",
        process: "Angebot einschätzen lassen",
        upgrade: "Upgrade anfragen",
        web: "Projekt anfragen",
      }}
      recommendedBadgeLabel="Empfohlen für dich"
      sectionRef={options?.sectionRef ?? { current: null }}
      serviceCards={serviceCards}
      serviceContextNote="Vor Start erhältst du ein klares Angebot mit Umfang, Zeitrahmen und Kosten."
      serviceDetailHrefs={{
        landing: "/de/services/landing-page",
      }}
      serviceOptions={serviceOptions}
      servicePickerTitle="Wähle die Leistung, die gerade am besten zu deinem nächsten Schritt passt."
      serviceSecondaryTitle="Ergänzend nach dem Launch"
      title="Was brauchst du gerade?"
    />,
  );
}

describe("ServicesSection", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders service chips in the requested order and shows landing as the default active service", () => {
    const { container } = renderSection();

    expect(screen.getByText("LEISTUNGEN")).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Was brauchst du gerade?",
      }),
    ).toBeTruthy();
    expect(
      within(screen.getByRole("group", { name: servicePickerName }))
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Mehr passende Anfragen", "Interne Abläufe vereinfachen"]);

    const activeService = container.querySelector(
      "[data-service-variant='active']",
    );
    const alternatives = Array.from(
      container.querySelectorAll("[data-service-variant='alternative']"),
    );

    expect(activeService?.getAttribute("data-card-key")).toBe("landing");
    expect(
      within(activeService as HTMLElement).getByText("Empfohlen für dich"),
    ).toBeTruthy();
    expect(
      within(activeService as HTMLElement)
        .getByRole("link", { name: "Angebot einschätzen lassen" })
        .getAttribute("data-project-offer"),
    ).toBe("landing");
    expect(
      within(activeService as HTMLElement)
        .getByRole("link", { name: "Ablauf & Kosten ansehen" })
        .getAttribute("href"),
    ).toBe("/de/services/landing-page");
    expect(
      within(activeService as HTMLElement).getByText("Mehr Infos"),
    ).toBeTruthy();
    expect(
      alternatives.map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["process"]);
  });

  it("selects process as a primary service and removes it from the alternative list", () => {
    const { container } = renderSection();

    fireEvent.click(
      screen.getByRole("button", { name: "Interne Abläufe vereinfachen" }),
    );

    const activeService = container.querySelector(
      "[data-service-variant='active']",
    ) as HTMLElement;
    const alternatives = Array.from(
      container.querySelectorAll("[data-service-variant='alternative']"),
    );

    expect(activeService.getAttribute("data-card-key")).toBe("process");
    expect(
      within(activeService).getByText(
        "Prozess\u00ADoptimierung & digitale Workflows",
      ),
    ).toBeTruthy();
    expect(
      within(activeService).queryByText("Empfohlen für dich"),
    ).toBeTruthy();
    expect(
      within(activeService)
        .getByRole("link", { name: "Angebot einschätzen lassen" })
        .getAttribute("data-project-offer"),
    ).toBe("process");
    expect(
      within(activeService)
        .getByRole("link", { name: "Angebot einschätzen lassen" })
        .getAttribute("data-project-goal"),
    ).toBe("Interne Abläufe vereinfachen");
    expect(within(activeService).getByText("Mehr Infos")).toBeTruthy();
    expect(
      within(activeService).getByText("Kleine Vorhaben starten als KI-Skill."),
    ).toBeTruthy();
    expect(
      alternatives.map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["landing"]);
  });

  it("hovers an alternative service without changing selection, then clicks it to select", () => {
    const scrollIntoView = vi.fn();
    const sectionRef = { current: null } as RefObject<HTMLElement | null>;

    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });

    const { container } = renderSection({ sectionRef });
    const processRowButton = container.querySelector(
      "[data-card-key='process'] button",
    ) as HTMLButtonElement;

    fireEvent.mouseEnter(processRowButton);

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(
      container
        .querySelector("[data-service-variant='active']")
        ?.getAttribute("data-card-key"),
    ).toBe("landing");

    fireEvent.click(processRowButton);

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(
      container
        .querySelector("[data-service-variant='active']")
        ?.getAttribute("data-card-key"),
    ).toBe("process");
  });

  it("renders two primary offers and no legacy web or upgrade alternatives", () => {
    const { container } = renderSection();

    expect(
      Array.from(
        container.querySelectorAll("[data-service-variant='alternative']"),
      ).map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["process"]);
    expect(container.querySelector("[data-card-key='web']")).toBeNull();
    expect(container.querySelector("[data-card-key='upgrade']")).toBeNull();
  });

  it("keeps maintenance separate from the primary service picker", () => {
    const { container } = renderSection();

    expect(
      within(screen.getByRole("group", { name: servicePickerName }))
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).not.toContain("Wartung & Support");
    expect(
      Array.from(
        container.querySelectorAll("[data-service-variant='alternative']"),
      ).map((card) => card.getAttribute("data-card-key")),
    ).not.toContain("maintenance");
    expect(
      container
        .querySelector("[data-service-variant='secondary']")
        ?.getAttribute("data-card-key"),
    ).toBe("maintenance");
    expect(screen.getByText("Ergänzend nach dem Launch")).toBeTruthy();
  });
});
