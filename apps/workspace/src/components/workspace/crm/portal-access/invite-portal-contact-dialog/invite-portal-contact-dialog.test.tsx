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
import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import { AuthErrorCode } from "@invessiv/common/constants/auth/auth-error-codes";
import { getCrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import { getSettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { PortalInviteDialog } from "./invite-portal-contact-dialog";

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  invite: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/crm/portal-access-api-service", () => ({
  portalAccessApiService: {
    confirmPreview: mocks.confirm,
    invite: mocks.invite,
  },
}));
type CustomSelectStubProps = {
  id: string;
  onChange: (next: string) => void;
  options: readonly { label: string; value: string }[];
  value: string;
};
type FormFieldStubProps = {
  label: string;
  renderControl: (bindings: {
    describedBy: undefined;
    id: string;
    invalid: boolean;
  }) => React.ReactNode;
};

vi.mock("@invessiv/ui", () => ({
  DialogSize: { Narrow: "narrow" },
  Dialog: ({
    title,
    children,
    footer,
  }: {
    title: string;
    children: React.ReactNode;
    footer: React.ReactNode;
  }) => (
    <section aria-label={title}>
      {children}
      {footer}
    </section>
  ),
  ButtonControl: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  CheckboxControl: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} type="checkbox" />
  ),
  CustomSelect: ({ id, onChange, options, value }: CustomSelectStubProps) => (
    <select
      id={id}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
  FormField: ({ label, renderControl }: FormFieldStubProps) => (
    <label>
      {label}
      {renderControl({
        describedBy: undefined,
        id: "stub-contact",
        invalid: false,
      })}
    </label>
  ),
}));

const access: PortalAccessDto = {
  customerId: "07cee420-c651-44f0-90ea-2943203b8aef",
  customerVersion: 2,
  previewConfirmedAt: null,
  contacts: [
    {
      assignmentId: "ba2d84e8-7e2a-4ebf-919e-6fe12a55ce47",
      displayName: "Alex Contact",
    },
  ],
  roles: [
    {
      id: "f11a2315-dca1-41d0-a17f-3197cd63e176",
      name: "Standard",
      systemKey: "portal_standard",
      active: true,
      permissions: ["portal.access"],
    },
  ],
  invitations: [],
  memberships: [],
};
afterEach(cleanup);

describe("PortalInviteDialog", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.confirm.mockResolvedValue({ ok: true, value: { version: 3 } });
    mocks.invite.mockResolvedValue({
      ok: true,
      value: {
        inviteUrl: "https://example.test/de/portal/invite/secret",
        invitation: { id: "invitation", expiresAt: "2026-10-01" },
      },
    });
  });

  it("requires a preview confirmation before returning the one-time link", async () => {
    render(
      <PortalInviteDialog
        access={access}
        content={getCrmPortalAccessDictionary("de")}
        permissionsContent={getSettingsPermissionsDictionary("de")}
        locale="de"
        initialAssignmentId={access.contacts[0].assignmentId}
        onCloseAction={() => {}}
      />,
    );
    expect(screen.queryByText(/secret/)).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Einladung vorbereiten" }),
    );
    expect(mocks.invite).not.toHaveBeenCalled();
    expect(screen.getByText(/Preise, Budgets/)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Vorschau bestätigen und einladen" }),
    );
    await waitFor(() => expect(mocks.invite).toHaveBeenCalledTimes(1));
    expect(mocks.confirm).toHaveBeenCalledWith(access.customerId, {
      version: 2,
    });
    expect(
      screen.getByText("https://example.test/de/portal/invite/secret"),
    ).toBeInTheDocument();
  });

  it("explains that a contact with active access cannot be invited again", async () => {
    mocks.invite.mockResolvedValue({
      ok: false,
      code: PortalAccessErrorCode.MembershipAlreadyActive,
    });
    render(
      <PortalInviteDialog
        access={{ ...access, previewConfirmedAt: "2026-09-24T12:00:00.000Z" }}
        content={getCrmPortalAccessDictionary("de")}
        permissionsContent={getSettingsPermissionsDictionary("de")}
        locale="de"
        initialAssignmentId={access.contacts[0].assignmentId}
        onCloseAction={() => {}}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Einmal-Link erstellen" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Dieser Kontakt hat bereits Portalzugang. Ändere seine Rollen in der Kundenakte oder widerrufe dort den Zugang.",
    );
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("shows an authorization error returned by the API", async () => {
    mocks.invite.mockResolvedValue({
      ok: false,
      code: AuthErrorCode.Forbidden,
    });
    render(
      <PortalInviteDialog
        access={{ ...access, previewConfirmedAt: "2026-09-24T12:00:00.000Z" }}
        content={getCrmPortalAccessDictionary("de")}
        permissionsContent={getSettingsPermissionsDictionary("de")}
        locale="de"
        initialAssignmentId={access.contacts[0].assignmentId}
        onCloseAction={() => {}}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Einmal-Link erstellen" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Du hast keine Berechtigung mehr",
    );
  });
});
