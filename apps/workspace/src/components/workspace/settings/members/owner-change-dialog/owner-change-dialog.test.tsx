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

import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { getSettingsMembersDictionary } from "@/i18n/dictionaries/workspace/settings";
import { OwnerChangeDialog } from "./owner-change-dialog";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  grantOwner: vi.fn(),
  revokeOwner: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/access/access-api-service", () => ({
  accessApiService: {
    grantOwner: mocks.grantOwner,
    revokeOwner: mocks.revokeOwner,
  },
}));

const content = getSettingsMembersDictionary("de");
const MEMBER: WorkspaceMemberDto = {
  id: "member-1",
  userId: "user-1",
  displayName: "Anna Beispiel",
  primaryEmail: "anna@example.test",
  active: true,
  isOwner: false,
  roles: [],
  version: 2,
  createdAt: "2026-09-13T10:00:00.000Z",
};

describe("OwnerChangeDialog", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  afterEach(() => cleanup());

  it("grants ownership and closes after success", async () => {
    mocks.grantOwner.mockResolvedValue({
      ok: true,
      member: { ...MEMBER, isOwner: true, version: 3 },
    });
    const onClose = vi.fn();
    render(
      <OwnerChangeDialog
        content={content}
        member={MEMBER}
        onCloseAction={onClose}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: content.ownerDialog.grantSubmit }),
    );

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.grantOwner).toHaveBeenCalledWith(MEMBER.id, { version: 2 });
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("uses the fresh state after a conflict before retrying", async () => {
    mocks.grantOwner.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: { ...MEMBER, isOwner: true, version: 5 },
    });
    mocks.revokeOwner.mockResolvedValue({
      ok: true,
      member: { ...MEMBER, version: 6 },
    });
    render(
      <OwnerChangeDialog
        content={content}
        member={MEMBER}
        onCloseAction={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: content.ownerDialog.grantSubmit }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.ownerDialog.conflict,
    );

    fireEvent.click(
      screen.getByRole("button", { name: content.ownerDialog.revokeSubmit }),
    );
    await waitFor(() =>
      expect(mocks.revokeOwner).toHaveBeenCalledWith(MEMBER.id, { version: 5 }),
    );
  });
});
