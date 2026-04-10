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
  firstNameLabel: "Vorname",
  lastNameLabel: "Nachname",
  goalLabel: "Ziel",
  goalOptions: [{ key: "generate_inquiries", label: "Leads" }],
  intro: "Kurz",
  nextStepContactLabel: "Weiter zu Projekt",
  nextStepLabel: "Weiter",
  nextStepProjectLabel: "Weiter zu Rahmen",
  offerLabel: "Angebot",
  offerPlaceholder: "Auswählen",
  pagesCustomLabel: "Weitere Seiten",
  pagesCustomPlaceholder: "z. B. Q&A",
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
  fieldErrorInvalidWebsite: "Ungültige Webseite",
  fieldErrorRequired: "Pflichtfeld",
  fieldErrorProjectDetailsRequired: "Projekt erforderlich",
  fieldErrorPagesRequired: "Seiten erforderlich",
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
  workflowOptions: [{ key: "one_workflow", label: "1 Workflow" }],
};

const offerOptionsFixture = [
  { key: "landing", title: "Landing pages" },
  { key: "web", title: "Webseiten" },
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
      name: "Angebot*",
    }) as HTMLSelectElement;

    expect(screen.getByRole("region", { name: "Projektanfrage" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Vorname*" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Nachname*" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Landing pages" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Webseiten" })).toBeTruthy();
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
      name: "Angebot*",
    }) as HTMLSelectElement;

    expect(offerSelect.value).toBe("web");
    expect(offerSelect.dataset.empty).toBe("false");

    fireEvent.change(screen.getByRole("textbox", { name: "Vorname*" }), {
      target: { value: "Max" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Nachname*" }), {
      target: { value: "Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail*" }), {
      target: { value: "max@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Projekt" }));

    await waitFor(() => {
      expect(
        (
          screen.getByRole("textbox", {
            name: "Projekt*",
          }) as HTMLTextAreaElement
        ).value,
      ).toBe("professionell online auftreten");
    });
  });

  it("requires at least one selected page in step two for web projects", async () => {
    renderForm();

    fireEvent.change(screen.getByRole("textbox", { name: "Vorname*" }), {
      target: { value: "Max" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Nachname*" }), {
      target: { value: "Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail*" }), {
      target: { value: "max@example.com" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Angebot*" }), {
      target: { value: "web" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Projekt" }));

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: /Webseite\*/ })).toBeTruthy();
    });

    fireEvent.change(screen.getByRole("textbox", { name: /Webseite\*/ }), {
      target: { value: "https://example.com" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Projekt*" }), {
      target: { value: "Wir brauchen einen Relaunch mit besserer Struktur." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Rahmen" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });
    expect(
      screen.getByText("Bitte mindestens eine Seite wählen."),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Rahmen" }));
    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeTruthy();
    });
  });

  it("clears step one validation errors as soon as the fields are corrected", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Projekt" }));

    await waitFor(() => {
      expect(screen.getAllByText("Pflichtfeld").length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByRole("textbox", { name: /^Vorname\*/ }), {
      target: { value: "Max" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^Nachname\*/ }), {
      target: { value: "Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^E-Mail\*/ }), {
      target: { value: "max@example.com" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /^Angebot\*/ }), {
      target: { value: "landing" },
    });

    await waitFor(() => {
      expect(screen.queryByText("Pflichtfeld")).toBeNull();
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

    fireEvent.change(screen.getByRole("textbox", { name: "Vorname*" }), {
      target: { value: "Max" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Nachname*" }), {
      target: { value: "Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail*" }), {
      target: { value: "max@example.com" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Angebot*" }), {
      target: { value: "landing" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Projekt" }));

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "Ziel*" })).toBeTruthy();
    });

    fireEvent.change(screen.getByRole("combobox", { name: "Ziel*" }), {
      target: { value: "generate_inquiries" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Projekt*" }), {
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
      firstName: "Max",
      goalKey: "generate_inquiries",
      lastName: "Mustermann",
      locale: "de",
      offerKey: "landing",
      projectDetails:
        "Eine Landingpage für qualifizierte Leads mit klarem CTA.",
    });

    await waitFor(() => {
      expect(screen.getByText("Erfolg")).toBeTruthy();
    });

    expect(mockTrackConversionEvent).toHaveBeenCalledWith(
      "lead_submit_success",
      {
        location: "contact",
        target: "form",
        variant: "primary",
      },
    );
  });
});
