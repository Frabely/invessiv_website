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

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { getSettingsMembersDictionary } from "@/i18n/dictionaries/workspace/settings";
import { MemberBookingUrlDialog } from "./member-booking-url-dialog";

const mocks = vi.hoisted(() => ({ refresh: vi.fn(), update: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/access/access-api-service", () => ({
  accessApiService: { updateMemberBookingUrl: mocks.update },
}));

const content = getSettingsMembersDictionary("de");
const text = content.bookingUrlDialog;
const LINK = "https://calendly.com/anna/onboarding";
const MEMBER: WorkspaceMemberDto = {
  id: "member-1",
  userId: "user-1",
  displayName: "Anna Beispiel",
  primaryEmail: "anna@example.test",
  active: true,
  isOwner: false,
  hasActiveRole: true,
  accessScopeCount: 0,
  bookingUrl: null,
  roles: [],
  version: 2,
  createdAt: "2026-09-13T10:00:00.000Z",
};

function renderDialog(member: WorkspaceMemberDto = MEMBER) {
  const onClose = vi.fn();
  render(
    <MemberBookingUrlDialog
      content={content}
      member={member}
      onCloseAction={onClose}
    />,
  );
  return {
    onClose,
    input: screen.getByLabelText(text.label),
    save: () =>
      fireEvent.click(screen.getByRole("button", { name: text.submit })),
  };
}

describe("MemberBookingUrlDialog", () => {
  beforeEach(() => Object.values(mocks).forEach((mock) => mock.mockReset()));
  afterEach(() => cleanup());

  it("names the member and saves the normalized link with the member's version", async () => {
    mocks.update.mockResolvedValue({ ok: true, member: MEMBER });
    const { input, onClose, save } = renderDialog();

    expect(
      screen.getByRole("heading", { name: "Buchungslink von Anna Beispiel" }),
    ).toBeInTheDocument();
    fireEvent.change(input, { target: { value: ` ${LINK} ` } });
    save();

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.update).toHaveBeenCalledWith(MEMBER.id, {
      bookingUrl: LINK,
      version: 2,
    });
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("names a link without https at the field and sends nothing", async () => {
    const { input, onClose, save } = renderDialog();

    fireEvent.change(input, { target: { value: "http://calendly.com/anna" } });
    save();

    expect(await screen.findByText(text.issues.not_https)).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(mocks.update).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("clears the stored link when the field is emptied", async () => {
    mocks.update.mockResolvedValue({ ok: true, member: MEMBER });
    const { input, onClose, save } = renderDialog({
      ...MEMBER,
      bookingUrl: LINK,
    });

    expect(input).toHaveValue(LINK);
    fireEvent.change(input, { target: { value: "" } });
    save();

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.update).toHaveBeenCalledWith(MEMBER.id, {
      bookingUrl: null,
      version: 2,
    });
  });

  it("keeps the input on a conflict, shows the stored link and retries against the current version", async () => {
    mocks.update
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: {
          ...MEMBER,
          bookingUrl: "https://cal.com/anna",
          version: 5,
        },
      })
      .mockResolvedValueOnce({ ok: true, member: MEMBER });
    const { input, onClose, save } = renderDialog();

    fireEvent.change(input, { target: { value: LINK } });
    save();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(text.conflict);
    expect(alert).toHaveTextContent("https://cal.com/anna");
    expect(input).toHaveValue(LINK);
    expect(onClose).not.toHaveBeenCalled();

    save();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.update).toHaveBeenLastCalledWith(MEMBER.id, {
      bookingUrl: LINK,
      version: 5,
    });
  });

  it("reports a failed save and stays open", async () => {
    mocks.update.mockResolvedValue({
      ok: false,
      code: WorkspaceMemberErrorCode.Internal,
    });
    const { input, onClose, save } = renderDialog();

    fireEvent.change(input, { target: { value: LINK } });
    save();

    expect(await screen.findByRole("alert")).toHaveTextContent(text.error);
    expect(onClose).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
