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
import { submitQuickContact } from "@/client/contact/services/contact-form-service";
import { LandingPage } from "./landing-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/de/services/landing-page",
}));

vi.mock("@/client/contact/services/contact-form-service", () => ({
  submitQuickContact: vi
    .fn()
    .mockResolvedValue({ ok: true, requestId: "req_1" }),
}));

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
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the landing skeleton with header, problem section, hero visual, and footer", async () => {
    render(<LandingPage locale="de" />);

    const siteHeaders = screen.getAllByTestId("site-header");
    const primaryHeader = siteHeaders[0];
    expect(siteHeaders).toHaveLength(1);
    expect(primaryHeader.getAttribute("data-cta-href")).toBe("#contact");
    expect(primaryHeader.querySelector('a[href="#problem"]')).toBeNull();
    expect(primaryHeader.querySelector('a[href="#solution"]')).toBeTruthy();
    expect(primaryHeader.querySelector('a[href="#done-for-you"]')).toBeNull();
    expect(primaryHeader.querySelector('a[href="#trust"]')).toBeTruthy();
    expect(primaryHeader.querySelector('a[href="#audience"]')).toBeNull();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "Landingpage, die dein Angebot verkauft",
    );
    expect(
      screen.getAllByText(/Ein Ansprechpartner\. Keine Agentur-Schleife\./)
        .length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Vom Absprung zur Anfrage/,
      }),
    ).toBeTruthy();
    expect(screen.getByText(/Eine Landingpage bündelt/)).toBeTruthy();
    const firstProblemItem = screen.getByText("Angebot zu allgemein");
    expect(firstProblemItem).toBeTruthy();
    expect(screen.getByText("Eine Seite, ein konkretes Angebot")).toBeTruthy();
    await waitFor(() => {
      expect(firstProblemItem.closest("li")?.dataset.visible).toBe("true");
    });
    expect(screen.queryByText("4,9 von 5 Sternen")).toBeNull();
    expect(screen.queryByText("Anfrage auslösen")).toBeNull();
    expect(screen.queryByText(/keine überladene Website/)).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Was ist enthalten?" }),
    ).toBeNull();
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
    expect(screen.getByText("Antwortet innerhalb von 24 Std.")).toBeTruthy();
    const trustThread = screen.getByRole("list", {
      name: "Was du von der Zusammenarbeit erwarten kannst",
    });
    expect(within(trustThread).getAllByRole("listitem")).toHaveLength(5);
    expect(
      within(trustThread).getByText("Keine Agentur-Schleife"),
    ).toBeTruthy();
    expect(within(trustThread).queryByText(/Referenzprojekt/)).toBeNull();
    const trustReplyCta = screen
      .getAllByRole("link", { name: /Kostenlose Ersteinschätzung anfragen/ })
      .find((link) => link.dataset.analyticsLocation === "trust");
    expect(trustReplyCta).toBeTruthy();
    expect(trustReplyCta!.getAttribute("href")).toBe("#contact");
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: /Darum musst du dich nicht kümmern/,
      }),
    ).toBeNull();
    expect(
      screen.queryByText("Seitenstruktur aus deinem Angebot ableiten"),
    ).toBeNull();
    expect(screen.queryByText(/Der Check bleibt bewusst schlank/)).toBeNull();
    expect(
      screen.getByText(
        "Nicht sicher, ob eine Landingpage für dein Angebot passt?",
      ),
    ).toBeTruthy();
    const audienceCta = screen
      .getAllByRole("link", { name: "Kostenlose Ersteinschätzung anfragen" })
      .find((link) => link.dataset.analyticsLocation === "audience");
    expect(audienceCta).toBeTruthy();
    expect(audienceCta!.getAttribute("href")).toBe("#contact");
    expect(audienceCta!.dataset.analyticsEvent).toBe("cta_click");
    expect(audienceCta!.dataset.analyticsTarget).toBe("contact");
    expect(audienceCta!.dataset.analyticsVariant).toBe("primary");
    expect(screen.getAllByTestId("hero-visual").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.querySelectorAll("#hero")).toHaveLength(1);
    expect(document.querySelector("[data-zoom-state]")).toBeTruthy();
    const heroReplica = document.querySelector("[data-hero-zoom-replica]");
    expect(heroReplica).toBeTruthy();
    expect(heroReplica?.getAttribute("aria-hidden")).toBe("true");
    expect(
      heroReplica?.querySelector("[data-hero-zoom-replica-header-bar]"),
    ).toBeTruthy();
    expect(
      heroReplica?.querySelector("[data-testid='site-header']"),
    ).toBeNull();
    expect(heroReplica?.querySelector("h1")).toBeNull();
    expect(document.querySelector("[data-hero-zoom-placeholder]")).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Worum geht's bei deiner Landingpage/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: /Ersteinschätzung anfragen/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(/Was möchtest du mit der Landingpage erreichen/),
    ).toBeTruthy();
    const pageFooter = document.getElementById("footer");
    expect(pageFooter).toBeTruthy();
    expect(pageFooter?.querySelector('a[href="#contact"]')?.textContent).toBe(
      "Kostenlose Ersteinschätzung anfragen",
    );
    expect(pageFooter?.querySelector('a[href="#problem"]')).toBeNull();
    expect(pageFooter?.querySelector('a[href="#solution"]')).toBeTruthy();
    expect(pageFooter?.querySelector('a[href="#done-for-you"]')).toBeNull();
    expect(pageFooter?.querySelector('a[href="#trust"]')).toBeTruthy();
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

  it("submits landing leads with the landing page origin", async () => {
    render(<LandingPage locale="de" />);

    fireEvent.change(screen.getByRole("textbox", { name: /Name/ }), {
      target: { value: "Max Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /E-Mail/ }), {
      target: { value: "max@example.com" },
    });
    fireEvent.change(
      screen.getByRole("textbox", {
        name: /Was .* mit der Landingpage erreichen/,
      }),
      {
        target: {
          value: "Ich brauche eine Landingpage fuer mein Angebot.",
        },
      },
    );
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", {
        name: /anfragen/,
      }),
    );

    await waitFor(() => {
      expect(submitQuickContact).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: "landing_page",
        }),
      );
    });
  });
});
