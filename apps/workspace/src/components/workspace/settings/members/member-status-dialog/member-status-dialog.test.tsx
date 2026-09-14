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
import { OwnableEntity } from "@invessiv/common/constants/crm/ownable-entities";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { getSettingsMembersDictionary } from "@/i18n/dictionaries/workspace/settings";
import { MemberStatusDialog } from "./member-status-dialog";

const mocks = vi.hoisted(() => ({ refresh: vi.fn(), updateStatus: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/access/access-api-service", () => ({
  accessApiService: { updateMemberStatus: mocks.updateStatus },
}));

const content = getSettingsMembersDictionary("de");
const MEMBER: WorkspaceMemberDto = {
  id: "member-1",
  userId: "user-1",
  displayName: "Anna Beispiel",
  primaryEmail: "anna@example.test",
  active: true,
  isOwner: false,
  hasActiveRole: true,
  roles: [],
  version: 2,
  createdAt: "2026-09-13T10:00:00.000Z",
};

describe("MemberStatusDialog", () => {
  beforeEach(() => Object.values(mocks).forEach((mock) => mock.mockReset()));
  afterEach(() => cleanup());

  it("deactivates and refreshes after success", async () => {
    mocks.updateStatus.mockResolvedValue({
      ok: true,
      member: { ...MEMBER, active: false, version: 3 },
    });
    const onClose = vi.fn();
    render(
      <MemberStatusDialog
        content={content}
        member={MEMBER}
        onCloseAction={onClose}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: content.statusDialog.deactivateSubmit,
      }),
    );

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.updateStatus).toHaveBeenCalledWith(MEMBER.id, {
      active: false,
      version: 2,
    });
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("keeps the intent and retries a version conflict with the fresh version", async () => {
    mocks.updateStatus
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: { ...MEMBER, version: 5 },
      })
      .mockResolvedValueOnce({
        ok: true,
        member: { ...MEMBER, active: false, version: 6 },
      });
    render(
      <MemberStatusDialog
        content={content}
        member={MEMBER}
        onCloseAction={vi.fn()}
      />,
    );

    const submit = screen.getByRole("button", {
      name: content.statusDialog.deactivateSubmit,
    });
    fireEvent.click(submit);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.statusDialog.conflict,
    );
    fireEvent.click(submit);

    await waitFor(() =>
      expect(mocks.updateStatus).toHaveBeenLastCalledWith(MEMBER.id, {
        active: false,
        version: 5,
      }),
    );
  });

  it("explains open responsibilities and disables the retry", async () => {
    mocks.updateStatus.mockResolvedValue({
      ok: false,
      code: WorkspaceMemberErrorCode.MemberHasOpenResponsibilities,
      responsibilityCounts: { [OwnableEntity.Customer]: 2 },
    });
    render(
      <MemberStatusDialog
        content={content}
        member={MEMBER}
        onCloseAction={vi.fn()}
      />,
    );

    const submit = screen.getByRole("button", {
      name: content.statusDialog.deactivateSubmit,
    });
    fireEvent.click(submit);

    expect(await screen.findByRole("alert")).toHaveTextContent("2");
    expect(submit).toBeDisabled();
    expect(screen.queryByText(/übergeben/i)).not.toBeInTheDocument();
  });
});
