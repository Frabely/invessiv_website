// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactSubmissionOrigin } from "@invessiv/common/constants/contact/contact-submission-origin";
import { ContactForm } from "./contact-form";

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => ({ locale: "de" }),
}));

const { submitDiscoveryCall, submitQuickContact, trackCalendarClick } =
  vi.hoisted(() => ({
    submitDiscoveryCall: vi
      .fn()
      .mockResolvedValue({ ok: true, requestId: "request-1" }),
    submitQuickContact: vi
      .fn()
      .mockResolvedValue({ ok: true, requestId: "request-2" }),
    trackCalendarClick: vi.fn(),
  }));
vi.mock("@/client/contact/services/contact-form-service", () => ({
  createCalendlyPrefillHref: () => "https://calendly.com/invessiv/30min",
  submitDiscoveryCall,
  submitQuickContact,
}));
vi.mock("@/lib/analytics/events/discovery-call-events", () => ({
  trackDiscoveryCallCalendarClick: trackCalendarClick,
}));

afterEach(() => {
  cleanup();
  submitDiscoveryCall.mockClear();
  submitQuickContact.mockClear();
  trackCalendarClick.mockClear();
});

const copy = {
  callSubmitLabel: "Weiter zur Terminauswahl",
  callSubmitSuccess: "Termin wird geöffnet",
  callSubmittingLabel: "Öffnet",
  consentLabel: "Ich stimme zu",
  emailLabel: "E-Mail",
  fieldErrorConsentRequired: "Zustimmung erforderlich",
  fieldErrorInvalidEmail: "Ungültige E-Mail",
  fieldErrorRequired: "Pflichtfeld",
  messageLabel: "Nachricht",
  messagePlaceholder: "",
  nameLabel: "Name",
  privacyLabel: "Datenschutz",
  privacySuffix: " zu.",
  projectScopeLabel: "Leistungsmodell (optional)",
  projectScopeOptions: {
    landing_page: "Landingpage",
    compact_website: "Kompakte Website",
    business_website: "Business Website",
  },
  requiredHint: "* Pflichtfelder",
  honeypotLabel: "Bitte nicht ausfüllen",
  submitErrorGeneric: "Fehler",
  submitErrorRateLimited: "Zu viele Anfragen",
  emailQuestion: "Doch lieber schreiben?",
  emailNote: "Formular per Mail, Antwort in 24 Stunden.",
  emailSubmitLabel: "Anfrage senden",
  emailSubmittingLabel: "Wird gesendet",
  emailSubmitSuccess: "Anfrage ist da.",
  emailSubmitErrorDelivery: "Zustellung fehlgeschlagen",
};

