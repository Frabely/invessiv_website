import type { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import type { ProfileSnapshotSource } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";

export interface ProfileSnapshotPost {
  caption: string | null;
  postedAt: string | null;
  likeCount: number | null;
}

export interface ProfileSnapshot {
  platform: PitchChannel;
  source: ProfileSnapshotSource;
  handle: string | null;
  displayName: string | null;
  biography: string | null;
  headline: string | null;
  category: string | null;
  followerCount: number | null;
  isVerified: boolean;
  posts: ProfileSnapshotPost[];
  capturedAt: string;
}
