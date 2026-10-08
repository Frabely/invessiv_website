// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { credentialFixture } from "@/common/patterns/testing/credential-fixture";
import { getCrmCredentialsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { CredentialRow } from "./credential-row";

const originalClipboard = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);
const content = getCrmCredentialsDictionary("de");

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  if (originalClipboard)
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  else Reflect.deleteProperty(navigator, "clipboard");
});

function renderRow(
  overrides: Parameters<typeof credentialFixture>[0] = {
    capabilities: { canWrite: false, canReveal: false },
  },
  onPortalVisibilityAction = vi.fn(),
) {
  const credential = credentialFixture(overrides);
  render(
    <ul>
      <CredentialRow
        configured
        content={content}
        credential={credential}
        locale="de"
        onDeleteAction={vi.fn()}
        onEditAction={vi.fn()}
        onPortalVisibilityAction={onPortalVisibilityAction}
        onRevealAction={vi.fn()}
      />
    </ul>,
  );
  return credential;
}

describe("CredentialRow", () => {
  it("renders actions from each entry's capabilities", () => {
    const entry = renderRow();
    expect(screen.getByText(content.secretField.masked)).toBeInTheDocument();
    for (const name of [
      content.secretField.show,
      content.secretField.copy,
      content.row.edit,
      content.row.delete,
    ]) {
      expect(
        screen.queryByRole("button", { name: new RegExp(name) }),
      ).toBeNull();
    }
    expect(
      screen.getByRole("button", {
        name: formatMessage(content.row.copyUsernameNamed, {
          name: entry.title,
        }),
      }),
    ).toBeEnabled();
  });

  it("offers the release, then the withdrawal, and shows the portal badge", () => {
    const open = vi.fn();
    const entry = renderRow({}, open);
    expect(screen.queryByText(content.row.badgePortal)).toBeNull();
    fireEvent.click(
      screen.getByRole("button", {
        name: formatMessage(content.row.releaseNamed, { name: entry.title }),
      }),
    );
    expect(open).toHaveBeenCalledWith(entry);
    cleanup();

    const released = renderRow({ visibleToCustomer: true });
    expect(screen.getByText(content.row.badgePortal)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: formatMessage(content.row.withdrawNamed, {
          name: released.title,
        }),
      }),
    ).toBeEnabled();
  });

  it("marks a customer entry and offers no release action for it", () => {
    renderRow({
      createdBySide: CredentialSide.Customer,
      visibleToCustomer: true,
    });
    expect(screen.getByText(content.row.badgeCustomer)).toBeInTheDocument();
    expect(screen.getByText(content.row.badgePortal)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: new RegExp(content.row.withdraw) }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: new RegExp(content.row.edit, "i") }),
    ).toBeEnabled();
  });

  it.each([false, true])(
    "copies plaintext metadata and resets clipboard feedback (failure: %s)",
    async (fails) => {
      vi.useFakeTimers();
      const writeText = fails
        ? vi.fn().mockRejectedValue(new Error("denied"))
        : vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });
      const entry = renderRow();
      await act(async () =>
        fireEvent.click(
          screen.getByRole("button", {
            name: formatMessage(content.row.copyUsernameNamed, {
              name: entry.title,
            }),
          }),
        ),
      );
      expect(writeText).toHaveBeenCalledExactlyOnceWith(entry.username);
      if (fails)
        expect(screen.getByRole("alert")).toHaveTextContent(
          content.secretField.clipboardFailed,
        );
      else
        expect(
          screen.getByText(content.row.usernameCopied),
        ).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(2000));
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.queryByText(content.row.usernameCopied)).toBeNull();
    },
  );
});
