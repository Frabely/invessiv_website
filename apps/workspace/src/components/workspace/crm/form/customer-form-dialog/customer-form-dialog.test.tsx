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

import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { CustomerContactAssignmentDto } from "@invessiv/common/contracts/crm/customer-contact.dto";
import { getCrmFormDictionary } from "@/i18n/dictionaries/workspace/crm";
import { customerDetailFixture } from "@/server/tests/workspace/crm/support/crm-fixtures";
import { CustomerFormDialog } from "./customer-form-dialog";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, replace: mocks.replace }),
}));
vi.mock("@/client/crm/customers-api-service", () => ({
  customersApiService: {
    createCustomer: mocks.createCustomer,
    updateCustomer: mocks.updateCustomer,
  },
}));

const content = getCrmFormDictionary("de");
const CATEGORIES = [{ id: "category-1", label: "Coaches" }];

function customerContactFixture(
  overrides: Partial<CustomerContactAssignmentDto> = {},
): CustomerContactAssignmentDto {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    personId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    displayName: "Anna Berger",
    firstName: "Anna",
    lastName: "Berger",
    primaryEmail: "anna@nordlicht.example",
    primaryPhone: null,
    businessEmail: null,
    businessPhone: null,
    roleLabel: "Geschäftsführung",
    isPrimary: true,
    preferredLocale: "de",
    assignmentVersion: 1,
    personVersion: 1,
    createdAt: "2026-09-14T10:00:00.000Z",
    updatedAt: "2026-09-14T10:00:00.000Z",
    ...overrides,
  };
}

function renderDialog(
  customer = null as ReturnType<typeof customerDetailFixture> | null,
) {
  return render(
    <CustomerFormDialog
      categories={CATEGORIES}
      closeHref="/de/crm"
      content={content}
      customer={customer}
      locale="de"
    />,
  );
}

