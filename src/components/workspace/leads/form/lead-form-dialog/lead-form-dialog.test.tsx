// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeadFieldLimits } from "@/common/constants/leads/forms/lead-field-limits";
import { LeadListQueryParam } from "@/common/constants/leads/list/lead-list-query-params";
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";
import {
  getLeadsFormDictionary,
  getLeadsSharedDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { LeadFormDialog } from "./lead-form-dialog";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/de/workspace/leads",
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () =>
    new URLSearchParams(`${LeadListQueryParam.Mode}=create&status=qualified`),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  replaceMock.mockReset();
});

describe("LeadFormDialog", () => {
  const EDIT_LEAD: LeadDetailDto = {
    id: "lead-edit-123",
    displayName: "Anna Meyer",
    firstName: "Anna",
    lastName: "Meyer",
    companyName: "Meyer Studio",
    email: "anna@example.com",
    phone: null,
    websiteUrl: null,
    score: null,
    source: "manual",
    leadStatus: "new",
    owner: null,
    notes: null,
    improvements: ["Mehr Proof"],
    externalGuid: null,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    category: null,
    socialProfiles: [],
    activities: [],
    submissions: [],
  };

  it("shows validation errors for empty submit and closes via the create mode query param", async () => {
    const { rerender } = render(
      <LeadFormDialog
        categories={[
          {
            id: "cat-1",
            label: "Coaches",
            labelKey: "coaches",
          },
        ]}
        content={getLeadsFormDictionary("de")}
        mode="create"
        open
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(replaceMock).toHaveBeenCalledWith(
      "/de/workspace/leads?status=qualified",
      { scroll: false },
    );

    fireEvent.click(screen.getByRole("button", { name: "Lead speichern" }));

    expect(
      await screen.findByText("Anzeigename ist erforderlich"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Anzeigename"), {
      target: { value: "Meyer Studio" },
    });

    await waitFor(() => {
      expect(
        screen.queryByText("Anzeigename ist erforderlich"),
      ).not.toBeInTheDocument();
    });

    rerender(
      <LeadFormDialog
        categories={[
          {
            id: "cat-1",
            label: "Coaches",
            labelKey: "coaches",
          },
        ]}
        content={getLeadsFormDictionary("de")}
        mode="create"
        open={false}
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    rerender(
      <LeadFormDialog
        categories={[
          {
            id: "cat-1",
            label: "Coaches",
            labelKey: "coaches",
          },
        ]}
        content={getLeadsFormDictionary("de")}
        mode="create"
        open
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    await waitFor(() => {
      expect(
        screen.queryByText("Anzeigename ist erforderlich"),
      ).not.toBeInTheDocument();
    });
  });

  it("ignores backdrop clicks and still triggers close on Escape", () => {
    render(
      <LeadFormDialog
        categories={[
          {
            id: "cat-1",
            label: "Coaches",
            labelKey: "coaches",
          },
        ]}
        content={getLeadsFormDictionary("de")}
        mode="create"
        open
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    const dialog = screen.getByRole("dialog");
    const overlay = dialog.parentElement;

    if (!overlay) {
      throw new Error("dialog overlay not found");
    }

    fireEvent.click(overlay);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();

    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(replaceMock).toHaveBeenCalledWith(
      "/de/workspace/leads?status=qualified",
      { scroll: false },
    );
  });

  it("shows display name and email validation errors only after blur", async () => {
    render(
      <LeadFormDialog
        categories={[
          {
            id: "cat-1",
            label: "Coaches",
            labelKey: "coaches",
          },
        ]}
        content={getLeadsFormDictionary("de")}
        mode="create"
        open
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    const displayNameInput = screen.getByRole("textbox", {
      name: "Anzeigename *",
    });

    fireEvent.change(displayNameInput, {
      target: { value: "   " },
    });

    expect(
      screen.queryByText("Anzeigename ist erforderlich"),
    ).not.toBeInTheDocument();

    fireEvent.blur(displayNameInput);

    expect(
      await screen.findByText("Anzeigename ist erforderlich"),
    ).toBeInTheDocument();

    const emailInput = screen.getByRole("textbox", {
      name: "E-Mail",
    });

    fireEvent.change(emailInput, {
      target: { value: "invalid" },
    });

    expect(screen.queryByText("Ungültige E-Mail")).not.toBeInTheDocument();

    fireEvent.blur(emailInput);

    expect(await screen.findByText("Ungültige E-Mail")).toBeInTheDocument();
  });

  it("accepts an empty email field on submit", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const content = getLeadsFormDictionary("de");

    render(
      <LeadFormDialog
        categories={[
          {
            id: "cat-1",
            label: "Coaches",
            labelKey: "coaches",
          },
        ]}
        content={content}
        mode="create"
        open
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: /Anzeigename/ }), {
      target: { value: "Meyer Studio" },
    });
    fireEvent.change(screen.getByLabelText("Telefon"), {
      target: { value: "abc123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Lead speichern" }));

    expect(
      await screen.findByText(content.validation.phoneInvalid),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("wraps focus from the last focusable element back to the close button", () => {
    render(
      <LeadFormDialog
        categories={[
          {
            id: "cat-1",
            label: "Coaches",
            labelKey: "coaches",
          },
        ]}
        content={getLeadsFormDictionary("de")}
        mode="create"
        open
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    const dialog = screen.getByRole("dialog");
    const closeButton = screen.getByRole("button", { name: "Schließen" });
    const submitButton = screen.getByRole("button", { name: "Lead speichern" });

    submitButton.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });

    expect(closeButton).toHaveFocus();
  });

  it("adds confirmed dynamic rows, clears the entry panels, and blocks duplicate social platforms", async () => {
    render(
      <LeadFormDialog
        categories={[
          {
            id: "cat-1",
            label: "Coaches",
            labelKey: "coaches",
          },
        ]}
        content={getLeadsFormDictionary("de")}
        mode="create"
        open
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Verbesserung hinzufügen" }),
    );

    const improvementInput = await screen.findByLabelText("Verbesserung");
    expect(improvementInput).toBeInTheDocument();

    await waitFor(() => {
      expect(improvementInput).toHaveFocus();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Hinzufügen" })[0]);
    expect(
      await screen.findByText("Verbesserung darf nicht leer sein"),
    ).toBeInTheDocument();

    fireEvent.change(improvementInput, {
      target: { value: "Klarere CTA" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Hinzufügen" })[0]);

    expect(await screen.findByText("Klarere CTA")).toBeInTheDocument();
    expect(screen.queryByLabelText("Verbesserung")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Profil hinzufügen" }));

    const platformSelect = await screen.findByLabelText("Plattform");
    expect(platformSelect).toBeInTheDocument();
    const profileUrlInput = screen.getByLabelText("Profil-URL");
    expect(profileUrlInput).toBeInTheDocument();

    await waitFor(() => {
      expect(platformSelect).toHaveFocus();
    });

    fireEvent.change(platformSelect, {
      target: { value: "instagram" },
    });
    fireEvent.change(profileUrlInput, {
      target: { value: "https://instagram.com/invessiv" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Hinzufügen" })[0]);

    expect(await screen.findByText("Instagram")).toBeInTheDocument();
    expect(
      screen.getByText("https://instagram.com/invessiv"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Profil-URL")).not.toBeInTheDocument();
  });

  it("keeps oversized improvements out of the saved list", async () => {
    const content = getLeadsFormDictionary("de");

    render(
      <LeadFormDialog
        categories={[
          {
            id: "cat-1",
            label: "Coaches",
            labelKey: "coaches",
          },
        ]}
        content={content}
        mode="create"
        open
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Verbesserung hinzufügen/ }),
    );

    const improvementInput = await screen.findByLabelText("Verbesserung");
    fireEvent.change(improvementInput, {
      target: { value: "A".repeat(LeadFieldLimits.ImprovementMaxLength + 1) },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /Hinzufügen/ })[0]);

    expect(
      await screen.findByText(content.validation.improvementTooLong),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("A".repeat(LeadFieldLimits.ImprovementMaxLength + 1)),
    ).not.toBeInTheDocument();
  });

  it("shows a profile URL validation error when the draft field loses focus", async () => {
    render(
      <LeadFormDialog
        categories={[
          {
            id: "cat-1",
            label: "Coaches",
            labelKey: "coaches",
          },
        ]}
        content={getLeadsFormDictionary("de")}
        mode="create"
        open
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Profil hinzuf/i }));

    const profileUrlInput = await screen.findByLabelText("Profil-URL");
    fireEvent.change(profileUrlInput, {
      target: { value: "not-a-url" },
    });

    expect(screen.queryByText("Ungültige URL")).not.toBeInTheDocument();

    fireEvent.blur(profileUrlInput);

    expect(await screen.findByText("Ungültige URL")).toBeInTheDocument();
  });

  it("submits a populated form and navigates to the created lead", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        lead: { id: "lead-new-123" },
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LeadFormDialog
        categories={[
          {
            id: "cat-1",
            label: "Coaches",
            labelKey: "coaches",
          },
        ]}
        content={getLeadsFormDictionary("de")}
        mode="create"
        open
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: /Anzeigename/ }), {
      target: { value: "Meyer Studio" },
    });
    fireEvent.change(screen.getByLabelText("E-Mail"), {
      target: { value: "anna@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Unternehmen"), {
      target: { value: "Meyer Studio" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Score/ }), {
      target: { value: "84" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Verbesserung hinzufügen" }),
    );
    fireEvent.change(screen.getByLabelText("Verbesserung"), {
      target: { value: "Klarere CTA" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Hinzufügen" })[0]);

    fireEvent.click(screen.getByRole("button", { name: "Profil hinzufügen" }));
    fireEvent.change(screen.getByLabelText("Plattform"), {
      target: { value: "linkedin" },
    });
    fireEvent.change(screen.getByLabelText("Profil-URL"), {
      target: { value: "https://linkedin.com/in/anna-meyer" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Hinzufügen" })[0]);

    fireEvent.click(screen.getByRole("button", { name: "Lead speichern" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    expect(requestInit.body).toContain('"displayName":"Meyer Studio"');
    expect(requestInit.body).toContain('"email":"anna@example.com"');
    expect(requestInit.body).toContain('"company_name":"Meyer Studio"');
    expect(requestInit.body).toContain('"score":84');
    expect(requestInit.body).toContain('"improvements":["Klarere CTA"]');
    expect(requestInit.body).toContain(
      '"social_profiles":[{"platform":"linkedin","profile_url":"https://linkedin.com/in/anna-meyer"}]',
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/de/workspace/leads?status=qualified&selected=lead-new-123",
        { scroll: false },
      );
    });
  });

  it("maps duplicate email errors to the email field", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        error: "EMAIL_EXISTS",
        message: "A lead with this email already exists",
      }),
      ok: false,
      status: 409,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LeadFormDialog
        categories={[
          {
            id: "cat-1",
            label: "Coaches",
            labelKey: "coaches",
          },
        ]}
        content={getLeadsFormDictionary("de")}
        mode="create"
        open
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: /Anzeigename/ }), {
      target: { value: "Meyer Studio" },
    });
    fireEvent.change(screen.getByLabelText("E-Mail"), {
      target: { value: "anna@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Lead speichern" }));

    expect(
      await screen.findByText(
        "Diese E-Mail ist bereits einem bestehenden Lead zugeordnet.",
      ),
    ).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows edit-state hints for populated fields and clears generic fields when emptied", async () => {
    const content = getLeadsFormDictionary("de");

    render(
      <LeadFormDialog
        categories={[
          {
            id: "cat-1",
            label: "Coaches",
            labelKey: "coaches",
          },
        ]}
        content={content}
        editLeadId={EDIT_LEAD.id}
        initialLead={EDIT_LEAD}
        mode="edit"
        open
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    const companyInput = screen.getByRole("textbox", { name: /Unternehmen/ });
    const companyField = companyInput.closest("label");
    expect(companyField).not.toBeNull();
    expect(companyField).toHaveTextContent(content.help.fieldStateUnchanged);

    fireEvent.change(companyInput, {
      target: { value: "" },
    });

    await waitFor(() => {
      expect(companyField).toHaveTextContent(content.help.fieldStateCleared);
    });
  });

  it("shows the email field as cleared when emptied in edit mode", async () => {
    const content = getLeadsFormDictionary("de");

    render(
      <LeadFormDialog
        categories={[
          {
            id: "cat-1",
            label: "Coaches",
            labelKey: "coaches",
          },
        ]}
        content={content}
        editLeadId={EDIT_LEAD.id}
        initialLead={EDIT_LEAD}
        mode="edit"
        open
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    const emailInput = screen.getByPlaceholderText("name@firma.de");
    const emailField = emailInput.closest("label");
    expect(emailField).not.toBeNull();
    expect(emailField).toHaveTextContent(content.help.fieldStateUnchanged);

    fireEvent.change(emailInput, {
      target: { value: "" },
    });

    await waitFor(() => {
      expect(emailField).toHaveTextContent(content.help.fieldStateCleared);
    });
  });

  it("shows a cleared-list empty state after removing the last improvement in edit mode", async () => {
    const content = getLeadsFormDictionary("de");

    render(
      <LeadFormDialog
        categories={[
          {
            id: "cat-1",
            label: "Coaches",
            labelKey: "coaches",
          },
        ]}
        content={content}
        editLeadId={EDIT_LEAD.id}
        initialLead={EDIT_LEAD}
        mode="edit"
        open
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Entfernen" }));

    expect(
      await screen.findByText(content.help.improvementsClearedState),
    ).toBeInTheDocument();
  });
});
