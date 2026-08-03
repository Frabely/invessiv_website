import type { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";

const MIN_DELAY_MS = 2500;
const JITTER_MS = 1500;

const lastCallAt = new Map<PitchChannel, number>();

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

export async function throttle(platform: PitchChannel): Promise<void> {
  const previous = lastCallAt.get(platform);
  const now = Date.now();

  if (previous !== undefined) {
    const elapsed = now - previous;
    const required = MIN_DELAY_MS + Math.random() * JITTER_MS;

    if (elapsed < required) {
      await wait(required - elapsed);
    }
  }

  lastCallAt.set(platform, Date.now());
}
