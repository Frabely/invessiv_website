import { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { ProfileSnapshotSource } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";
import type { ProfileSnapshot } from "@invessiv/common/contracts/leads/outreach/profile-snapshot";
import type { LinkedInDomProfile } from "../content/linkedin-reader";

export function extractLinkedInSlug(profileUrl: string | null): string | null {
  if (!profileUrl) {
    return null;
  }

  try {
    const url = new URL(profileUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    const inIndex = segments.indexOf("in");

    return inIndex >= 0 ? (segments[inIndex + 1] ?? null) : null;
  } catch {
    return null;
  }
}

export function normalizeLinkedInProfile(
  dom: LinkedInDomProfile,
  slug: string | null,
): ProfileSnapshot | null {
  const hasContent =
    dom.displayName !== null ||
    dom.headline !== null ||
    dom.about !== null ||
    dom.activity.length > 0;

  if (!hasContent) {
    return null;
  }

  const biography = [dom.about, dom.currentPosition]
    .filter((part): part is string => part !== null && part.length > 0)
    .join("\n\n");

  return {
    platform: PitchChannel.Linkedin,
    source: ProfileSnapshotSource.BridgeDom,
    handle: slug,
    displayName: dom.displayName,
    biography: biography.length > 0 ? biography : null,
    headline: dom.headline,
    category: null,
    followerCount: null,
    isVerified: false,
    posts: dom.activity.map((caption) => ({
      caption,
      postedAt: null,
      likeCount: null,
    })),
    capturedAt: new Date().toISOString(),
  };
}
