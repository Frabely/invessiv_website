import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import { WorkspaceAuthStatus } from "@/common/constants/auth/workspace-auth-statuses";
import {
  WORKSPACE_AREA_VALUES,
  WorkspaceArea,
} from "@/common/constants/auth/workspace-areas";
import { canAnywhere } from "@/common/patterns/auth/access-scope";
import { listPermittedWorkspaceAreas } from "@/common/patterns/auth/list-permitted-workspace-areas";
import { WorkspaceShell } from "@/components/workspace/workspace-shell/workspace-shell";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { getWorkspacePageContent } from "@/i18n/dictionaries/workspace";
import { getWorkspaceAuthenticationForRender } from "@/lib/auth/permissions";
import {
  portalEntryPathFor,
  signInPathWithRedirect,
  workspacePathFor,
} from "@/lib/auth/routes";
import { WorkspaceAuthorizationUnavailableError } from "@/lib/auth/workspace-authorization-unavailable-error.class";
import { hasPortalAccessForUserId } from "@/server/workspace/auth/query-handler/has-portal-access-for-user-id.query-handler";
import { countUnreadConversations } from "@/server/workspace/crm/query-handler/count-unread-conversations.query-handler";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";

type WorkspaceLayoutProps = {
  children: ReactNode;
  params: Promise<unknown>;
};

async function resolvePortalHref(
  locale: Locale,
  userId: string,
): Promise<string | null> {
  const hasPortalAccess = await hasPortalAccessForUserId(userId);
  return hasPortalAccess ? portalEntryPathFor(locale) : null;
}

// The counter is only a hint: a failing query hides the badge instead of breaking every page.
async function resolveUnreadConversationCount(
  actor: WorkspaceActor,
): Promise<number> {
  try {
    return await countUnreadConversations(actor);
  } catch (error) {
    logCrmFailure(CrmOperation.CountUnreadConversations, error);
    return 0;
  }
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const routeParams = await params;
  const locale =
    typeof routeParams === "object" &&
    routeParams !== null &&
    "locale" in routeParams &&
    typeof routeParams.locale === "string"
      ? routeParams.locale
      : null;
  if (!locale || !isSupportedLocale(locale)) {
    notFound();
  }

  const activeLocale = locale;
  const workspacePath = workspacePathFor(activeLocale);
  const authentication = await getWorkspaceAuthenticationForRender();
  if (authentication.status === WorkspaceAuthStatus.Unauthenticated) {
    redirect(signInPathWithRedirect(activeLocale, workspacePath));
  }
  if (
    authentication.status === WorkspaceAuthStatus.NotMember ||
    authentication.status === WorkspaceAuthStatus.Inactive
  ) {
    redirect(workspacePath);
  }
  if (authentication.status === WorkspaceAuthStatus.Unavailable) {
    throw new WorkspaceAuthorizationUnavailableError();
  }

  const permittedAreas = listPermittedWorkspaceAreas(authentication.actor);
  const canOpenCrmCustomers = permittedAreas.includes(WorkspaceArea.Crm);
  const canOpenCrmTasks = canAnywhere(
    authentication.actor,
    Permission.TasksRead,
  );
  const canReadCrmLineItemTemplates = can(
    authentication.actor,
    Permission.LineItemTemplatesRead,
  );
  const canOpenCrmMessages = canAnywhere(
    authentication.actor,
    Permission.ChatRead,
  );
  const hasCrmNavigation =
    canOpenCrmCustomers ||
    canOpenCrmTasks ||
    canOpenCrmMessages ||
    canReadCrmLineItemTemplates;
  const navigationAreas = WORKSPACE_AREA_VALUES.filter(
    (area) =>
      permittedAreas.includes(area) ||
      (area === WorkspaceArea.Crm && hasCrmNavigation),
  );
  // A member without a navigable area belongs on the explanatory entry screen; denied entries stay hidden.
  if (navigationAreas.length === 0) {
    redirect(workspacePath);
  }

  const content = getWorkspacePageContent(activeLocale);

  const [portalHref, unreadConversationCount] = await Promise.all([
    resolvePortalHref(activeLocale, authentication.actor.userId),
    canOpenCrmMessages
      ? resolveUnreadConversationCount(authentication.actor)
      : 0,
  ]);

  return (
    <WorkspaceShell
      content={content}
      canOpenCrmCustomers={canOpenCrmCustomers}
      canOpenCrmTasks={canOpenCrmTasks}
      canOpenCrmMessages={canOpenCrmMessages}
      canReadCrmLineItemTemplates={canReadCrmLineItemTemplates}
      locale={activeLocale}
      permittedAreas={navigationAreas}
      portalHref={portalHref}
      unreadConversationCount={unreadConversationCount}
    >
      {children}
    </WorkspaceShell>
  );
}
