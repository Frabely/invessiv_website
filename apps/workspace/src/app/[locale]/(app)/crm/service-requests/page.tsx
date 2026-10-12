import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { canAnywhere } from "@/common/patterns/auth/access-scope";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { ServiceRequestInboxFilter } from "@/common/constants/crm/service-request-inbox-query-params";
import { readServiceRequestInboxFilter } from "@/common/patterns/crm/service-request-inbox-query";
import { ServiceRequestInbox } from "@/components/workspace/crm/service-requests/service-request-inbox/service-request-inbox";
import { WorkspaceScrollablePageShell } from "@/components/workspace/shared/workspace-scrollable-page-shell/workspace-scrollable-page-shell";
import { isSupportedLocale } from "@/config/i18n";
import { getCrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { requireWorkspaceActor } from "@/lib/auth/permissions";
import {
  crmServiceRequestsPathFor,
  workspaceAreaPathFor,
} from "@/lib/auth/routes";
import { listServiceRequestInbox } from "@/server/workspace/crm/query-handler/list-service-request-inbox.query-handler";
export const dynamic = "force-dynamic";
type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const meta = getCrmServiceRequestsDictionary(locale).meta;
  return { ...meta, robots: { index: false, follow: false, nocache: true } };
}
export default async function ServiceRequestsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const actor = await requireWorkspaceActor(locale);
  if (!canAnywhere(actor, Permission.ServiceRequestsRead)) notFound();
  const filter = readServiceRequestInboxFilter(await searchParams);
  const inbox = await listServiceRequestInbox(
    filter === ServiceRequestInboxFilter.Open,
    actor,
  );
  return (
    <WorkspaceScrollablePageShell pageId="crm-service-requests">
      <ServiceRequestInbox
        basePath={crmServiceRequestsPathFor(locale)}
        crmPath={workspaceAreaPathFor(locale, WorkspaceArea.Crm)}
        filter={filter}
        inbox={inbox}
        content={getCrmServiceRequestsDictionary(locale)}
        locale={locale}
      />
    </WorkspaceScrollablePageShell>
  );
}
