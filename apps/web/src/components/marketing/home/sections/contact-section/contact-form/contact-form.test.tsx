// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PROJECT_OFFER_CHANGE_EVENT } from "@/common/constants/marketing/project-offer-change-event";
import type { ContactFormCopy } from "@/i18n/dictionaries/marketing/home";
import {
  submitDiscoveryCall,
  submitQuickContact,
} from "@/client/contact/services/contact-form-service";
import { ContactForm } from "./contact-form";

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => ({
    locale: "de",
  }),
}));

vi.mock("@/client/contact/services/contact-form-service", async () => {
  const actual = await vi.importActual<
    typeof import("@/client/contact/services/contact-form-service")
  >("@/client/contact/services/contact-form-service");

  return {
    createCalendlyPrefillHref: actual.createCalendlyPrefillHref,
    submitDiscoveryCall: vi.fn(),
    submitQuickContact: vi.fn(),
  };
});

vi.mock("@/lib/analytics/conversion-events", () => ({
  trackConversionEvent: vi.fn(),
}));

const CALENDLY_HREF = "https://calendly.com/service-invessiv-cxf5/30min";

const FORM_COPY: ContactFormCopy = {
  nameLabel: "Name",
  emailLabel: "E-Mail",
  projectScopeLabel: "Leistungsmodell",
  projectScopeOptions: {
    landing_page: "Landingpage",
    compact_website: "Kompakte Website",
    business_website: "Business Website",
    unsure: "Noch unsicher",
  },
  messageLabel: "Worum geht es? (optional)",
  messagePlaceholder: "Zwei Sätze reichen.",
  consentLabel: "Ich stimme gemäß",
  privacyLabel: "Datenschutzerklärung",
  requiredHint: "* Pflichtfelder",
  fieldErrorInvalidEmail: "Ungültige E-Mail",
  fieldErrorRequired: "Pflichtfeld",
  fieldErrorConsentRequired: "Zustimmung erforderlich",
  submitErrorRateLimited: "Rate limited",
  submitErrorGeneric: "Generic error",
  callSubmitLabel: "Weiter zur Terminauswahl",
  callSubmittingLabel: "Terminauswahl wird geöffnet",
  callSubmitSuccess: "Terminauswahl öffnet sich",
  emailQuestion: "Lieber schreiben statt sprechen?",
  emailNote:
    "Das ausgefüllte Formular geht als E-Mail an mich. Ich antworte in der Regel innerhalb von 24 Stunden.",
  emailSubmitLabel: "Anfrage senden",
  emailSubmittingLabel: "Wird gesendet",
  emailSubmitSuccess: "Anfrage gesendet.",
  emailSubmitErrorDelivery: "Delivery error",
};

const submitDiscoveryCallMock = vi.mocked(submitDiscoveryCall);
const submitQuickContactMock = vi.mocked(submitQuickContact);

let replacedHref: string | null = null;

