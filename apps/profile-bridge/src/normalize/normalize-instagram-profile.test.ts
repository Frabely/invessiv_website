import { describe, expect, it } from "vitest";
import { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { ProfileSnapshotSource } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";
import { normalizeInstagramProfile } from "./normalize-instagram-profile";

const PAYLOAD = {
  data: {
    user: {
      username: "kanzlei_mueller",
      full_name: "Kanzlei Müller & Partner",
      biography: "Digitale Buchhaltung für Handwerksbetriebe in Kassel.",
      category_name: "Steuerberatung",
      is_verified: false,
      is_private: false,
      edge_followed_by: { count: 812 },
      edge_owner_to_timeline_media: {
        edges: [
          {
            node: {
              taken_at_timestamp: 1751328000,
              edge_liked_by: { count: 24 },
              edge_media_to_caption: {
                edges: [{ node: { text: "Die Frist rückt näher." } }],
              },
            },
          },
          {
            node: {
              taken_at_timestamp: 1750723200,
              edge_liked_by: { count: 11 },
              edge_media_to_caption: { edges: [] },
            },
          },
        ],
      },
    },
  },
};

describe("normalizeInstagramProfile", () => {
  it("maps the profile payload onto a snapshot", () => {
    const result = normalizeInstagramProfile(PAYLOAD);

    expect(result).not.toBeNull();
    expect(result?.isPrivate).toBe(false);
    expect(result?.snapshot).toMatchObject({
      platform: PitchChannel.Instagram,
      source: ProfileSnapshotSource.BridgeApi,
      handle: "kanzlei_mueller",
      displayName: "Kanzlei Müller & Partner",
      biography: "Digitale Buchhaltung für Handwerksbetriebe in Kassel.",
      category: "Steuerberatung",
      followerCount: 812,
      isVerified: false,
    });
  });

  it("reads captions, timestamps and like counts from posts", () => {
    const result = normalizeInstagramProfile(PAYLOAD);

    expect(result?.snapshot.posts).toEqual([
      {
        caption: "Die Frist rückt näher.",
        postedAt: new Date(1751328000 * 1000).toISOString(),
        likeCount: 24,
      },
      {
        caption: null,
        postedAt: new Date(1750723200 * 1000).toISOString(),
        likeCount: 11,
      },
    ]);
  });

  it("falls back to null for missing fields instead of failing", () => {
    const result = normalizeInstagramProfile({
      data: { user: { username: "solo" } },
    });

    expect(result?.snapshot).toMatchObject({
      handle: "solo",
      displayName: null,
      biography: null,
      category: null,
      followerCount: null,
      posts: [],
    });
  });

  it("flags private profiles", () => {
    const result = normalizeInstagramProfile({
      data: { user: { username: "solo", is_private: true } },
    });

    expect(result?.isPrivate).toBe(true);
  });

  it("returns null when the payload carries no user", () => {
    expect(normalizeInstagramProfile({ data: {} })).toBeNull();
    expect(normalizeInstagramProfile(null)).toBeNull();
    expect(normalizeInstagramProfile("nope")).toBeNull();
  });
});
