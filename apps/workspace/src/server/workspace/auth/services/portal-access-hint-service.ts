import "server-only";

/**
 * Runs a portal-membership lookup as a non-authoritative hint, failing closed to `false` on any
 * error instead of failing the workspace render. Shared by the `hasPortalAccessFor*` query
 * handlers, which differ only in which lookup they call.
 */
async function resolve(
  lookup: () => Promise<readonly unknown[]>,
): Promise<boolean> {
  try {
    const memberships = await lookup();
    return memberships.length > 0;
  } catch (error: unknown) {
    console.error("[workspace-auth] portal access hint lookup failed", {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return false;
  }
}

export const portalAccessHintService = { resolve } as const;
