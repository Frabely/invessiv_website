import { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { LeadSocialPlatform } from "@invessiv/common/constants/leads/social/lead-social-platforms";

interface PitchProfileSource {
  platform: LeadSocialPlatform;
  profileUrl: string;
}

const CHANNEL_BY_PLATFORM: Partial<Record<LeadSocialPlatform, PitchChannel>> = {
  [LeadSocialPlatform.Instagram]: PitchChannel.Instagram,
  [LeadSocialPlatform.Linkedin]: PitchChannel.Linkedin,
};

export function findPitchProfileUrl(
  profiles: PitchProfileSource[],
  channel: PitchChannel,
): string | null {
  const match = profiles.find(
    (profile) => CHANNEL_BY_PLATFORM[profile.platform] === channel,
  );

  return match?.profileUrl ?? null;
}

export function resolveDefaultPitchChannel(
  profiles: PitchProfileSource[],
): PitchChannel {
  if (findPitchProfileUrl(profiles, PitchChannel.Instagram)) {
    return PitchChannel.Instagram;
  }

  if (findPitchProfileUrl(profiles, PitchChannel.Linkedin)) {
    return PitchChannel.Linkedin;
  }

  return PitchChannel.Instagram;
}
