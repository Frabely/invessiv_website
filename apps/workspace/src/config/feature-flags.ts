import "server-only";

export const FeatureFlag = {
  Portal: "portal",
} as const;

export type FeatureFlag = (typeof FeatureFlag)[keyof typeof FeatureFlag];

const FEATURE_FLAG_ENV_VAR: Record<FeatureFlag, string> = {
  [FeatureFlag.Portal]: "FEATURE_PORTAL_ENABLED",
};

/** Off unless the matching env var is literally "true"; unset, empty or any other value is off. */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return process.env[FEATURE_FLAG_ENV_VAR[flag]] === "true";
}
