// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiscoveryCallPanel } from "./discovery-call-panel";

const createCalendlyPrefillHrefMock = vi.fn();
const submitDiscoveryCallMock = vi.fn();
const mockTrackConversionEvent = vi.fn();

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => ({
    locale: "de",
  }),
}));

vi.mock("@/client/contact/services/contact-form-service", () => ({
  createCalendlyPrefillHref: (...args: unknown[]) =>
    createCalendlyPrefillHrefMock(...args),
  submitDiscoveryCall: (...args: unknown[]) => submitDiscoveryCallMock(...args),
}));

vi.mock("@/lib/analytics/conversion-events", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/analytics/conversion-events")>();

  return {
    ...actual,
    trackConversionEvent: (...args: unknown[]) =>
      mockTrackConversionEvent(...args),
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  createCalendlyPrefillHrefMock.mockReset();
  submitDiscoveryCallMock.mockReset();
  mockTrackConversionEvent.mockReset();
});

describe("DiscoveryCallPanel", () => {
  it("opens Calendly from the original submit gesture with prefilled values", async () => {
    submitDiscoveryCallMock.mockResolvedValue({
      ok: true,
      requestId: "req_123",
    });
    createCalendlyPrefillHrefMock.mockReturnValue(
      "https://calendly.com/service-invessiv-cxf5/30min?name=Max+Mustermann&email=max%40example.com",
    );
    const replaceMock = vi.fn();
    const openMock = vi.spyOn(window, "open").mockReturnValue({
      location: { replace: replaceMock },
      opener: null,
    } as unknown as Window);

    render(
      <DiscoveryCallPanel
        channel={{
          actionLabel: "Termin wählen",
          description: "Für kurze Abstimmung.",
          detailPoints: ["15-20 Minuten", "Klare Empfehlung danach"],
          href: "https://calendly.com/service-invessiv-cxf5/30min",
          hint: "Direkt der passende nächste Schritt.",
          label: "Kennenlern-Call",
          mode: "call",
          value: "15-20 Minuten",
        }}
        formCopy={{
          title: "Kennenlern-Call",
          subtitle: "Für direkte Abstimmung mit etwas Kontext vor dem Termin.",
          intro: "Name und E-Mail werden in Calendly vorbefüllt.",
          nameLabel: "Name",
          emailLabel: "E-Mail",
          messageLabel: "Anliegen",
          messagePlaceholder: "Optionales Anliegen",
          consentLabel: "Ich stimme der Verarbeitung meiner Angaben gemäß",
          privacyLabel: "Datenschutzerklärung zu.",
          submitLabel: "Termin wählen",
          submittingLabel: "Wird geöffnet",
          submitSuccess: "Calendly wird geöffnet",
          submitErrorRateLimited: "Zu viele Anfragen",
          submitErrorGeneric: "Allgemeiner Fehler",
          fieldErrorInvalidEmail: "Ungültige E-Mail",
          fieldErrorRequired: "Pflichtfeld",
          fieldErrorConsentRequired: "Zustimmung erforderlich",
          requiredHint: "* Pflichtfelder",
        }}
        privacyHref="/privacy"
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: /Name\s*\*/ }), {
      target: { value: "Max Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /E-Mail\s*\*/ }), {
      target: { value: "max@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Termin wählen" }));

    await waitFor(() => {
      expect(openMock).toHaveBeenCalledWith("", "_blank");
      expect(submitDiscoveryCallMock).toHaveBeenCalledWith(
        {
          consentAccepted: true,
          email: "max@example.com",
          displayName: "Max Mustermann",
          kind: "discovery_call",
          locale: "de",
          message: undefined,
        },
        { submitPath: undefined },
      );
      expect(createCalendlyPrefillHrefMock).toHaveBeenCalledWith(
        {
          consentAccepted: true,
          email: "max@example.com",
          displayName: "Max Mustermann",
          message: "",
        },
        {
          calendlyUrl: "https://calendly.com/service-invessiv-cxf5/30min",
          concernAnswerSlot: 1,
        },
      );
      expect(replaceMock).toHaveBeenCalledWith(
        "https://calendly.com/service-invessiv-cxf5/30min?name=Max+Mustermann&email=max%40example.com",
      );
      expect(mockTrackConversionEvent).toHaveBeenCalledWith("form_start", {
        form_id: "discovery_call",
        location: "contact",
        target: "calendly",
        variant: "primary",
      });
      expect(mockTrackConversionEvent).toHaveBeenCalledWith(
        "form_submit_attempt",
        {
          form_id: "discovery_call",
          location: "contact",
          target: "calendly",
          variant: "primary",
        },
      );
      expect(mockTrackConversionEvent).toHaveBeenCalledWith(
        "lead_submit_success",
        {
          form_id: "discovery_call",
          location: "contact",
          target: "calendly",
          variant: "primary",
        },
      );
      expect(mockTrackConversionEvent).toHaveBeenCalledWith("calendar_click", {
        form_id: "discovery_call",
        location: "contact",
        target: "calendly",
        variant: "primary",
      });
    });

    expect(screen.getByText("Calendly wird geöffnet")).toBeTruthy();
  });

  it("closes the pre-opened window again when validation fails", async () => {
    submitDiscoveryCallMock.mockResolvedValue({
      ok: true,
      requestId: "req_123",
    });
    const closeMock = vi.fn();
    vi.spyOn(window, "open").mockReturnValue({
      close: closeMock,
      location: { replace: vi.fn() },
      opener: null,
    } as unknown as Window);

    render(
      <DiscoveryCallPanel
        channel={{
          actionLabel: "Termin wählen",
          description: "Für kurze Abstimmung.",
          href: "https://calendly.com/service-invessiv-cxf5/30min",
          label: "Kennenlern-Call",
          mode: "call",
          value: "15-20 Minuten",
        }}
        formCopy={{
          title: "Kennenlern-Call",
          subtitle: "Für direkte Abstimmung mit etwas Kontext vor dem Termin.",
          intro: "Name und E-Mail werden in Calendly vorbefüllt.",
          nameLabel: "Name",
          emailLabel: "E-Mail",
          messageLabel: "Anliegen",
          messagePlaceholder: "Optionales Anliegen",
          consentLabel: "Ich stimme der Verarbeitung meiner Angaben gemäß",
          privacyLabel: "Datenschutzerklärung zu.",
          submitLabel: "Termin wählen",
          submittingLabel: "Wird geöffnet",
          submitSuccess: "Calendly wird geöffnet",
          submitErrorRateLimited: "Zu viele Anfragen",
          submitErrorGeneric: "Allgemeiner Fehler",
          fieldErrorInvalidEmail: "Ungültige E-Mail",
          fieldErrorRequired: "Pflichtfeld",
          fieldErrorConsentRequired: "Zustimmung erforderlich",
          requiredHint: "* Pflichtfelder",
        }}
        privacyHref="/privacy"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Termin wählen" }));

    await waitFor(() => {
      expect(closeMock).toHaveBeenCalled();
    });
  });

  it("closes the pre-opened window again when the API submit fails", async () => {
    submitDiscoveryCallMock.mockResolvedValue({
      code: "rate_limited",
      ok: false,
      requestId: "req_123",
    });
    const closeMock = vi.fn();
    vi.spyOn(window, "open").mockReturnValue({
      close: closeMock,
      location: { replace: vi.fn() },
      opener: null,
    } as unknown as Window);

    render(
      <DiscoveryCallPanel
        channel={{
          actionLabel: "Termin wählen",
          href: "https://calendly.com/service-invessiv-cxf5/30min",
          label: "Kennenlern-Call",
          mode: "call",
          value: "15-20 Minuten",
        }}
        formCopy={{
          title: "Kennenlern-Call",
          subtitle: "Für direkte Abstimmung mit etwas Kontext vor dem Termin.",
          intro: "Name und E-Mail werden in Calendly vorbefüllt.",
          nameLabel: "Name",
          emailLabel: "E-Mail",
          messageLabel: "Anliegen",
          messagePlaceholder: "Optionales Anliegen",
          consentLabel: "Ich stimme der Verarbeitung meiner Angaben gemäß",
          privacyLabel: "Datenschutzerklärung zu.",
          submitLabel: "Termin wählen",
          submittingLabel: "Wird geöffnet",
          submitSuccess: "Calendly wird geöffnet",
          submitErrorRateLimited: "Zu viele Anfragen",
          submitErrorGeneric: "Allgemeiner Fehler",
          fieldErrorInvalidEmail: "Ungültige E-Mail",
          fieldErrorRequired: "Pflichtfeld",
          fieldErrorConsentRequired: "Zustimmung erforderlich",
          requiredHint: "* Pflichtfelder",
        }}
        privacyHref="/privacy"
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: /Name\s*\*/ }), {
      target: { value: "Max Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /E-Mail\s*\*/ }), {
      target: { value: "max@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Termin wählen" }));

    await waitFor(() => {
      expect(closeMock).toHaveBeenCalled();
      expect(screen.getByText("Zu viele Anfragen")).toBeTruthy();
    });
  });

  it("shows the consent validation error when the checkbox is not checked", async () => {
    vi.spyOn(window, "open").mockReturnValue({
      close: vi.fn(),
      location: { replace: vi.fn() },
      opener: null,
    } as unknown as Window);

    render(
      <DiscoveryCallPanel
        channel={{
          actionLabel: "Termin wÃ¤hlen",
          href: "https://calendly.com/service-invessiv-cxf5/30min",
          label: "Kennenlern-Call",
          mode: "call",
          value: "15-20 Minuten",
        }}
        formCopy={{
          title: "Kennenlern-Call",
          subtitle: "FÃ¼r direkte Abstimmung mit etwas Kontext vor dem Termin.",
          intro: "Name und E-Mail werden in Calendly vorbefÃ¼llt.",
          nameLabel: "Name",
          emailLabel: "E-Mail",
          messageLabel: "Anliegen",
          messagePlaceholder: "Optionales Anliegen",
          consentLabel: "Ich stimme der Verarbeitung meiner Angaben gemÃ¤ÃŸ",
          privacyLabel: "DatenschutzerklÃ¤rung zu.",
          submitLabel: "Termin wÃ¤hlen",
          submittingLabel: "Wird geÃ¶ffnet",
          submitSuccess: "Calendly wird geÃ¶ffnet",
          submitErrorRateLimited: "Zu viele Anfragen",
          submitErrorGeneric: "Allgemeiner Fehler",
          fieldErrorInvalidEmail: "UngÃ¼ltige E-Mail",
          fieldErrorRequired: "Pflichtfeld",
          fieldErrorConsentRequired: "Zustimmung erforderlich",
          requiredHint: "* Pflichtfelder",
        }}
        privacyHref="/privacy"
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: /Name\s*\*/ }), {
      target: { value: "Max Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /E-Mail\s*\*/ }), {
      target: { value: "max@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Termin wÃ¤hlen" }));

    await waitFor(() => {
      expect(screen.getByText("Zustimmung erforderlich")).toBeTruthy();
    });
  });

  it("shows the email validation error on blur", async () => {
    render(
      <DiscoveryCallPanel
        channel={{
          actionLabel: "Termin wählen",
          href: "https://calendly.com/service-invessiv-cxf5/30min",
          label: "Kennenlern-Call",
          mode: "call",
          value: "15-20 Minuten",
        }}
        formCopy={{
          title: "Kennenlern-Call",
          subtitle: "Für direkte Abstimmung mit etwas Kontext vor dem Termin.",
          intro: "Name und E-Mail werden in Calendly vorbefüllt.",
          nameLabel: "Name",
          emailLabel: "E-Mail",
          messageLabel: "Anliegen",
          messagePlaceholder: "Optionales Anliegen",
          consentLabel: "Ich stimme der Verarbeitung meiner Angaben gemäß",
          privacyLabel: "Datenschutzerklärung zu.",
          submitLabel: "Termin wählen",
          submittingLabel: "Wird geöffnet",
          submitSuccess: "Calendly wird geöffnet",
          submitErrorRateLimited: "Zu viele Anfragen",
          submitErrorGeneric: "Allgemeiner Fehler",
          fieldErrorInvalidEmail: "Ungültige E-Mail",
          fieldErrorRequired: "Pflichtfeld",
          fieldErrorConsentRequired: "Zustimmung erforderlich",
          requiredHint: "* Pflichtfelder",
        }}
        privacyHref="/privacy"
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: /E-Mail\s*\*/ }), {
      target: { value: "keine-mail" },
    });
    fireEvent.blur(screen.getByRole("textbox", { name: /E-Mail\s*\*/ }));

    await waitFor(() => {
      expect(screen.getByText("Ungültige E-Mail")).toBeTruthy();
    });
  });
});
