import { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { ProfileSnapshotSource } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";
import type {
  ProfileSnapshot,
  ProfileSnapshotPost,
} from "@invessiv/common/contracts/leads/outreach/profile-snapshot";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asCount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readEdgeCount(value: unknown): number | null {
  return asCount(asRecord(value)?.count);
}

function readCaption(node: UnknownRecord): string | null {
  const captionEdges = asRecord(node.edge_media_to_caption)?.edges;
  if (!Array.isArray(captionEdges) || captionEdges.length === 0) {
    return null;
  }

  return asString(asRecord(asRecord(captionEdges[0])?.node)?.text);
}

function readPostedAt(node: UnknownRecord): string | null {
  const takenAt = asCount(node.taken_at_timestamp);
  return takenAt === null ? null : new Date(takenAt * 1000).toISOString();
}

function readPosts(user: UnknownRecord): ProfileSnapshotPost[] {
  const edges = asRecord(user.edge_owner_to_timeline_media)?.edges;
  if (!Array.isArray(edges)) {
    return [];
  }

  return edges
    .map((edge) => asRecord(asRecord(edge)?.node))
    .filter((node): node is UnknownRecord => node !== null)
    .map((node) => ({
      caption: readCaption(node),
      postedAt: readPostedAt(node),
      likeCount: readEdgeCount(node.edge_liked_by),
    }));
}

export function normalizeInstagramProfile(payload: unknown): {
  snapshot: ProfileSnapshot;
  isPrivate: boolean;
} | null {
  const user = asRecord(asRecord(asRecord(payload)?.data)?.user);
  if (!user) {
    return null;
  }

  const posts = readPosts(user);

  return {
    isPrivate: user.is_private === true,
    snapshot: {
      platform: PitchChannel.Instagram,
      source: ProfileSnapshotSource.BridgeApi,
      handle: asString(user.username),
      displayName: asString(user.full_name),
      biography: asString(user.biography),
      headline: null,
      category:
        asString(user.category_name) ?? asString(user.business_category_name),
      followerCount: readEdgeCount(user.edge_followed_by),
      isVerified: user.is_verified === true,
      posts,
      capturedAt: new Date().toISOString(),
    },
  };
}