describe("ContactForm", () => {
  it.each(["contact", "landing_final_cta", "linkedin_post_final_cta"])(
    "uses %s for the calendar click location",
    async (analyticsLocation) => {
      render(
        <ContactForm
          analyticsLocation={analyticsLocation}
          calendlyHref="https://calendly.com/invessiv/30min"
          formCopy={copy}
          privacyHref="/privacy"
        />,
      );

      fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
        target: { value: "Mara Kern" },
      });
      fireEvent.change(screen.getByRole("textbox", { name: "E-Mail" }), {
        target: { value: "mara@example.com" },
      });
      fireEvent.click(screen.getByRole("checkbox"));
      fireEvent.click(
        screen.getByRole("button", { name: "Weiter zur Terminauswahl" }),
      );

      await waitFor(() =>
        expect(trackCalendarClick).toHaveBeenCalledWith(analyticsLocation),
      );
    },
  );

  it("submits the fixed landing-page scope without rendering project chips", async () => {
    render(
      <ContactForm
        calendlyHref="https://calendly.com/invessiv/30min"
        formCopy={copy}
        origin={ContactSubmissionOrigin.LandingPage}
        privacyHref="/privacy"
        projectScope="landing_page"
        projectScopeLabel="Landingpage"
        showProjectScope={false}
      />,
    );
    expect(screen.queryByRole("group", { name: /Leistungsmodell/ })).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Mara Kern" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail" }), {
      target: { value: "mara@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "Weiter zur Terminauswahl" }),
    );
    await waitFor(() =>
      expect(submitDiscoveryCall).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: "landing_page",
          projectScope: "landing_page",
        }),
        { submitPath: undefined },
      ),
    );
  });

  it("offers the email fallback as a secondary action next to the call", async () => {
    render(
      <ContactForm
        calendlyHref="https://calendly.com/invessiv/30min"
        formCopy={copy}
        privacyHref="/privacy"
      />,
    );

    expect(screen.getByText("Doch lieber schreiben?")).toBeTruthy();
    expect(
      screen.getByText("Formular per Mail, Antwort in 24 Stunden."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Anfrage senden" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Weiter zur Terminauswahl" }),
    ).toBeTruthy();
  });

  it("sends the form as a quick contact and never opens Calendly", async () => {
    render(
      <ContactForm
        calendlyHref="https://calendly.com/invessiv/30min"
        formCopy={copy}
        privacyHref="/privacy"
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Mara Kern" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail" }), {
      target: { value: "mara@example.com" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "Kompakte Website" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Nachricht" }), {
      target: { value: "Kurz zum Umfang." },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Anfrage senden" }));

    await waitFor(() =>
      expect(submitQuickContact).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: "Mara Kern",
          email: "mara@example.com",
          kind: "quick_contact",
          // The scope has no column on this channel, so it rides in the message.
          message:
            "Leistungsmodell (optional): Kompakte Website\n\nKurz zum Umfang.",
        }),
        { submitPath: undefined },
      ),
    );
    expect(submitDiscoveryCall).not.toHaveBeenCalled();
  });

  it("keeps the originating page on email submissions", async () => {
    render(
      <ContactForm
        calendlyHref="https://calendly.com/invessiv/30min"
        formCopy={copy}
        origin={ContactSubmissionOrigin.LandingPage}
        privacyHref="/privacy"
        projectScope="landing_page"
        projectScopeLabel="Landingpage"
        showProjectScope={false}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Mara Kern" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail" }), {
      target: { value: "mara@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Anfrage senden" }));

    await waitFor(() =>
      expect(submitQuickContact).toHaveBeenCalledWith(
        expect.objectContaining({ origin: "landing_page" }),
        { submitPath: undefined },
      ),
    );
  });

  it("keeps consent error ids unique across two forms on one page", () => {
    const { container } = render(
      <>
        <ContactForm
          calendlyHref="https://calendly.com/invessiv/30min"
          formCopy={copy}
          privacyHref="/privacy"
        />
        <ContactForm
          calendlyHref="https://calendly.com/invessiv/30min"
          formCopy={copy}
          privacyHref="/privacy"
        />
      </>,
    );

    const errorIds = [
      ...container.querySelectorAll("input[type='checkbox']"),
    ].map((input) => input.getAttribute("aria-describedby"));

    expect(errorIds).toHaveLength(2);
    expect(errorIds[0]).not.toBe(errorIds[1]);
    expect(new Set(errorIds).size).toBe(2);
  });

  it("hides the bot trap from humans and assistive tech", () => {
    const { container } = render(
      <ContactForm
        calendlyHref="https://calendly.com/invessiv/30min"
        formCopy={copy}
        privacyHref="/privacy"
      />,
    );

    const honeypot = container.querySelector<HTMLInputElement>(
      'input[name="honeypot"]',
    );
    expect(honeypot).not.toBeNull();
    expect(honeypot?.tabIndex).toBe(-1);
    expect(honeypot?.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("drops bot submissions on the email path without calling the API", async () => {
    const { container } = render(
      <ContactForm
        calendlyHref="https://calendly.com/invessiv/30min"
        formCopy={copy}
        privacyHref="/privacy"
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Bot" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail" }), {
      target: { value: "bot@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(container.querySelector('input[name="honeypot"]')!, {
      target: { value: "bot-value" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Anfrage senden" }));

    // Silent success: the bot must not learn that it was filtered.
    await waitFor(() =>
      expect(screen.getByText("Anfrage ist da.")).toBeTruthy(),
    );
    expect(submitQuickContact).not.toHaveBeenCalled();
  });

  it("drops bot submissions on the call path without opening Calendly", async () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const { container } = render(
      <ContactForm
        calendlyHref="https://calendly.com/invessiv/30min"
        formCopy={copy}
        privacyHref="/privacy"
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Bot" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail" }), {
      target: { value: "bot@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(container.querySelector('input[name="honeypot"]')!, {
      target: { value: "bot-value" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Weiter zur Terminauswahl" }),
    );

    await waitFor(() =>
      expect(screen.getByText("Termin wird geöffnet")).toBeTruthy(),
    );
    expect(submitDiscoveryCall).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("submits no project scope when the optional selection stays empty", async () => {
    render(
      <ContactForm
        calendlyHref="https://calendly.com/invessiv/30min"
        formCopy={copy}
        privacyHref="/privacy"
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Mara Kern" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail" }), {
      target: { value: "mara@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "Weiter zur Terminauswahl" }),
    );

    await waitFor(() =>
      expect(submitDiscoveryCall).toHaveBeenLastCalledWith(
        expect.objectContaining({ projectScope: undefined }),
        { submitPath: undefined },
      ),
    );
  });
});
