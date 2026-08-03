import { describe, expect, it } from "vitest";
import { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { ProfileSnapshotSource } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";
import {
  extractLinkedInSlug,
  normalizeLinkedInProfile,
} from "./normalize-linkedin-profile";

const DOM_PROFILE = {
  displayName: "Susann Meier",
  headline: "Steuerberaterin | Digitale Buchhaltung",
  about:
    "Ich begleite Handwerksbetriebe bei der Umstellung auf digitale Belege.",
  currentPosition: "Kanzlei Meier · Partnerin",
  activity: [
    "Beitrag über die Grundsteuerfrist und was Betriebe beachten sollten",
  ],
};

describe("extractLinkedInSlug", () => {
  it("reads the slug from a profile url", () => {
    expect(
      extractLinkedInSlug("https://www.linkedin.com/in/susann-meier-123/"),
    ).toBe("susann-meier-123");
  });

  it("returns null for urls without a profile segment", () => {
    expect(extractLinkedInSlug("https://www.linkedin.com/feed/")).toBeNull();
    expect(extractLinkedInSlug("not-a-url")).toBeNull();
    expect(extractLinkedInSlug(null)).toBeNull();
  });
});

describe("normalizeLinkedInProfile", () => {
  it("maps the dom profile onto a snapshot", () => {
    const snapshot = normalizeLinkedInProfile(DOM_PROFILE, "susann-meier");

    expect(snapshot).toMatchObject({
      platform: PitchChannel.Linkedin,
      source: ProfileSnapshotSource.BridgeDom,
      handle: "susann-meier",
      displayName: "Susann Meier",
      headline: "Steuerberaterin | Digitale Buchhaltung",
      followerCount: null,
      isVerified: false,
    });
    expect(snapshot?.biography).toContain("Handwerksbetriebe");
    expect(snapshot?.biography).toContain("Kanzlei Meier");
  });

  it("turns activity entries into posts", () => {
    const snapshot = normalizeLinkedInProfile(DOM_PROFILE, "susann-meier");

    expect(snapshot?.posts).toEqual([
      {
        caption:
          "Beitrag über die Grundsteuerfrist und was Betriebe beachten sollten",
        postedAt: null,
        likeCount: null,
      },
    ]);
  });

  it("returns null when the dom yielded nothing", () => {
    expect(
      normalizeLinkedInProfile(
        {
          displayName: null,
          headline: null,
          about: null,
          currentPosition: null,
          activity: [],
        },
        "susann-meier",
      ),
    ).toBeNull();
  });
});
