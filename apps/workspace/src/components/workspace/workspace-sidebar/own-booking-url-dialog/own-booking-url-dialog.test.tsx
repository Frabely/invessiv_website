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
import { getWorkspacePageContent } from "@/i18n/dictionaries/workspace";
import { OwnBookingUrlDialog } from "./own-booking-url-dialog";

const mocks = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn() }));

vi.mock("@/client/access/access-api-service", () => ({
  accessApiService: {
    getOwnBookingUrl: mocks.get,
    updateOwnBookingUrl: mocks.update,
  },
}));

const content = getWorkspacePageContent("de").shell.bookingUrlDialog;
const LINK = "https://cal.com/moritz/onboarding";

function renderDialog() {
  const onClose = vi.fn();
  render(<OwnBookingUrlDialog content={content} onCloseAction={onClose} />);
  return onClose;
}

describe("OwnBookingUrlDialog", () => {
  beforeEach(() => Object.values(mocks).forEach((mock) => mock.mockReset()));
  afterEach(() => cleanup());

  it("loads the own link first and saves it against the loaded version", async () => {
    mocks.get.mockResolvedValue({
      ok: true,
      own: { bookingUrl: LINK, version: 7 },
    });
    mocks.update.mockResolvedValue({
      ok: true,
      own: { bookingUrl: null, version: 8 },
    });
    const onClose = renderDialog();

    expect(screen.getByRole("status")).toHaveTextContent(content.loading);
    const input = await screen.findByLabelText(content.label);
    expect(input).toHaveValue(LINK);

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: content.submit }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.update).toHaveBeenCalledWith({ bookingUrl: null, version: 7 });
  });

  it("offers no field when the link cannot be loaded", async () => {
    mocks.get.mockResolvedValue({
      ok: false,
      code: WorkspaceMemberErrorCode.Internal,
    });
    renderDialog();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.loadError,
    );
    expect(screen.queryByLabelText(content.label)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: content.submit }),
    ).not.toBeInTheDocument();
  });

  it("retries a conflict against the version the server answered with", async () => {
    mocks.get.mockResolvedValue({
      ok: true,
      own: { bookingUrl: null, version: 7 },
    });
    mocks.update
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: { bookingUrl: null, version: 9 },
      })
      .mockResolvedValueOnce({
        ok: true,
        own: { bookingUrl: LINK, version: 10 },
      });
    const onClose = renderDialog();

    fireEvent.change(await screen.findByLabelText(content.label), {
      target: { value: LINK },
    });
    fireEvent.click(screen.getByRole("button", { name: content.submit }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.conflictCurrentEmpty,
    );

    fireEvent.click(screen.getByRole("button", { name: content.submit }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.update).toHaveBeenLastCalledWith({
      bookingUrl: LINK,
      version: 9,
    });
  });
});
