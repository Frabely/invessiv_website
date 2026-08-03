import {
  PROFILE_SNAPSHOT_MAX_BIO_LEN,
  PROFILE_SNAPSHOT_MAX_CAPTION_LEN,
  PROFILE_SNAPSHOT_MAX_POSTS,
} from "@invessiv/common/defaults/leads/outreach/lead-pitch-defaults";
import type {
  ProfileSnapshot,
  ProfileSnapshotPost,
} from "@invessiv/common/contracts/leads/outreach/profile-snapshot";

function clean(value: string | null, maxLength: number): string | null {
  if (value === null) {
    return null;
  }

  const collapsed = value.replace(/[ \t]+/g, " ").trim();
  if (collapsed.length === 0) {
    return null;
  }

  return collapsed.slice(0, maxLength);
}

function cleanPost(post: ProfileSnapshotPost): ProfileSnapshotPost {
  return {
    caption: clean(post.caption, PROFILE_SNAPSHOT_MAX_CAPTION_LEN),
    postedAt: post.postedAt,
    likeCount: post.likeCount,
  };
}

export function sanitizeProfileSnapshot(
  snapshot: ProfileSnapshot,
): ProfileSnapshot {
  return {
    ...snapshot,
    handle: clean(snapshot.handle, 120),
    displayName: clean(snapshot.displayName, 160),
    biography: clean(snapshot.biography, PROFILE_SNAPSHOT_MAX_BIO_LEN),
    headline: clean(snapshot.headline, PROFILE_SNAPSHOT_MAX_BIO_LEN),
    category: clean(snapshot.category, 160),
    posts: snapshot.posts
      .map(cleanPost)
      .filter((post) => post.caption !== null)
      .slice(0, PROFILE_SNAPSHOT_MAX_POSTS),
  };
}

export function hasProfileSubstance(snapshot: ProfileSnapshot): boolean {
  const bio = snapshot.biography ?? "";
  const headline = snapshot.headline ?? "";
  const hasText = bio.trim().length >= 20 || headline.trim().length >= 20;
  const hasPost = snapshot.posts.some(
    (post) => (post.caption ?? "").trim().length >= 20,
  );

  return hasText || hasPost;
}
