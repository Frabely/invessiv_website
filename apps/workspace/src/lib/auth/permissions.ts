import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import type { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import {
  WORKSPACE_AREA_PERMISSIONS,
  type WorkspaceArea,
} from "@/common/constants/auth/workspace-areas";
import { WorkspaceAuthStatus } from "@/common/constants/auth/workspace-auth-statuses";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { Locale } from "@/config/i18n";

import { signInPathWithRedirect, workspacePathFor } from "./routes";
import { authenticateWorkspaceRequest } from "./workspace-authentication";
import { WorkspaceAuthorizationUnavailableError } from "./workspace-authorization-unavailable-error.class";

// Layout and page of one render share the lookup; the next request resolves again.
const authenticateForRender = cache(authenticateWorkspaceRequest);

export async function requireWorkspaceActor(
  locale: Locale,
): Promise<WorkspaceActor> {
  const authentication = await authenticateForRender();

  if (authentication.status === WorkspaceAuthStatus.Authorized) {
    return authentication.actor;
  }
  if (authentication.status === WorkspaceAuthStatus.Unauthenticated) {
    redirect(signInPathWithRedirect(locale, workspacePathFor(locale)));
  }
  if (authentication.status === WorkspaceAuthStatus.NotMember) {
    notFound();
  }

  throw new WorkspaceAuthorizationUnavailableError();
}

/** Pages answer a missing permission with 404, so they never confirm that a hidden area exists. */
export async function requireWorkspacePermission(
  locale: Locale,
  permission: Permission,
): Promise<WorkspaceActor> {
  const actor = await requireWorkspaceActor(locale);

  if (!can(actor, permission)) {
    notFound();
  }

  return actor;
}

export async function requireWorkspaceArea(
  locale: Locale,
  area: WorkspaceArea,
): Promise<WorkspaceActor> {
  return requireWorkspacePermission(locale, WORKSPACE_AREA_PERMISSIONS[area]);
}
