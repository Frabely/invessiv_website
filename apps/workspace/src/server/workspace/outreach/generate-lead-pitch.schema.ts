import { z } from "zod";
import { PITCH_CHANNEL_VALUES } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { PROFILE_SNAPSHOT_SOURCE_VALUES } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";
import {
  PROFILE_SNAPSHOT_MAX_BIO_LEN,
  PROFILE_SNAPSHOT_MAX_CAPTION_LEN,
  PROFILE_SNAPSHOT_MAX_POSTS,
} from "@invessiv/common/defaults/leads/outreach/lead-pitch-defaults";

const profileSnapshotPostSchema = z.object({
  caption: z
    .string()
    .max(PROFILE_SNAPSHOT_MAX_CAPTION_LEN * 4)
    .nullable(),
  postedAt: z.string().max(64).nullable(),
  likeCount: z.number().int().nonnegative().nullable(),
});

const profileSnapshotSchema = z.object({
  platform: z.enum(PITCH_CHANNEL_VALUES),
  source: z.enum(PROFILE_SNAPSHOT_SOURCE_VALUES),
  handle: z.string().max(200).nullable(),
  displayName: z.string().max(200).nullable(),
  biography: z
    .string()
    .max(PROFILE_SNAPSHOT_MAX_BIO_LEN * 4)
    .nullable(),
  headline: z
    .string()
    .max(PROFILE_SNAPSHOT_MAX_BIO_LEN * 4)
    .nullable(),
  category: z.string().max(200).nullable(),
  followerCount: z.number().int().nonnegative().nullable(),
  isVerified: z.boolean(),
  posts: z.array(profileSnapshotPostSchema).max(PROFILE_SNAPSHOT_MAX_POSTS * 4),
  capturedAt: z.string().min(1).max(64),
});

export const generateLeadPitchSchema = z
  .object({
    leadId: z.string().min(1),
    channel: z.enum(PITCH_CHANNEL_VALUES),
    snapshot: profileSnapshotSchema,
  })
  .superRefine((value, context) => {
    if (value.channel !== value.snapshot.platform) {
      context.addIssue({
        code: "custom",
        message: "Snapshot platform must match the selected channel",
        path: ["snapshot", "platform"],
      });
    }
  });

export const getLatestLeadPitchSchema = z.object({
  leadId: z.string().min(1),
  channel: z.enum(PITCH_CHANNEL_VALUES),
});
