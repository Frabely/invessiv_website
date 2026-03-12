// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProjectRequestForm } from "./project-request-form";

afterEach(() => {
  cleanup();
});

const formCopyFixture = {
  budgetLabel: "Budget",
  budgetOptions: ["1.000 € - 2.500 €"],
  conditionalFieldHint: "Dynamische Pflichtfelder",
  companyLabel: "Unternehmen",
  consentLabel: "Ich stimme gemäß",
  emailLabel: "E-Mail",
  firstNameLabel: "Name",
  goalLabel: "Ziel",
  goalOptions: ["Leads"],
  intro: "Kurz",
  lastNameLabel: "Nachname",
  mailBodyDetailsLabel: "Details",
  mailBodyTitle: "Neue Anfrage",
  mailLabelBudget: "Budget",
  mailLabelCompany: "Firma",
  mailLabelEmail: "E-Mail",
  mailLabelName: "Name",
  mailLabelOffer: "Angebot",
  mailLabelPhone: "Telefon",
  mailLabelRole: "Rolle",
  mailLabelStart: "Start",
  mailLabelWebsite: "Website",
  mailSubjectPrefix: "Projektanfrage",
  offerLabel: "Angebot",
  offerPlaceholder: "Auswählen",
  pagesCustomLabel: "Weitere Seiten",
  pagesCustomPlaceholder: "z. B. Q&A",
  pagesLabel: "Seiten",
  pagesOptions: ["Start", "Kontakt", "Karriere"],
  pagesPlaceholder: "Start, Kontakt",
  pagesRequiredHint: "Bitte mindestens eine Seite wählen.",
  phoneLabel: "Telefon",
  previousStepLabel: "Zurück",
  projectDetailsLabel: "Projekt",
  projectDetailsPlaceholder: "Beschreibung",
  requiredHint: "* Pflichtfelder",
  roleLabel: "Rolle",
  stepLabel: "Schritt",
  stepNavigationLabel: "Anfragefortschritt",
  stepOneTitle: "Kontakt",
  stepThreeTitle: "Rahmen",
  stepTwoTitle: "Projekt",
  startLabel: "Start",
  startOptions: ["Sofort"],
  nextStepLabel: "Weiter",
  nextStepContactLabel: "Weiter zu Projekt",
  nextStepProjectLabel: "Weiter zu Rahmen",
  submitLabel: "Senden",
  submitSuccess: "Erfolg",
  subtitle: "Rahmen",
  title: "Projektanfrage",
  websiteRequiredHint: "Website erforderlich",
  websiteLabel: "Website",
  workflowLabel: "Workflows",
  workflowOptions: ["1 Workflow"],
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
      submitHref="mailto:test@example.com"
    />,
  );

describe("ProjectRequestForm", () => {
  it("renders the first step directly with localized offer options", () => {
    renderForm();

    expect(screen.getByRole("region", { name: "Projektanfrage" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Name*" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Landing pages" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Webseiten" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Weiter zu Projekt" }),
    ).toBeTruthy();
  });

  it("preselects the offer when opened from a service CTA", () => {
    render(
      <>
        <a data-project-offer="web" href="#contact">
          Aus Service öffnen
        </a>
        <ProjectRequestForm
          formCopy={formCopyFixture}
          offerOptions={offerOptionsFixture}
          privacyHref="/privacy"
          privacyLabel="Datenschutzerklärung"
          submitHref="mailto:test@example.com"
        />
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Aus Service öffnen" }));

    const offerSelect = screen.getByRole("combobox", {
      name: "Angebot*",
    }) as HTMLSelectElement;

    expect(offerSelect.value).toBe("web");
  });

  it("keeps the offer select usable when opened via plain contact anchor", () => {
    render(
      <>
        <a href="#contact">Zum Kontakt</a>
        <ProjectRequestForm
          formCopy={formCopyFixture}
          offerOptions={offerOptionsFixture}
          privacyHref="/privacy"
          privacyLabel="Datenschutzerklärung"
          submitHref="mailto:test@example.com"
        />
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Zum Kontakt" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Angebot*" }), {
      target: { value: "landing" },
    });

    const offerSelect = screen.getByRole("combobox", {
      name: "Angebot*",
    }) as HTMLSelectElement;
    expect(offerSelect.value).toBe("landing");
  });

  it("requires at least one selected page in step two for web projects", () => {
    renderForm();

    fireEvent.change(screen.getByRole("textbox", { name: "Name*" }), {
      target: { value: "Max Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail*" }), {
      target: { value: "max@example.com" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Angebot*" }), {
      target: { value: "web" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Projekt" }));

    fireEvent.change(screen.getByRole("textbox", { name: /Website\*/ }), {
      target: { value: "https://example.com" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Projekt*" }), {
      target: { value: "Wir brauchen einen Relaunch." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Rahmen" }));

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(
      screen.getByText("Bitte mindestens eine Seite wählen."),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Rahmen" }));
    expect(screen.getByRole("checkbox")).toBeTruthy();
  });
});
