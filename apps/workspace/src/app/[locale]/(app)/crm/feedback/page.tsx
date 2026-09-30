import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { canAnywhere } from "@/common/patterns/auth/access-scope";
import {
  hasActiveFeedbackInboxFilters,
  readFeedbackInboxFilters,
} from "@/common/patterns/crm/feedback-inbox-query";
import { FeedbackInbox } from "@/components/workspace/crm/feedback-rounds/feedback-inbox/feedback-inbox";
import { WorkspaceScrollablePageShell } from "@/components/workspace/shared/workspace-scrollable-page-shell/workspace-scrollable-page-shell";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { getCrmFeedbackRoundsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { requireWorkspaceActor } from "@/lib/auth/permissions";
import { crmFeedbackPathFor, workspaceAreaPathFor } from "@/lib/auth/routes";
import { listFeedbackInbox } from "@/server/workspace/crm/query-handler/list-feedback-inbox.query-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type FeedbackInboxPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: FeedbackInboxPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }
  const meta = getCrmFeedbackRoundsDictionary(locale).inbox.meta;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function FeedbackInboxPage({
  params,
  searchParams,
}: FeedbackInboxPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  // Rounds are bindable through their project, so a grant on one project opens the inbox.
  const actor = await requireWorkspaceActor(locale);
  if (!canAnywhere(actor, Permission.ProjectsRead)) {
    notFound();
  }

  const activeLocale: Locale = locale;
  const filters = readFeedbackInboxFilters(await searchParams);
  const inbox = await listFeedbackInbox(filters, actor);

  return (
    <WorkspaceScrollablePageShell pageId="crm-feedback">
      <FeedbackInbox
        basePath={crmFeedbackPathFor(activeLocale)}
        content={getCrmFeedbackRoundsDictionary(activeLocale)}
        crmPath={workspaceAreaPathFor(activeLocale, WorkspaceArea.Crm)}
        filters={filters}
        hasActiveFilters={hasActiveFeedbackInboxFilters(filters)}
        inbox={inbox}
        locale={activeLocale}
      />
    </WorkspaceScrollablePageShell>
  );
}