beforeEach(() => {
  vi.clearAllMocks();
  replacedHref = null;
  submitDiscoveryCallMock.mockResolvedValue({ ok: true, requestId: "req_1" });
  submitQuickContactMock.mockResolvedValue({ ok: true, requestId: "req_2" });

  vi.spyOn(window, "open").mockImplementation(
    () =>
      ({
        close: vi.fn(),
        location: {
          replace: (href: string) => {
            replacedHref = href;
          },
        },
        opener: {},
      }) as unknown as Window,
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderForm({ calendlyHref = CALENDLY_HREF } = {}) {
  return render(
    <ContactForm
      calendlyHref={calendlyHref}
      formCopy={FORM_COPY}
      privacyHref="/privacy"
    />,
  );
}

function fillRequiredFields({ message }: { message?: string } = {}) {
  fireEvent.change(screen.getByRole("textbox", { name: /Name/ }), {
    target: { value: "Mara Kern" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /E-Mail/ }), {
    target: { value: "mara@example.com" },
  });

  if (message !== undefined) {
    fireEvent.change(screen.getByRole("textbox", { name: /Worum geht es/ }), {
      target: { value: message },
    });
  }

  fireEvent.click(screen.getByRole("checkbox"));
}

describe("ContactForm", () => {
  it("renders one field set with two ways to submit it", () => {
    renderForm();

    expect(screen.getAllByRole("textbox")).toHaveLength(3);
    expect(screen.getByRole("group", { name: /Leistungsmodell/ })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Weiter zur Terminauswahl" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Anfrage senden" })).toBeTruthy();
  });

  it("preselects 'Noch unsicher'", () => {
    renderForm();

    expect(screen.getByRole("radio", { name: "Noch unsicher" })).toHaveProperty(
      "checked",
      true,
    );
  });

  it("blocks both paths until the required fields are valid", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Anfrage senden" }));

    await waitFor(() => {
      expect(screen.getByText("Zustimmung erforderlich")).toBeTruthy();
    });
    expect(screen.getAllByText("Pflichtfeld").length).toBeGreaterThan(0);
    expect(submitQuickContactMock).not.toHaveBeenCalled();
    expect(submitDiscoveryCallMock).not.toHaveBeenCalled();
  });

  describe("call path", () => {
    it("passes the selected scope to Calendly as a2", async () => {
      renderForm();

      fireEvent.click(screen.getByRole("radio", { name: "Kompakte Website" }));
      fillRequiredFields({ message: "Neue Website für meine Praxis" });
      fireEvent.click(
        screen.getByRole("button", { name: "Weiter zur Terminauswahl" }),
      );

      await waitFor(() => {
        expect(replacedHref).not.toBeNull();
      });

      const url = new URL(replacedHref as unknown as string);
      expect(url.searchParams.get("name")).toBe("Mara Kern");
      expect(url.searchParams.get("email")).toBe("mara@example.com");
      expect(url.searchParams.get("a1")).toBe("Neue Website für meine Praxis");
      expect(url.searchParams.get("a2")).toBe("Kompakte Website");
      expect(submitDiscoveryCallMock.mock.calls[0]?.[0]).toMatchObject({
        kind: "discovery_call",
        projectScope: "compact_website",
      });
      expect(submitQuickContactMock).not.toHaveBeenCalled();
    });

    it("omits a2 when the visitor is still unsure", async () => {
      renderForm();

      fillRequiredFields();
      fireEvent.click(
        screen.getByRole("button", { name: "Weiter zur Terminauswahl" }),
      );

      await waitFor(() => {
        expect(replacedHref).not.toBeNull();
      });

      expect(
        new URL(replacedHref as unknown as string).searchParams.has("a2"),
      ).toBe(false);
    });

    it("keeps the visitor on the page when the Calendly URL is invalid", async () => {
      renderForm({ calendlyHref: "not a URL" });

      fillRequiredFields();
      fireEvent.click(
        screen.getByRole("button", { name: "Weiter zur Terminauswahl" }),
      );

      await waitFor(() => {
        expect(screen.getByText("Generic error")).toBeTruthy();
      });
    });
  });

  describe("email path", () => {
    it("sends the form as a quick contact with the scope in the message", async () => {
      renderForm();

      fireEvent.click(screen.getByRole("radio", { name: "Business Website" }));
      fillRequiredFields({ message: "Wir brauchen eine neue Seite." });
      fireEvent.click(screen.getByRole("button", { name: "Anfrage senden" }));

      await waitFor(() => {
        expect(submitQuickContactMock).toHaveBeenCalled();
      });

      expect(submitQuickContactMock.mock.calls[0]?.[0]).toMatchObject({
        displayName: "Mara Kern",
        email: "mara@example.com",
        kind: "quick_contact",
        message:
          "Leistungsmodell: Business Website\n\nWir brauchen eine neue Seite.",
      });
      expect(window.open).not.toHaveBeenCalled();
      expect(submitDiscoveryCallMock).not.toHaveBeenCalled();
    });

    it("still carries the scope when no message was written", async () => {
      renderForm();

      fillRequiredFields();
      fireEvent.click(screen.getByRole("button", { name: "Anfrage senden" }));

      await waitFor(() => {
        expect(submitQuickContactMock).toHaveBeenCalled();
      });

      expect(submitQuickContactMock.mock.calls[0]?.[0]?.message).toBe(
        "Leistungsmodell: Noch unsicher",
      );
    });

    it("confirms the send in the same words as the button", async () => {
      renderForm();

      fillRequiredFields();
      fireEvent.click(screen.getByRole("button", { name: "Anfrage senden" }));

      await waitFor(() => {
        expect(screen.getByText("Anfrage gesendet.")).toBeTruthy();
      });
    });

    it("reports a delivery failure", async () => {
      submitQuickContactMock.mockResolvedValue({
        code: "delivery_unavailable",
        ok: false,
        requestId: "req_3",
      });
      renderForm();

      fillRequiredFields();
      fireEvent.click(screen.getByRole("button", { name: "Anfrage senden" }));

      await waitFor(() => {
        expect(screen.getByText("Delivery error")).toBeTruthy();
      });
    });
  });

  it("adopts the preselection dispatched by the services section", async () => {
    renderForm();

    act(() => {
      window.dispatchEvent(
        new CustomEvent(PROJECT_OFFER_CHANGE_EVENT, {
          detail: { offerKey: "web" },
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByRole("radio", { name: "Business Website" }),
      ).toHaveProperty("checked", true);
    });
  });

  it("ignores offer keys without a matching scope", () => {
    renderForm();

    act(() => {
      window.dispatchEvent(
        new CustomEvent(PROJECT_OFFER_CHANGE_EVENT, {
          detail: { offerKey: "maintenance" },
        }),
      );
    });

    expect(screen.getByRole("radio", { name: "Noch unsicher" })).toHaveProperty(
      "checked",
      true,
    );
  });
});
