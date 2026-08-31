// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LandingPage } from "./landing-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/de/services/landing-page",
}));

vi.mock("@/client/contact/services/contact-form-service", () => ({
  createCalendlyPrefillHref: () => "https://calendly.com/invessiv/30min",
  submitDiscoveryCall: vi
    .fn()
    .mockResolvedValue({ ok: true, requestId: "req_1" }),
  submitQuickContact: vi
    .fn()
    .mockResolvedValue({ ok: true, requestId: "req_2" }),
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

vi.mock("@/components/providers/theme-provider", () => ({
  useTheme: () => ({ theme: "dark", setTheme: vi.fn(), toggleTheme: vi.fn() }),
}));

vi.mock(
  "@/components/marketing/landing/coaching-landing-preview/coaching-landing-preview",
  () => ({
    CoachingLandingPreview: ({
      content,
    }: {
      content: { ariaLabel: string; cta: string };
    }) => (
      <aside aria-label={content.ariaLabel} data-testid="coaching-preview" />
    ),
  }),
);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/**
 * Structural smoke test. It deliberately asserts skeleton and wiring rather
 * than copy, so routine wording changes do not break it while an accidentally
 * dropped section still does.
 */
describe("LandingPage", () => {
  it("renders exactly one h1 and the expected section anchors", () => {
    render(<LandingPage locale="de" />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    for (const anchor of ["#solution", "#trust", "#contact"]) {
      expect(document.querySelector(anchor.replace("#", "#"))).toBeTruthy();
    }
  });

  it("points the header CTA at the contact section", () => {
    render(<LandingPage locale="de" />);

    const header = screen.getByTestId("site-header");
    expect(header.getAttribute("data-cta-href")).toBe("#contact");
    expect(header.querySelector('a[href="#solution"]')).toBeTruthy();
    expect(header.querySelector('a[href="#trust"]')).toBeTruthy();
    // Sections that were retired must not reappear in the navigation.
    expect(header.querySelector('a[href="#problem"]')).toBeNull();
    expect(header.querySelector('a[href="#done-for-you"]')).toBeNull();
  });

  it("renders the shared contact form with both submit paths", () => {
    const { container } = render(<LandingPage locale="de" />);

    expect(container.querySelector('input[name="displayName"]')).toBeTruthy();
    expect(container.querySelector('input[name="email"]')).toBeTruthy();
    expect(
      container.querySelector('input[name="consentAccepted"]'),
    ).toBeTruthy();
    // Spam trap must survive page-level refactors.
    expect(container.querySelector('input[name="honeypot"]')).toBeTruthy();

    expect(
      screen.getByRole("button", { name: /Ersteinschätzung anfragen/ }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Anfrage senden" })).toBeTruthy();
  });

  it("keeps the footer reachable with its contact channels", () => {
    render(<LandingPage locale="de" />);

    const footer = document.getElementById("footer");
    expect(footer).toBeTruthy();

    const scoped = within(footer as HTMLElement);
    expect(scoped.getByRole("link", { name: "E-Mail schreiben" })).toBeTruthy();
    expect(scoped.getByRole("link", { name: "Anrufen" })).toBeTruthy();
    expect(
      footer?.querySelector('a[href="/de/imprint#company-details"]'),
    ).toBeTruthy();
  });
});
