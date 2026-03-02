// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProjectRequestForm } from "./project-request-form";

afterEach(() => {
  cleanup();
});

describe("ProjectRequestForm", () => {
  it("renders trigger button before the panel is opened", () => {
    render(
      <ProjectRequestForm
        formCopy={{
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
          projectDetailsLabel: "Projekt",
          projectDetailsPlaceholder: "Beschreibung",
          requiredHint: "* Pflichtfelder",
          roleLabel: "Rolle",
          startLabel: "Start",
          startOptions: ["Sofort"],
          submitLabel: "Senden",
          submitSuccess: "Erfolg",
          subtitle: "Scope",
          title: "Projektanfrage",
          websiteRequiredHint: "Website erforderlich",
          websiteLabel: "Website",
          workflowLabel: "Workflows",
          workflowOptions: ["1 Workflow"],
        }}
        offerOptions={[
          { key: "landing", title: "Landing pages" },
          { key: "web", title: "Webseiten" },
        ]}
        openButtonLabel="Jetzt Projekt anfragen"
        privacyHref="/privacy"
        privacyLabel="Datenschutzerklärung"
        submitHref="mailto:test@example.com"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Jetzt Projekt anfragen" }),
    ).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Vorname" })).toBeNull();
  });

  it("opens form fields and localized offer options on button click", () => {
    render(
      <ProjectRequestForm
        formCopy={{
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
          projectDetailsLabel: "Projekt",
          projectDetailsPlaceholder: "Beschreibung",
          requiredHint: "* Pflichtfelder",
          roleLabel: "Rolle",
          startLabel: "Start",
          startOptions: ["Sofort"],
          submitLabel: "Senden",
          submitSuccess: "Erfolg",
          subtitle: "Scope",
          title: "Projektanfrage",
          websiteRequiredHint: "Website erforderlich",
          websiteLabel: "Website",
          workflowLabel: "Workflows",
          workflowOptions: ["1 Workflow"],
        }}
        offerOptions={[
          { key: "landing", title: "Landing pages" },
          { key: "web", title: "Webseiten" },
        ]}
        openButtonLabel="Jetzt Projekt anfragen"
        privacyHref="/privacy"
        privacyLabel="Datenschutzerklärung"
        submitHref="mailto:test@example.com"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Jetzt Projekt anfragen" }),
    );

    expect(screen.getByRole("region", { name: "Projektanfrage" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Vorname*" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Landing pages" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Webseiten" })).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox", { name: "Angebot*" }), {
      target: { value: "web" },
    });
    expect(screen.getByRole("textbox", { name: /Website\*/ })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Seiten*" })).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Datenschutzerklärung" })
        .getAttribute("href"),
    ).toBe("/privacy");
  });
});
