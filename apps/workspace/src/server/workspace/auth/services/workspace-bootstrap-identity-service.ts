import "server-only";

const BOOTSTRAP_CLERK_USER_ID_ENV_KEY = "WORKSPACE_BOOTSTRAP_CLERK_USER_ID";

/** Matches only the configured Clerk id; an empty or missing value never matches. */
function matches(clerkUserId: string): boolean {
  const configured = process.env[BOOTSTRAP_CLERK_USER_ID_ENV_KEY]?.trim();
  return Boolean(configured) && configured === clerkUserId;
}

export const workspaceBootstrapIdentityService = {
  matches,
} as const;
