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
  closeLabel: "Schließen",
  conditionalFieldHint: "Dynamische Pflichtfelder",
  companyLabel: "Unternehmen",
  consentLabel: "Ich stimme gemäß",
  emailLabel: "E-Mail",
  firstNameLabel: "Vorname",
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
  pagesLabel: "Seiten",
  pagesPlaceholder: "Start, Kontakt",
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
  subtitle: "Scope",
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
      openButtonLabel="Jetzt Projekt anfragen"
      privacyHref="/privacy"
      privacyLabel="Datenschutzerklärung"
      submitHref="mailto:test@example.com"
    />,
  );

describe("ProjectRequestForm", () => {
  it("renders trigger button before the panel is opened", () => {
    renderForm();

    expect(
      screen.getByRole("button", { name: "Jetzt Projekt anfragen" }),
    ).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Vorname*" })).toBeNull();
  });

  it("opens first step and localized offer options on button click", () => {
    renderForm();

    fireEvent.click(
      screen.getByRole("button", { name: "Jetzt Projekt anfragen" }),
    );

    expect(screen.getByRole("region", { name: "Projektanfrage" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Vorname*" })).toBeTruthy();
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
          openButtonLabel="Jetzt Projekt anfragen"
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

    fireEvent.change(screen.getByRole("textbox", { name: "Vorname*" }), {
      target: { value: "Max" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "E-Mail*" }), {
      target: { value: "max@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Weiter zu Projekt" }));

    expect(screen.getByRole("textbox", { name: /Website\*/ })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Seiten*" })).toBeTruthy();
  });
});
