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
import { LeadPitchErrorCode } from "@invessiv/common/constants/leads/outreach/lead-pitch-error-codes";
import { ProfileBridgeErrorCode } from "@invessiv/common/constants/leads/outreach/profile-bridge-error-codes";
import { ProfileBridgeMessageType } from "@invessiv/common/constants/leads/outreach/profile-bridge-message-types";
import { ProfileSnapshotSource } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";
import { LeadPitchJobState } from "@/common/constants/leads/pitch/lead-pitch-job-states";
import {
  LeadPitchQueueProvider,
  useLeadPitchQueue,
} from "./lead-pitch-queue-provider";

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

const SNAPSHOT = {
  platform: PitchChannel.Instagram,
  source: ProfileSnapshotSource.BridgeApi,
  handle: "kanzlei",
  displayName: "Kanzlei",
  biography: "Digitale Buchhaltung für Handwerksbetriebe in Kassel.",
  headline: null,
  category: null,
  followerCount: 100,
  isVerified: false,
  posts: [],
  capturedAt: "2026-07-26T09:30:00.000Z",
};

function makeDraft(leadId: string) {
  return {
    id: `draft-${leadId}`,
    leadId,
    channel: PitchChannel.Instagram,
    audience: "team" as const,
    salutationName: "Kanzlei-Team",
    icebreaker: "Icebreaker",
    body: `Body für ${leadId}`,
    charCount: 20,
    model: "gpt-4.1-mini",
    profileSource: ProfileSnapshotSource.BridgeApi,
    profileCapturedAt: "2026-07-26T09:30:00.000Z",
    createdAt: "2026-07-26T09:31:00.000Z",
  };
}

function Probe({ leadId }: { leadId: string }) {
  const queue = useLeadPitchQueue();
  const job = queue.getJob(leadId, PitchChannel.Instagram);

  return (
    <div>
      <span data-testid={`state-${leadId}`}>{job.state}</span>
      <span data-testid={`body-${leadId}`}>{job.body}</span>
      <span data-testid={`error-${leadId}`}>{job.errorCode ?? ""}</span>
      <button
        data-testid={`enqueue-${leadId}`}
        onClick={() => queue.enqueue(target(leadId))}
        type="button"
      >
        enqueue
      </button>
      <button
        data-testid={`paste-${leadId}`}
        onClick={() =>
          queue.generateFromSnapshot(target(leadId), {
            ...SNAPSHOT,
            source: ProfileSnapshotSource.ManualPaste,
          })
        }
        type="button"
      >
        paste
      </button>
      <button
        data-testid={`load-${leadId}`}
        onClick={() => queue.loadLatest(leadId, PitchChannel.Instagram)}
        type="button"
      >
        load
      </button>
    </div>
  );
}

function click(testId: string) {
  fireEvent.click(screen.getByTestId(testId));
}

function renderProvider(leadIds: string[]) {
  return render(
    <LeadPitchQueueProvider>
      {leadIds.map((leadId) => (
        <Probe key={leadId} leadId={leadId} />
      ))}
    </LeadPitchQueueProvider>,
  );
}

function target(leadId: string) {
  return {
    leadId,
    channel: PitchChannel.Instagram,
    handle: "kanzlei",
    profileUrl: "https://www.instagram.com/kanzlei/",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  isAvailableMock.mockResolvedValue(true);
  getLatestMock.mockResolvedValue(null);
  captureProfileMock.mockResolvedValue({
    ok: true,
    type: ProfileBridgeMessageType.CaptureProfile,
    snapshot: SNAPSHOT,
  });
  generatePitchMock.mockImplementation(async ({ leadId }) => ({
    ok: true,
    draft: makeDraft(leadId),
  }));
});

afterEach(() => {
  cleanup();
});

describe("LeadPitchQueueProvider", () => {
  it("captures the profile and stores the generated draft", async () => {
    renderProvider(["lead-1"]);

    click("enqueue-lead-1");

    await waitFor(() => {
      expect(screen.getByTestId("state-lead-1")).toHaveTextContent(
        LeadPitchJobState.Ready,
      );
    });

    expect(screen.getByTestId("body-lead-1")).toHaveTextContent(
      "Body für lead-1",
    );
    expect(captureProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({ platform: PitchChannel.Instagram }),
    );
  });

  it("surfaces a bridge failure without calling the generator", async () => {
    captureProfileMock.mockResolvedValue({
      ok: false,
      code: ProfileBridgeErrorCode.TabNotOpen,
    });

    renderProvider(["lead-1"]);

    click("enqueue-lead-1");

    await waitFor(() => {
      expect(screen.getByTestId("state-lead-1")).toHaveTextContent(
        LeadPitchJobState.Error,
      );
    });

    expect(screen.getByTestId("error-lead-1")).toHaveTextContent(
      ProfileBridgeErrorCode.TabNotOpen,
    );
    expect(generatePitchMock).not.toHaveBeenCalled();
  });

  it("surfaces a generator failure", async () => {
    generatePitchMock.mockResolvedValue({
      ok: false,
      code: LeadPitchErrorCode.NoProfileData,
    });

    renderProvider(["lead-1"]);

    click("enqueue-lead-1");

    await waitFor(() => {
      expect(screen.getByTestId("error-lead-1")).toHaveTextContent(
        LeadPitchErrorCode.NoProfileData,
      );
    });
  });

  it("never runs more than the concurrency limit at once", async () => {
    let active = 0;
    let peak = 0;

    captureProfileMock.mockImplementation(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return {
        ok: true,
        type: ProfileBridgeMessageType.CaptureProfile,
        snapshot: SNAPSHOT,
      };
    });

    const leadIds = ["lead-1", "lead-2", "lead-3", "lead-4", "lead-5"];
    renderProvider(leadIds);

    for (const leadId of leadIds) {
      click(`enqueue-${leadId}`);
    }

    await waitFor(
      () => {
        for (const leadId of leadIds) {
          expect(screen.getByTestId(`state-${leadId}`)).toHaveTextContent(
            LeadPitchJobState.Ready,
          );
        }
      },
      { timeout: 15000 },
    );

    expect(peak).toBeLessThanOrEqual(2);
  }, 20000);

  it("skips the bridge when a pasted snapshot is supplied", async () => {
    renderProvider(["lead-1"]);

    click("paste-lead-1");

    await waitFor(() => {
      expect(screen.getByTestId("state-lead-1")).toHaveTextContent(
        LeadPitchJobState.Ready,
      );
    });

    expect(captureProfileMock).not.toHaveBeenCalled();
  });

  it("loads a stored draft only once per lead and channel", async () => {
    getLatestMock.mockResolvedValue(makeDraft("lead-1"));

    renderProvider(["lead-1"]);

    click("load-lead-1");
    click("load-lead-1");

    await waitFor(() => {
      expect(screen.getByTestId("state-lead-1")).toHaveTextContent(
        LeadPitchJobState.Ready,
      );
    });

    expect(getLatestMock).toHaveBeenCalledTimes(1);
  });
});
