// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectRequestForm } from "./project-request-form";

const mockTrackConversionEvent = vi.fn();

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => ({
    locale: "de",
  }),
}));

vi.mock("@/lib/analytics/conversion-events", () => ({
  trackConversionEvent: (...args: unknown[]) =>
    mockTrackConversionEvent(...args),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mockTrackConversionEvent.mockReset();
});

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

const formCopyFixture = {
  budgetLabel: "Budget",
  budgetOptions: [{ key: "between_1000_2500", label: "1.000 € - 2.500 €" }],
  companyLabel: "Unternehmen",
  conditionalFieldHint: "Dynamische Pflichtfelder",
  consentLabel: "Ich stimme gemäß",
  emailLabel: "E-Mail",
  nameLabel: "Name",
  addPageLabel: "Seite hinzufügen",
  goalLabel: "Ziel",
  goalOptions: [{ key: "generate_inquiries", label: "Leads" }],
  intro: "Kurz",
  nextStepContactLabel: "Weiter zu Projekt",
  nextStepLabel: "Weiter",
  nextStepProjectLabel: "Weiter zu Rahmen",
  offerLabel: "Angebot",
  offerPlaceholder: "Auswählen",
  offerGuidance: [
    { key: "landing", label: "Web-Hinweis" },
    { key: "process", label: "Prozess-Hinweis" },
    { key: "maintenance", label: "Support-Hinweis" },
  ],
  pagesCustomLabel: "Weitere Seite hinzufügen",
  pagesCustomPlaceholder: "z. B. Sponsoren",
  pagesCustomRemoveLabel: "Seite entfernen",
  pagesLabel: "Seiten",
  pagesOptions: [
    { key: "home", label: "Start" },
    { key: "contact", label: "Kontakt" },
    { key: "careers", label: "Karriere" },
  ],
  pagesPlaceholder: "Start, Kontakt",
  pagesRequiredHint: "Bitte mindestens eine Seite wählen.",
  phoneLabel: "Telefon",
  previousStepLabel: "Zurück",
  privacyLabel: "Datenschutzerklärung",
  projectDetailsLabel: "Projekt",
  projectDetailsPlaceholder: "Beschreibung",
  projectDetailsPlaceholders: [
    { key: "landing", label: "Web-Beschreibung" },
    { key: "process", label: "Prozess-Beschreibung" },
    { key: "maintenance", label: "Support-Beschreibung" },
  ],
  requiredHint: "* Pflichtfelder",
  roleLabel: "Rolle",
  startLabel: "Start",
  startOptions: [{ key: "immediately", label: "Sofort" }],
  stepLabel: "Schritt",
  stepNavigationLabel: "Anfragefortschritt",
  stepOneTitle: "Kontakt",
  stepThreeTitle: "Rahmen",
  stepTwoTitle: "Projekt",
  submitErrorDelivery: "Zustellung nicht möglich",
  submitErrorGeneric: "Allgemeiner Fehler",
  submitErrorRateLimited: "Zu viele Anfragen",
  submitErrorValidation: "Bitte Eingaben prüfen",
  validationSummaryPrefix: "Bitte prüfen:",
  fieldErrorInvalidEmail: "Ungültige E-Mail",
  fieldErrorInvalidWebsite:
    "Ungültige Webseite, z. B. https://www.webseite.com. www.webseite.com ist ohne Protokoll ungültig.",
  fieldErrorRequired: "Pflichtfeld",
  fieldErrorProjectDetailsRequired: "Projekt erforderlich",
  fieldErrorPagesRequired: "Seiten erforderlich",
  fieldErrorTooManyPages: "Maximal 12 eigene Seiten erlaubt",
  fieldErrorGoalRequired: "Ziel erforderlich",
  fieldErrorWorkflowRequired: "Workflow erforderlich",
  fieldErrorConsentRequired: "Zustimmung erforderlich",
  submitLabel: "Senden",
  submitSuccess: "Erfolg",
  submittingLabel: "Wird gesendet",
  subtitle: "Rahmen",
  title: "Projektanfrage",
  websiteLabel: "Webseite",
  workflowLabel: "Workflows",
  workflowOptions: [
    {
      key: "digitize_existing_process",
      label: "Bestehenden Ablauf digitalisieren",
    },
  ],
};

const offerOptionsFixture = [
  { key: "landing", title: "Webauftritt & Landingpages" },
  { key: "process", title: "Prozessoptimierung & digitale Workflows" },
  { key: "maintenance", title: "Support & Wartung" },
];

const renderForm = () =>
  render(
    <ProjectRequestForm
      formCopy={formCopyFixture}
      offerOptions={offerOptionsFixture}
      privacyHref="/privacy"
      privacyLabel="Datenschutzerklärung"
    />,
  );

describe("ProjectRequestForm", () => {
  it("renders the first step directly with localized offer options", () => {
    renderForm();

    const offerSelect = screen.getByRole("combobox", {
      name: /Angebot\s*\*/,
    }) as HTMLSelectElement;

    expect(screen.getByRole("region", { name: "Projektanfrage" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: /Name\s*\*/ })).toBeTruthy();
    expect(
      screen.getByRole("option", { name: "Webauftritt & Landingpages" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("option", {
        name: "Prozessoptimierung & digitale Workflows",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("option", { name: "Support & Wartung" }),
    ).toBeTruthy();
    expect(screen.getByText("Dynamische Pflichtfelder")).toBeTruthy();
    expect(offerSelect.dataset.empty).toBe("true");
    expect(
      screen.getByRole("button", { name: "Weiter zu Projekt" }),
    ).toBeTruthy();
  });

  it("preselects the offer and seeds the project goal when opened from a service CTA", async () => {
    render(
      <>
        <a
          data-project-goal="professionell online auftreten"
          data-project-offer="web"
          href="#contact"
        >
          Aus Service öffnen
        </a>
        <ProjectRequestForm
          formCopy={formCopyFixture}
          offerOptions={offerOptionsFixture}
          privacyHref="/privacy"
          privacyLabel="Datenschutzerklärung"
        />
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Aus Service öffnen" }));

    const offerSelect = screen.getByRole("combobox", {
      name: /Angebot\s*\*/,
    }) as HTMLSelectElement;

    expect(offerSelect.value).toBe("landing");
    expect(offerSelect.dataset.empty).toBe("false");

    fireEvent.change(screen.getByRole("textbox", { name: /Name\s*\*/ }), {
      target: { value: "Max Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /E-Mail\s*\*/ }), {
      target: { value: "max@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Projekt" }));

    await waitFor(() => {
      expect(
        (
          screen.getByRole("textbox", {
            name: /Projekt\s*\*/,
          }) as HTMLTextAreaElement
        ).value,
      ).toBe("professionell online auftreten");
    });
  });

  it("requires at least one selected page in step two for web projects", async () => {
    renderForm();

    fireEvent.change(screen.getByRole("textbox", { name: /Name\s*\*/ }), {
      target: { value: "Max Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /E-Mail\s*\*/ }), {
      target: { value: "max@example.com" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /Angebot\s*\*/ }), {
      target: { value: "landing" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Projekt" }));

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Webseite" })).toBeTruthy();
      expect(screen.getByText("Web-Hinweis")).toBeTruthy();
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Webseite" }), {
      target: { value: "https://example.com" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /Ziel\s*\*/ }), {
      target: { value: "generate_inquiries" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Projekt\s*\*/ }), {
      target: { value: "Wir brauchen einen Relaunch mit besserer Struktur." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Rahmen" }));

    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    });
    expect(
      screen.getByText("Bitte mindestens eine Seite wählen."),
    ).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("z. B. Sponsoren"), {
      target: { value: "Sponsoren" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Seite hinzufügen" }));
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Rahmen" }));
    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeTruthy();
    });
  });

  it("validates an optional website when a value is entered for web projects", async () => {
    renderForm();

    fireEvent.change(screen.getByRole("textbox", { name: /Name\s*\*/ }), {
      target: { value: "Max Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /E-Mail\s*\*/ }), {
      target: { value: "max@example.com" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /Angebot\s*\*/ }), {
      target: { value: "landing" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Projekt" }));

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Webseite" })).toBeTruthy();
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Webseite" }), {
      target: { value: "keine-url" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Projekt\s*\*/ }), {
      target: { value: "Wir brauchen eine neue Seitenstruktur." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Rahmen" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Ungültige Webseite, z. B. https://www.webseite.com. www.webseite.com ist ohne Protokoll ungültig.",
        ),
      ).toBeTruthy();
    });
  });

  it("shows process-specific fields without a required subservice field", async () => {
    renderForm();

    fireEvent.change(screen.getByRole("textbox", { name: /Name\s*\*/ }), {
      target: { value: "Max Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /E-Mail\s*\*/ }), {
      target: { value: "max@example.com" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /Angebot\s*\*/ }), {
      target: { value: "process" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Projekt" }));

    await waitFor(() => {
      expect(screen.getByText("Prozess-Hinweis")).toBeTruthy();
      expect(
        screen.getByRole("combobox", { name: /Workflows\s*\*/ }),
      ).toBeTruthy();
    });

    expect(screen.queryByRole("textbox", { name: "Webseite" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: /Ziel\s*\*/ })).toBeNull();
    expect(screen.queryByText("Seiten")).toBeNull();
    expect(screen.getByPlaceholderText("Prozess-Beschreibung")).toBeTruthy();
  });

  it("shows support-specific fields without a required subservice field", async () => {
    renderForm();

    fireEvent.change(screen.getByRole("textbox", { name: /Name\s*\*/ }), {
      target: { value: "Max Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /E-Mail\s*\*/ }), {
      target: { value: "max@example.com" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /Angebot\s*\*/ }), {
      target: { value: "maintenance" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Projekt" }));

    await waitFor(() => {
      expect(screen.getByText("Support-Hinweis")).toBeTruthy();
      expect(
        screen.getByRole("textbox", { name: /Webseite\s*\*/ }),
      ).toBeTruthy();
    });

    expect(
      screen.queryByRole("combobox", { name: /Workflows\s*\*/ }),
    ).toBeNull();
    expect(screen.queryByRole("combobox", { name: /Ziel\s*\*/ })).toBeNull();
    expect(screen.queryByText("Seiten")).toBeNull();
    expect(screen.getByPlaceholderText("Support-Beschreibung")).toBeTruthy();
  });

  it("limits web projects to 12 custom pages", async () => {
    renderForm();

    fireEvent.change(screen.getByRole("textbox", { name: /Name\s*\*/ }), {
      target: { value: "Max Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /E-Mail\s*\*/ }), {
      target: { value: "max@example.com" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /Angebot\s*\*/ }), {
      target: { value: "landing" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Projekt" }));

    await waitFor(() => {
      expect(
        screen.getByRole("textbox", { name: /Projekt\s*\*/ }),
      ).toBeTruthy();
    });

    const customPageInput = screen.getByPlaceholderText("z. B. Sponsoren");
    for (let index = 1; index <= 12; index += 1) {
      fireEvent.change(customPageInput, {
        target: { value: `Zusatzseite ${index}` },
      });
      fireEvent.click(screen.getByRole("button", { name: /Seite hinzuf/i }));
    }

    fireEvent.change(customPageInput, {
      target: { value: "Zusatzseite 13" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Seite hinzuf/i }));

    await waitFor(() => {
      expect(screen.getByText("Maximal 12 eigene Seiten erlaubt")).toBeTruthy();
    });
  }, 10000);

  it("clears step one validation errors as soon as the fields are corrected", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Projekt" }));

    await waitFor(() => {
      expect(screen.getAllByText("Pflichtfeld").length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByRole("textbox", { name: /Name\s*\*/ }), {
      target: { value: "Max Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /E-Mail\s*\*/ }), {
      target: { value: "max@example.com" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /Angebot\s*\*/ }), {
      target: { value: "landing" },
    });

    await waitFor(() => {
      expect(screen.queryByText("Pflichtfeld")).toBeNull();
    });
  });

  it("shows step one validation errors on blur", async () => {
    renderForm();

    fireEvent.blur(screen.getByRole("textbox", { name: /Name\s*\*/ }));

    await waitFor(() => {
      expect(screen.getByText("Pflichtfeld")).toBeTruthy();
    });
  });

  it("submits the normalized payload to the API and shows success", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, requestId: "req_123" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );

    renderForm();

    fireEvent.change(screen.getByRole("textbox", { name: /Name\s*\*/ }), {
      target: { value: "Max Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /E-Mail\s*\*/ }), {
      target: { value: "max@example.com" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /Angebot\s*\*/ }), {
      target: { value: "landing" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Projekt" }));

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /Ziel\s*\*/ })).toBeTruthy();
    });

    fireEvent.change(screen.getByRole("combobox", { name: /Ziel\s*\*/ }), {
      target: { value: "generate_inquiries" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Projekt\s*\*/ }), {
      target: {
        value: "Eine Landingpage für qualifizierte Leads mit klarem CTA.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Rahmen" }));

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Senden" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [, requestInit] = fetchMock.mock.calls[0]!;
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/public/contact");
    expect(requestInit?.method).toBe("POST");
    expect(requestInit?.headers).toMatchObject({
      "Content-Type": "application/json",
    });

    const payload = JSON.parse(String(requestInit?.body));
    expect(payload).toMatchObject({
      consentAccepted: true,
      email: "max@example.com",
      displayName: "Max Mustermann",
      goalKey: "generate_inquiries",
      locale: "de",
      offerKey: "landing",
      projectDetails:
        "Eine Landingpage für qualifizierte Leads mit klarem CTA.",
    });

    await waitFor(() => {
      expect(screen.getByText("Erfolg")).toBeTruthy();
    });

    expect(mockTrackConversionEvent).toHaveBeenCalledWith("form_start", {
      form_id: "project_request",
      location: "contact",
      target: "form",
      variant: "primary",
      step: "3",
    });
    expect(mockTrackConversionEvent).toHaveBeenCalledWith(
      "form_submit_attempt",
      {
        form_id: "project_request",
        location: "contact",
        target: "form",
        variant: "primary",
        step: "3",
      },
    );
    expect(mockTrackConversionEvent).toHaveBeenCalledWith(
      "lead_submit_success",
      {
        form_id: "project_request",
        location: "contact",
        target: "form",
        variant: "primary",
        step: "3",
      },
    );
  });
});