function input(label: RegExp) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function submit(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function selectTab(name: string) {
  fireEvent.click(screen.getByRole("tab", { name }));
}

describe("CustomerFormDialog", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  afterEach(() => {
    cleanup();
  });

  it("shows field errors for an empty form without calling the API", async () => {
    renderDialog();

    submit(content.buttons.submitCreate);

    expect(
      await screen.findByText(content.validation.displayNameRequired),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: content.sections.contact }),
    ).toHaveAttribute("data-invalid", "true");
    selectTab(content.sections.contact);
    expect(
      screen.getByText(content.validation.contactLastNameRequired),
    ).toBeVisible();
    expect(input(/^Anzeigename/)).toHaveAttribute("aria-invalid", "true");
    expect(input(/^Anzeigename/).getAttribute("aria-describedby")).toContain(
      "customer-display-name-error",
    );
    expect(mocks.createCustomer).not.toHaveBeenCalled();
  });

  it("reports an invalid website and hourly rate", async () => {
    renderDialog();
    fireEvent.change(input(/^Anzeigename/), { target: { value: "Kluge Bau" } });
    fireEvent.change(input(/^Nachname/), { target: { value: "Kluge" } });
    fireEvent.change(input(/^E-Mail/), {
      target: { value: "kontakt@kluge.example" },
    });
    fireEvent.change(input(/^Website/), { target: { value: "kluge.example" } });
    fireEvent.change(input(/^Stundensatz/), { target: { value: "12,345" } });

    submit(content.buttons.submitCreate);

    expect(
      screen.getByRole("tab", { name: content.sections.details }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      await screen.findByText(content.validation.urlInvalid),
    ).toBeInTheDocument();
    expect(
      screen.getByText(content.validation.hourlyRateInvalid),
    ).toBeInTheDocument();
  });

  it("always offers an optional company name", () => {
    renderDialog();

    expect(input(/^Firmenname/)).toBeInTheDocument();
  });

  it("uses the custom select for the customer category", () => {
    renderDialog();

    expect(
      screen.getByRole("button", { name: content.fields.category }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: content.fields.category }),
    ).not.toBeInTheDocument();
  });

  it("moves between form sections with the arrow keys", () => {
    renderDialog();

    const customerTab = screen.getByRole("tab", {
      name: content.sections.customer,
    });
    fireEvent.keyDown(customerTab, { key: "ArrowRight" });

    expect(
      screen.getByRole("tab", { name: content.sections.contact }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("creates the customer, refreshes and closes the dialog", async () => {
    mocks.createCustomer.mockResolvedValue({
      ok: true,
      customer: customerDetailFixture(),
    });
    renderDialog();
    fireEvent.change(input(/^Anzeigename/), {
      target: { value: " Kluge Bau " },
    });
    fireEvent.change(input(/^Nachname/), { target: { value: "Kluge" } });
    fireEvent.change(input(/^E-Mail/), {
      target: { value: "kontakt@kluge.example" },
    });
    fireEvent.change(input(/^Stundensatz/), { target: { value: "80,50" } });

    submit(content.buttons.submitCreate);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalled());
    expect(mocks.createCustomer).toHaveBeenCalledTimes(1);
    expect(mocks.createCustomer.mock.calls[0][0]).toMatchObject({
      displayName: "Kluge Bau",
      defaultHourlyRateCents: 8050,
      primaryContact: { lastName: "Kluge", preferredLocale: "de" },
    });
    expect(mocks.refresh).toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith("/de/crm", { scroll: false });
  });

  it("explains a taken display name at the field", async () => {
    mocks.createCustomer.mockResolvedValue({
      ok: false,
      code: CustomerErrorCode.DisplayNameTaken,
    });
    renderDialog();
    fireEvent.change(input(/^Anzeigename/), { target: { value: "Kluge Bau" } });
    fireEvent.change(input(/^Nachname/), { target: { value: "Kluge" } });
    fireEvent.change(input(/^E-Mail/), {
      target: { value: "kontakt@kluge.example" },
    });

    submit(content.buttons.submitCreate);

    expect(
      await screen.findByText(content.validation.displayNameTaken),
    ).toBeInTheDocument();
    expect(input(/^Anzeigename/)).toHaveAttribute("aria-invalid", "true");
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("shows a server failure as status line", async () => {
    mocks.createCustomer.mockResolvedValue({
      ok: false,
      code: CustomerErrorCode.Internal,
    });
    renderDialog();
    fireEvent.change(input(/^Anzeigename/), { target: { value: "Kluge Bau" } });
    fireEvent.change(input(/^Nachname/), { target: { value: "Kluge" } });
    fireEvent.change(input(/^E-Mail/), {
      target: { value: "kontakt@kluge.example" },
    });

    submit(content.buttons.submitCreate);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors.INTERNAL,
    );
  });

  it("prefills the edit form, offers contacts and keeps input on a conflict", async () => {
    const customer = customerDetailFixture({ version: 2 });
    mocks.updateCustomer
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: customerDetailFixture({
          displayName: "Nordlicht GmbH",
          version: 3,
        }),
      })
      .mockResolvedValueOnce({ ok: true, customer });
    renderDialog(customer);

    expect(input(/^Anzeigename/)).toHaveValue("Nordlicht Coaching");
    selectTab(content.sections.additionalContact);
    expect(
      screen.getByRole("button", { name: /Ansprechpartner hinzufügen/ }),
    ).toBeInTheDocument();

    selectTab(content.sections.address);
    fireEvent.change(input(/^Ort/), { target: { value: "Bonn" } });
    submit(content.buttons.submitEdit);

    expect(
      await screen.findByText(content.conflict.message),
    ).toBeInTheDocument();
    expect(input(/^Ort/)).toHaveValue("Bonn");
    expect(mocks.updateCustomer.mock.calls[0][1]).toMatchObject({
      city: "Bonn",
      version: 2,
    });

    submit(content.buttons.submitEdit);

    await waitFor(() => expect(mocks.updateCustomer).toHaveBeenCalledTimes(2));
    expect(mocks.updateCustomer.mock.calls[1][1]).toMatchObject({
      city: "Bonn",
      version: 3,
    });
  });

  it("keeps a secondary contact locally until the customer form is saved", async () => {
    const customer = customerDetailFixture({ version: 2 });
    mocks.updateCustomer.mockResolvedValue({ ok: true, customer });
    renderDialog(customer);

    selectTab(content.sections.additionalContact);
    fireEvent.click(
      screen.getByRole("button", { name: /Ansprechpartner hinzufügen/ }),
    );
    fireEvent.change(input(/^Nachname/), { target: { value: "Kluge" } });
    fireEvent.change(input(/^E-Mail/), {
      target: { value: "kontakt@kluge.example" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: content.buttons.confirmContact }),
    );
    submit(content.buttons.submitEdit);
    await waitFor(() => expect(mocks.updateCustomer).toHaveBeenCalled());
    expect(mocks.updateCustomer.mock.calls[0][1]).toMatchObject({
      contacts: [
        expect.objectContaining({ lastName: "Kluge", preferredLocale: "de" }),
      ],
    });
  });

  it("lets a secondary contact become the primary contact", async () => {
    const customer = customerDetailFixture({
      contacts: [
        customerContactFixture(),
        customerContactFixture({
          id: "22222222-2222-4222-8222-222222222222",
          personId: "33333333-3333-4333-8333-333333333333",
          firstName: "Mara",
          lastName: "Kluge",
          displayName: "Mara Kluge",
          isPrimary: false,
        }),
      ],
    });
    mocks.updateCustomer.mockResolvedValue({ ok: true, customer });
    renderDialog(customer);

    selectTab(content.sections.additionalContact);
    fireEvent.click(
      screen.getByRole("button", { name: content.buttons.makePrimary }),
    );
    submit(content.buttons.submitEdit);

    await waitFor(() => expect(mocks.updateCustomer).toHaveBeenCalled());
    expect(mocks.updateCustomer.mock.calls[0][1]).toMatchObject({
      contacts: [
        expect.objectContaining({
          id: customer.contacts[0]?.id,
          isPrimary: false,
        }),
        expect.objectContaining({
          id: customer.contacts[1]?.id,
          isPrimary: true,
        }),
      ],
    });
  });

  it("preserves the primary designation while editing that contact", async () => {
    const customer = customerDetailFixture({
      version: 2,
      contacts: [customerContactFixture()],
    });
    mocks.updateCustomer.mockResolvedValue({ ok: true, customer });
    renderDialog(customer);

    selectTab(content.sections.additionalContact);
    fireEvent.click(screen.getByRole("button", { name: content.buttons.edit }));
    fireEvent.change(input(/^Nachname/), { target: { value: "Neu" } });
    fireEvent.click(
      screen.getByRole("button", { name: content.buttons.confirmContact }),
    );
    submit(content.buttons.submitEdit);

    await waitFor(() => expect(mocks.updateCustomer).toHaveBeenCalled());
    expect(mocks.updateCustomer.mock.calls[0][1]).toMatchObject({
      contacts: [expect.objectContaining({ isPrimary: true, lastName: "Neu" })],
    });
  });
});
