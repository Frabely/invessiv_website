import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { PortalSection } from "@/common/constants/portal/portal-sections";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";
import { FeedbackPageView } from "@/components/portal/feedback/feedback-page-view/feedback-page-view";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import {
  getPortalFeedbackDictionary,
  getPortalFilesDictionary,
} from "@/i18n/dictionaries/portal";
import { portalPathFor, workspaceAreaPathFor } from "@/lib/auth/routes";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { requirePortalReader } from "@/server/portal/auth/require-portal-reader";
import { getPortalProjectFeedback } from "@/server/portal/query-handler/get-portal-project-feedback.query-handler";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { buildPortalHref } from "@/common/patterns/portal/build-portal-href";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PortalFeedbackPageProps = {
  params: Promise<{ locale: string; customerId: string; projectId: string }>;
};

export async function generateMetadata({
  params,
}: PortalFeedbackPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};

  const meta = getPortalFeedbackDictionary(locale).meta;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function PortalFeedbackPage({
  params,
}: PortalFeedbackPageProps) {
  const { locale, customerId, projectId } = await params;
  const activeLocale = locale as Locale;
  const reader = await requirePortalReader(
    activeLocale,
    customerId.toLowerCase(),
  );
  const feedback = await getPortalProjectFeedback(
    reader,
    projectId.toLowerCase(),
  );
  if (!feedback) notFound();
  const isOwnerView = isPortalOwnerView(reader);
  const target = { customerId: reader.customerId };

  return (
    <FeedbackPageView
      canUpload={
        !isOwnerView &&
        portalCanOn.forReader(reader, Permission.PortalFilesWrite, target)
      }
      cockpitHref={
        isOwnerView
          ? buildCustomerCockpitHref(
              workspaceAreaPathFor(activeLocale, WorkspaceArea.Crm),
              reader.customerId,
              "",
              { projectId: feedback.projectId },
            )
          : null
      }
      content={getPortalFeedbackDictionary(activeLocale)}
      customerId={reader.customerId}
      dashboardHref={buildPortalHref(
        portalPathFor(activeLocale, reader.customerId),
        "",
        { project: feedback.projectId },
      )}
      feedback={feedback}
      filesContent={getPortalFilesDictionary(activeLocale)}
      key={reader.customerId}
      locale={activeLocale}
      messagesHref={
        portalCanOn.forReader(reader, Permission.PortalMessagesRead, target)
          ? buildPortalHref(
              portalPathFor(
                activeLocale,
                reader.customerId,
                PortalSection.Messages,
              ),
              "",
              { project: feedback.projectId },
            )
          : null
      }
    />
  );
}
