import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { WorkspaceAuthStatus } from "@/common/constants/auth/workspace-auth-statuses";
import { listPermittedWorkspaceAreas } from "@/common/patterns/auth/list-permitted-workspace-areas";
import { WorkspaceAccessStatus } from "@/components/workspace/workspace-access-status/workspace-access-status";
import { WorkspaceShell } from "@/components/workspace/workspace-shell/workspace-shell";
import { FeatureFlag, isFeatureEnabled } from "@/config/feature-flags";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import {
  getWorkspaceMetaContent,
  getWorkspacePageContent,
} from "@/i18n/dictionaries/workspace";
import {
  portalEntryPathFor,
  signInPathWithRedirect,
  workspaceAreaPathFor,
  workspacePathFor,
} from "@/lib/auth/routes";
import { authenticateWorkspaceRequest } from "@/lib/auth/workspace-authentication";
import { WorkspaceAuthorizationUnavailableError } from "@/lib/auth/workspace-authorization-unavailable-error.class";
import { hasPortalAccessForClerkUser } from "@/server/workspace/auth/query-handler/has-portal-access-for-clerk-user.query-handler";

/** A non-member with no workspace access at all may still hold a portal membership. */
async function resolvePortalRedirectForNonMember(
  locale: Locale,
): Promise<string | null> {
  if (!isFeatureEnabled(FeatureFlag.Portal)) {
    return null;
  }

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return null;
  }

  const hasPortalAccess = await hasPortalAccessForClerkUser(clerkUserId);
  return hasPortalAccess ? portalEntryPathFor(locale) : null;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

type WorkspacePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: WorkspacePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const content = getWorkspaceMetaContent(locale as Locale);
  return {
    title: content.title,
    description: content.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const authentication = await authenticateWorkspaceRequest();
  if (authentication.status === WorkspaceAuthStatus.Unauthenticated) {
    redirect(signInPathWithRedirect(locale, workspacePathFor(locale)));
  }
  if (authentication.status === WorkspaceAuthStatus.Unavailable) {
    throw new WorkspaceAuthorizationUnavailableError();
  }

  const content = getWorkspacePageContent(locale);
  if (authentication.status === WorkspaceAuthStatus.NotMember) {
    const portalRedirect = await resolvePortalRedirectForNonMember(locale);
    if (portalRedirect) {
      redirect(portalRedirect);
    }

    return (
      <WorkspaceShell content={content} locale={locale} permittedAreas={[]}>
        <WorkspaceAccessStatus
          content={content.access.pendingApproval}
          retryHref={workspacePathFor(locale)}
          variant="pending"
        />
      </WorkspaceShell>
    );
  }
  if (authentication.status === WorkspaceAuthStatus.Inactive) {
    return (
      <WorkspaceShell content={content} locale={locale} permittedAreas={[]}>
        <WorkspaceAccessStatus
          content={content.access.inactive}
          retryHref={workspacePathFor(locale)}
          variant="restricted"
        />
      </WorkspaceShell>
    );
  }

  const [landingArea] = listPermittedWorkspaceAreas(authentication.actor);
  if (!landingArea) {
    return (
      <WorkspaceShell content={content} locale={locale} permittedAreas={[]}>
        <WorkspaceAccessStatus
          content={content.access.noPermission}
          retryHref={workspacePathFor(locale)}
          variant="restricted"
        />
      </WorkspaceShell>
    );
  }

  redirect(workspaceAreaPathFor(locale, landingArea));
}
