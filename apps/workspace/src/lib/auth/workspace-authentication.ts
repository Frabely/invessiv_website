import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import {
  WorkspaceActorResolutionError,
  WorkspaceAuthStatus,
} from "@/common/constants/auth/workspace-auth-statuses";
import type { BootstrapWorkspaceOwnerInput } from "@/common/contracts/auth/bootstrap-workspace-owner-input";
import type { WorkspaceAuthentication } from "@/common/contracts/auth/workspace-authentication";
import { bootstrapWorkspaceOwner } from "@/server/workspace/auth/command-handler/bootstrap-workspace-owner.command-handler";
import { resolveWorkspaceActor } from "@/server/workspace/auth/query-handler/resolve-workspace-actor.query-handler";
import { workspaceBootstrapIdentityService } from "@/server/workspace/auth/services/workspace-bootstrap-identity-service";

async function loadBootstrapInput(
  clerkUserId: string,
): Promise<BootstrapWorkspaceOwnerInput | null> {
  const user = await currentUser();
  if (!user || user.id !== clerkUserId) {
    return null;
  }

  const primaryEmail = user.emailAddresses.find(
    (entry) => entry.id === user.primaryEmailAddressId,
  )?.emailAddress;
  if (!primaryEmail) {
    return null;
  }

  const fullName = [user.firstName, user.lastName]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ");

  return {
    clerkUserId,
    primaryEmail,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    displayName: fullName || primaryEmail,
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
