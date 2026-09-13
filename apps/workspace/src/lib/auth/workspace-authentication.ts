import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { WorkspaceActorResolutionError } from "@/common/constants/auth/workspace-actor-resolution-errors";
import { WorkspaceAuthStatus } from "@/common/constants/auth/workspace-auth-statuses";
import type { WorkspaceAuthentication } from "@/common/contracts/auth/workspace-authentication";
import type { BootstrapWorkspaceOwnerInput } from "@/server/workspace/auth/bootstrap-workspace-owner-types";
import { bootstrapWorkspaceOwner } from "@/server/workspace/auth/command-handler/bootstrap-workspace-owner.command-handler";
import { resolveWorkspaceActor } from "@/server/workspace/auth/query-handler/resolve-workspace-actor.query-handler";
import { clerkUserProfileMappingService } from "@/server/workspace/auth/services/clerk-user-profile-mapping-service";
import { workspaceBootstrapIdentityService } from "@/server/workspace/auth/services/workspace-bootstrap-identity-service";

async function loadBootstrapInput(
  clerkUserId: string,
): Promise<BootstrapWorkspaceOwnerInput | null> {
  const user = await currentUser();
  if (!user || user.id !== clerkUserId) {
    return null;
  }

  const profile = clerkUserProfileMappingService.mapUserToProfile(user);
  if (!profile.primaryEmail) {
    return null;
  }

  return {
    clerkUserId,
    primaryEmail: profile.primaryEmail,
    firstName: profile.firstName,
    lastName: profile.lastName,
    displayName: profile.displayName,
  };
}

/**
 * The single entry point for workspace authorization. Clerk only authenticates; identity,
 * membership and permissions come from the database on every request.
 */
export async function authenticateWorkspaceRequest(): Promise<WorkspaceAuthentication> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { status: WorkspaceAuthStatus.Unauthenticated };
  }

  try {
    const resolution = await resolveWorkspaceActor(clerkUserId);
    if (resolution.ok) {
      return {
        status: WorkspaceAuthStatus.Authorized,
        actor: resolution.actor,
      };
    }

    if (
      resolution.code !== WorkspaceActorResolutionError.UserMissing ||
      !workspaceBootstrapIdentityService.matches(clerkUserId)
    ) {
      return { status: WorkspaceAuthStatus.NotMember };
    }

    const bootstrapInput = await loadBootstrapInput(clerkUserId);
    if (!bootstrapInput) {
      return { status: WorkspaceAuthStatus.NotMember };
    }

    // A concurrent request may have won the bootstrap; re-resolving covers both outcomes.
    await bootstrapWorkspaceOwner(bootstrapInput);
    const retry = await resolveWorkspaceActor(clerkUserId);

    return retry.ok
      ? { status: WorkspaceAuthStatus.Authorized, actor: retry.actor }
      : { status: WorkspaceAuthStatus.NotMember };
  } catch (error: unknown) {
    console.error("[workspace-auth] authorization lookup failed", {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return { status: WorkspaceAuthStatus.Unavailable };
  }
}
