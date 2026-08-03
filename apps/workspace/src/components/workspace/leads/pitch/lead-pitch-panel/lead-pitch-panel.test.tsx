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
import { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { ProfileBridgeErrorCode } from "@invessiv/common/constants/leads/outreach/profile-bridge-error-codes";
import { ProfileBridgeMessageType } from "@invessiv/common/constants/leads/outreach/profile-bridge-message-types";
import { ProfileSnapshotSource } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";
import { LeadSocialPlatform } from "@invessiv/common/constants/leads/social/lead-social-platforms";
import { LeadPitchPanelVariant } from "@/common/constants/leads/pitch/lead-pitch-panel-variants";
import { getLeadsPitchDictionary } from "@/i18n/dictionaries/workspace/leads";
import { LeadPitchQueueProvider } from "../lead-pitch-queue-provider/lead-pitch-queue-provider";
import { LeadPitchPanel } from "./lead-pitch-panel";

const {
  captureProfileMock,
  isAvailableMock,
  generatePitchMock,
  getLatestMock,
  markContactedMock,
  copyMock,
} = vi.hoisted(() => ({
  captureProfileMock: vi.fn(),
  isAvailableMock: vi.fn(),
  generatePitchMock: vi.fn(),
  getLatestMock: vi.fn(),
  markContactedMock: vi.fn(),
  copyMock: vi.fn(),
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
  leadStatusClientService: { markContacted: markContactedMock },
}));

vi.mock("@/client/leads/outreach/lead-outreach-clipboard-service", () => ({
  copyTextToClipboard: copyMock,
}));

const content = getLeadsPitchDictionary("de");
const INSTAGRAM_BODY = `Pitch für ${PitchChannel.Instagram}`;

const LEAD = {
  id: "lead-1",
  socialProfiles: [
    {
      id: "sp-1",
      platform: LeadSocialPlatform.Instagram,
      profileUrl: "https://www.instagram.com/kanzlei/",
      normalizedUrl: "instagram.com/kanzlei",
    },
  ],
};

function makeDraft(channel: PitchChannel, body: string) {
  return {
    id: `draft-${channel}`,
    leadId: "lead-1",
    channel,
    audience: "team" as const,
    salutationName: "Kanzlei-Team",
    icebreaker: "Icebreaker",
    body,
    charCount: body.length,
    model: "gpt-4.1-mini",
    profileSource: ProfileSnapshotSource.BridgeApi,
    profileCapturedAt: null,
    createdAt: "2026-07-26T09:31:00.000Z",
  };
}

function renderPanel(onContacted?: () => void) {
  return render(
    <LeadPitchQueueProvider>
      <LeadPitchPanel
        content={content}
        lead={LEAD}
        onContactedAction={onContacted}
        variant={LeadPitchPanelVariant.Compact}
      />
    </LeadPitchQueueProvider>,
  );
}

function clickButton(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name }));
}

// Der Generieren-Button bleibt deaktiviert, bis die Provider-Prüfung
// aufgelöst ist — ohne dieses Warten liefe der Klick ins Leere.
async function clickGenerate() {
  const button = screen.getByRole("button", {
    name: new RegExp(content.buttons.generate),
  });

  await waitFor(() => {
    expect(button).toBeEnabled();
  });

  fireEvent.click(button);
}

async function generateAndWait() {
  await clickGenerate();
  await waitFor(() => {
    expect(screen.getByText(INSTAGRAM_BODY)).toBeInTheDocument();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  isAvailableMock.mockResolvedValue(true);
  getLatestMock.mockResolvedValue(null);
  copyMock.mockResolvedValue(undefined);
  markContactedMock.mockResolvedValue({
    ok: true,
    leadStatus: "contacted",
    changed: true,
  });
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
  generatePitchMock.mockImplementation(async ({ channel }) => ({
    ok: true,
    draft: makeDraft(channel, `Pitch für ${channel}`),
  }));
});

afterEach(() => {
  cleanup();
});

describe("LeadPitchPanel", () => {
  it("defaults to the channel the lead has a profile for", () => {
    renderPanel();

    expect(
      screen.getByRole("button", { name: content.channel.labels.instagram }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("generates a pitch and reports its length on the meter", async () => {
    renderPanel();

    await generateAndWait();

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      String(INSTAGRAM_BODY.length),
    );
  });

  it("keeps a separate draft per channel", async () => {
    renderPanel();

    await generateAndWait();
    clickButton(content.channel.labels.linkedin);

    expect(screen.queryByText(INSTAGRAM_BODY)).not.toBeInTheDocument();
    expect(
      screen.getByText(content.channel.missingProfile),
    ).toBeInTheDocument();
  });

  it("copies the pitch and marks the lead as contacted in one action", async () => {
    const onContacted = vi.fn();
    renderPanel(onContacted);

    await generateAndWait();
    clickButton(content.buttons.copyAndContact);

    await waitFor(() => {
      expect(markContactedMock).toHaveBeenCalledWith("lead-1");
    });
    expect(copyMock).toHaveBeenCalledWith(INSTAGRAM_BODY);
    expect(onContacted).toHaveBeenCalledTimes(1);
  });

  it("offers the paste fallback when the bridge cannot read the profile", async () => {
    captureProfileMock.mockResolvedValue({
      ok: false,
      code: ProfileBridgeErrorCode.ProfilePrivate,
    });
    renderPanel();

    await clickGenerate();
    await waitFor(() => {
      expect(
        screen.getByText(content.errors.PROFILE_PRIVATE),
      ).toBeInTheDocument();
    });

    clickButton(content.paste.title);
    fireEvent.change(screen.getByLabelText(content.paste.title), {
      target: {
        value:
          "Bio: Wir begleiten Handwerksbetriebe bei der digitalen Buchhaltung im Raum Kassel.",
      },
    });
    clickButton(content.paste.submit);

    await waitFor(() => {
      expect(generatePitchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          snapshot: expect.objectContaining({
            source: ProfileSnapshotSource.ManualPaste,
          }),
        }),
      );
    });
  });

  it("rejects a paste that is too short to build an icebreaker from", async () => {
    captureProfileMock.mockResolvedValue({
      ok: false,
      code: ProfileBridgeErrorCode.ProfilePrivate,
    });
    renderPanel();

    await clickGenerate();
    await waitFor(() => {
      expect(
        screen.getByText(content.errors.PROFILE_PRIVATE),
      ).toBeInTheDocument();
    });

    clickButton(content.paste.title);
    fireEvent.change(screen.getByLabelText(content.paste.title), {
      target: { value: "zu kurz" },
    });
    clickButton(content.paste.submit);

    expect(screen.getByText(content.paste.tooShort)).toBeInTheDocument();
    expect(generatePitchMock).not.toHaveBeenCalled();
  });
});
