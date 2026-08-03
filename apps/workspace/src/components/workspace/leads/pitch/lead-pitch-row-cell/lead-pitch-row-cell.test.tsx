// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { ProfileBridgeErrorCode } from "@invessiv/common/constants/leads/outreach/profile-bridge-error-codes";
import { ProfileBridgeMessageType } from "@invessiv/common/constants/leads/outreach/profile-bridge-message-types";
import { ProfileSnapshotSource } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";
import { LeadSocialPlatform } from "@invessiv/common/constants/leads/social/lead-social-platforms";
import type { LeadLatestPitchDto } from "@invessiv/common/contracts/leads/outreach/lead-latest-pitch.dto";
import { getLeadsPitchDictionary } from "@/i18n/dictionaries/workspace/leads";
import { LeadPitchQueueProvider } from "../lead-pitch-queue-provider/lead-pitch-queue-provider";
import { LeadPitchRowCell } from "./lead-pitch-row-cell";

const {
  captureProfileMock,
  isAvailableMock,
  generatePitchMock,
  getLatestMock,
} = vi.hoisted(() => ({
  captureProfileMock: vi.fn(),
  isAvailableMock: vi.fn(),
  generatePitchMock: vi.fn(),
  getLatestMock: vi.fn(),
}));

vi.mock("@/client/leads/outreach/profile-bridge-client-service", () => ({
  profileBridgeClientService: {
    captureProfile: captureProfileMock,
    isAvailable: isAvailableMock,
  },
}));

vi.mock("@/client/leads/outreach/lead-pitch-client-service", () => ({
  leadPitchClientService: {
    generatePitch: generatePitchMock,
    getLatestPitch: getLatestMock,
  },
}));

vi.mock(
  "@/client/leads/outreach/lead-outreach-provider-status-service",
  () => ({
    outreachProviderStatusService: {
      checkOutreachProviders: vi
        .fn()
        .mockResolvedValue({ openai: true, openaiModel: "gpt-4.1-mini" }),
    },
  }),
);

vi.mock("@/client/leads/lead-status-client-service", () => ({
  leadStatusClientService: { markContacted: vi.fn() },
}));

vi.mock("@/client/leads/outreach/lead-outreach-clipboard-service", () => ({
  copyTextToClipboard: vi.fn(),
}));

const content = getLeadsPitchDictionary("de");

function renderCell(latestPitch: LeadLatestPitchDto | null = null) {
  return render(
    <LeadPitchQueueProvider>
      <table>
        <tbody>
          <tr>
            <LeadPitchRowCell
              content={content}
              lead={{
                id: "lead-1",
                latestPitch,
                socialProfiles: [
                  {
                    id: "sp-1",
                    platform: LeadSocialPlatform.Instagram,
                    profileUrl: "https://www.instagram.com/kanzlei/",
                    normalizedUrl: "instagram.com/kanzlei",
                  },
                ],
              }}
            />
          </tr>
        </tbody>
      </table>
    </LeadPitchQueueProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  isAvailableMock.mockResolvedValue(true);
  getLatestMock.mockResolvedValue(null);
  captureProfileMock.mockResolvedValue({
    ok: true,
    type: ProfileBridgeMessageType.CaptureProfile,
    snapshot: {
      platform: PitchChannel.Instagram,
      source: ProfileSnapshotSource.BridgeApi,
      handle: "kanzlei",
      displayName: "Kanzlei",
      biography: "Digitale Buchhaltung für Handwerksbetriebe.",
      headline: null,
      category: null,
      followerCount: 100,
      isVerified: false,
      posts: [],
      capturedAt: "2026-07-26T09:30:00.000Z",
    },
  });
  generatePitchMock.mockResolvedValue({
    ok: true,
    draft: {
      id: "draft-1",
      leadId: "lead-1",
      channel: PitchChannel.Instagram,
      audience: "team",
      salutationName: "Kanzlei-Team",
      icebreaker: "Icebreaker",
      body: "Fertiger Pitch",
      charCount: 14,
      model: "gpt-4.1-mini",
      profileSource: ProfileSnapshotSource.BridgeApi,
      profileCapturedAt: null,
      createdAt: "2026-07-26T09:31:00.000Z",
    },
  });
});

afterEach(() => {
  cleanup();
});

describe("LeadPitchRowCell", () => {
  it("invites generation when the lead has no draft yet", () => {
    renderCell();

    expect(
      screen.getByRole("button", { name: content.buttons.generate }),
    ).toHaveAttribute("data-state", "idle");
  });

  it("reports a stored draft as ready without opening the popover", () => {
    renderCell({
      channel: PitchChannel.Instagram,
      charCount: 820,
      createdAt: "2026-07-26T09:31:00.000Z",
    });

    expect(
      screen.getByRole("button", { name: content.states.ready }),
    ).toHaveAttribute("data-state", "ready");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens and closes the popover with Escape and returns focus", () => {
    renderCell();

    const trigger = screen.getByRole("button", {
      name: content.buttons.generate,
    });
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: content.label });
    expect(dialog).toBeInTheDocument();

    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("switches to the error state when the bridge fails", async () => {
    captureProfileMock.mockResolvedValue({
      ok: false,
      code: ProfileBridgeErrorCode.BridgeMissing,
    });
    renderCell();

    fireEvent.click(
      screen.getByRole("button", { name: content.buttons.generate }),
    );

    const dialog = screen.getByRole("dialog", { name: content.label });
    const generateButton = within(dialog).getByRole("button", {
      name: content.buttons.generate,
    });
    await waitFor(() => {
      expect(generateButton).toBeEnabled();
    });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          expanded: true,
          name: content.states.error,
        }),
      ).toHaveAttribute("data-state", "error");
    });
  });
});
