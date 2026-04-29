// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LandingPage } from "./landing-page";

vi.mock("@/components/marketing/site-header/site-header", () => ({
  SiteHeader: ({
    ctaHref,
    navigation,
  }: {
    ctaHref: string;
    navigation: Array<{ href: string }>;
  }) => (
    <header data-cta-href={ctaHref} data-testid="site-header">
      {navigation.map((item) => (
        <a href={item.href} key={item.href}>
          {item.href}
        </a>
      ))}
    </header>
  ),
}));

vi.mock("@/components/marketing/hero-visual/hero-visual", () => ({
  HeroVisual: ({ ariaLabel }: { ariaLabel: string }) => (
    <aside aria-label={ariaLabel} data-testid="hero-visual" />
  ),
}));

describe("LandingPage", () => {
  it("renders the landing skeleton with header, problem section, hero visual, and footer", async () => {
    render(<LandingPage locale="de" />);

    expect(
      screen.getByTestId("site-header").getAttribute("data-cta-href"),
    ).toBe("#contact");
    expect(
      screen.getByTestId("site-header").querySelector('a[href="#problem"]'),
    ).toBeNull();
    expect(
      screen.getByTestId("site-header").querySelector('a[href="#solution"]'),
    ).toBeTruthy();
    expect(
      screen.getByTestId("site-header").querySelector('a[href="#inclusions"]'),
    ).toBeTruthy();
    expect(
      screen.getByTestId("site-header").querySelector('a[href="#audience"]'),
    ).toBeNull();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "Mehr Anfragen",
    );
    expect(
      screen.getByText(/Keine große Website\. Kein unnötiger Umfang\./),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Viele Websites sehen okay aus/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: /Typische Fehler/,
      }),
    ).toBeTruthy();
    const firstProblemItem = screen.getByText(
      "Das Angebot bleibt zu allgemein.",
    );
    expect(firstProblemItem).toBeTruthy();
    expect(
      screen.getByText("Eine gute Landingpage räumt diese Hürden aus dem Weg."),
    ).toBeTruthy();
    await waitFor(() => {
      expect(firstProblemItem.closest("li")?.dataset.visible).toBe("true");
    });
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Eine Landingpage führt Besucher gezielt zur Anfrage/,
      }),
    ).toBeTruthy();
    expect(screen.getByText(/Eine Landingpage bündelt/)).toBeTruthy();
    expect(screen.queryByText("Anfrage auslösen")).toBeNull();
    expect(screen.queryByText(/keine überladene Website/)).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Was ist enthalten?" }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Was du bekommst/,
      }),
    ).toBeTruthy();
    expect(screen.getByText("Klare Seitenstruktur")).toBeTruthy();
    expect(screen.getAllByText("Launch-Unterstützung").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText(/Du brauchst keine fertigen Texte/)).toBeTruthy();
    expect(
      screen.getByText(
        "Nicht sicher, ob eine Landingpage für dein Angebot passt?",
      ),
    ).toBeTruthy();
    const audienceSoftCta = screen.getByRole("link", {
      name: "Angebot kurz prüfen lassen",
    });
    expect(audienceSoftCta.getAttribute("href")).toBe("#contact");
    expect(audienceSoftCta.dataset.analyticsEvent).toBe("cta_click");
    expect(audienceSoftCta.dataset.analyticsTarget).toBe("contact");
    expect(audienceSoftCta.dataset.analyticsVariant).toBe("soft");
    const faqSoftCta = screen.getByRole("link", {
      name: "Noch unsicher? Schreib kurz, was du vorhast.",
    });
    expect(faqSoftCta.getAttribute("href")).toBe("#contact");
    expect(faqSoftCta.dataset.analyticsEvent).toBe("cta_click");
    expect(faqSoftCta.dataset.analyticsTarget).toBe("contact");
    expect(faqSoftCta.dataset.analyticsVariant).toBe("soft");
    expect(screen.getByTestId("hero-visual")).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Lass uns deine Landingpage angehen/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: /Check anfragen/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(/Was möchtest du mit der Landingpage erreichen/),
    ).toBeTruthy();
    const pageFooter = document.getElementById("footer");
    expect(pageFooter).toBeTruthy();
    expect(pageFooter?.querySelector('a[href="#contact"]')?.textContent).toBe(
      "Check anfragen",
    );
    expect(pageFooter?.querySelector('a[href="#problem"]')).toBeNull();
    expect(pageFooter?.querySelector('a[href="#solution"]')).toBeTruthy();
    expect(pageFooter?.querySelector('a[href="#inclusions"]')).toBeTruthy();
    expect(pageFooter?.querySelector('a[href="/de"]')?.textContent).toBe(
      "Mehr über Invessiv",
    );
    expect(
      pageFooter?.querySelector('a[href="/de/imprint#company-details"]')
        ?.textContent,
    ).toBe("Invessiv");
    expect(
      pageFooter?.querySelector('a[href="mailto:service@invessiv.com"]')
        ?.textContent,
    ).toBe("service@invessiv.com");
    expect(
      pageFooter?.querySelector('a[href="tel:+4915232070477"]')?.textContent,
    ).toBe("+49 1523 2070477");
  });
});
