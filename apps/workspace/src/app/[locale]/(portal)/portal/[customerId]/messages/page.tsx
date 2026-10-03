import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";
import { PortalMessagesView } from "@/components/portal/messages/portal-messages-view/portal-messages-view";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import {
  getPortalFilesDictionary,
  getPortalMessagesDictionary,
} from "@/i18n/dictionaries/portal";
import { portalPathFor, workspaceAreaPathFor } from "@/lib/auth/routes";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { requirePortalReader } from "@/server/portal/auth/require-portal-reader";
import { getPortalConversation } from "@/server/portal/query-handler/get-portal-conversation.query-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The on-screen keyboard shrinks the layout instead of covering the composer.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

type PortalMessagesPageProps = {
  params: Promise<{ locale: string; customerId: string }>;
};

export async function generateMetadata({
  params,
}: PortalMessagesPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};

  const meta = getPortalMessagesDictionary(locale).meta;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function PortalMessagesPage({
  params,
}: PortalMessagesPageProps) {
  const { locale, customerId } = await params;
  const activeLocale = locale as Locale;
  const reader = await requirePortalReader(
    activeLocale,
    customerId.toLowerCase(),
  );
  const result = await getPortalConversation(reader, null);
  if (!result.ok) notFound();

  return (
    <PortalMessagesView
      dashboardHref={portalPathFor(activeLocale, reader.customerId)}
      cockpitHref={
        isPortalOwnerView(reader)
          ? buildCustomerCockpitHref(
              workspaceAreaPathFor(activeLocale, WorkspaceArea.Crm),
              reader.customerId,
            )
          : null
      }
      content={getPortalMessagesDictionary(activeLocale)}
      conversation={result.conversation}
      customerId={reader.customerId}
      filesContent={getPortalFilesDictionary(activeLocale)}
      key={reader.customerId}
      locale={activeLocale}
      viewerUserId={reader.userId}
    />
  );
}
