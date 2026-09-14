import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { WorkspaceAuthStatus } from "@/common/constants/auth/workspace-auth-statuses";
import { listPermittedWorkspaceAreas } from "@/common/patterns/auth/list-permitted-workspace-areas";
import { WorkspaceShell } from "@/components/workspace/workspace-shell/workspace-shell";
import { isSupportedLocale } from "@/config/i18n";
import { getWorkspacePageContent } from "@/i18n/dictionaries/workspace";
import { getWorkspaceAuthenticationForRender } from "@/lib/auth/permissions";
import { signInPathWithRedirect, workspacePathFor } from "@/lib/auth/routes";
import { WorkspaceAuthorizationUnavailableError } from "@/lib/auth/workspace-authorization-unavailable-error.class";

type WorkspaceLayoutProps = {
  children: ReactNode;
  params: Promise<unknown>;
};

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
  if (authentication.status === WorkspaceAuthStatus.NotMember) {
    redirect(workspacePath);
  }
  if (authentication.status === WorkspaceAuthStatus.Unavailable) {
    throw new WorkspaceAuthorizationUnavailableError();
  }

  const permittedAreas = listPermittedWorkspaceAreas(authentication.actor);
  // A member without any area belongs on the explanatory entry screen; individual denied areas stay hidden in pages.
  if (permittedAreas.length === 0) {
    redirect(workspacePath);
  }

  const content = getWorkspacePageContent(activeLocale);

  return (
    <WorkspaceShell
      content={content}
      locale={activeLocale}
      permittedAreas={permittedAreas}
    >
      {children}
    </WorkspaceShell>
  );
}
