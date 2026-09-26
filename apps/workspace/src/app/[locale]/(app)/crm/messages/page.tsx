import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { ConversationInboxFilter } from "@/common/constants/crm/conversation-inbox-filters";
import { canAnywhere } from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";
import { readConversationInboxRequest } from "@/common/patterns/crm/conversation-inbox-query";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";
import { ConversationInbox } from "@/components/workspace/crm/messages/conversation-inbox/conversation-inbox";
import { ConversationInboxHeader } from "@/components/workspace/crm/messages/conversation-inbox-header/conversation-inbox-header";
import { WorkspaceScrollablePageShell } from "@/components/workspace/shared/workspace-scrollable-page-shell/workspace-scrollable-page-shell";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { getCrmMessagesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { requireWorkspaceActor } from "@/lib/auth/permissions";
import { crmMessagesPathFor, workspaceAreaPathFor } from "@/lib/auth/routes";
import { getCustomerConversation } from "@/server/workspace/crm/query-handler/get-customer-conversation.query-handler";
import { listConversationOwnerCandidates } from "@/server/workspace/crm/query-handler/list-conversation-owner-candidates.query-handler";
import { listConversations } from "@/server/workspace/crm/query-handler/list-conversations.query-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MessagesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: MessagesPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }
  const meta = getCrmMessagesDictionary(locale).meta;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function MessagesPage({
  params,
  searchParams,
}: MessagesPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  // Chat is bindable, so a grant on a single customer is enough to open the inbox.
  const actor = await requireWorkspaceActor(locale);
  if (!canAnywhere(actor, Permission.ChatRead)) {
    notFound();
  }

  const activeLocale: Locale = locale;
  const content = getCrmMessagesDictionary(activeLocale);
  const request = readConversationInboxRequest(await searchParams);
  const allItems = await listConversations(actor);
  const items =
    request.filter === ConversationInboxFilter.Mine
      ? allItems.filter(
          (item) => item.ownerMemberId === actor.workspaceMemberId,
        )
      : allItems;
  // Only a conversation from the visible list can be opened; anything else selects nothing.
  const selectedItem =
    items.find((item) => item.customerId === request.customerId) ?? null;
  const [selected, ownerCandidates] = selectedItem
    ? await Promise.all([
        getCustomerConversation(selectedItem.customerId, actor, null),
        listConversationOwnerCandidates(selectedItem.customerId, actor),
      ])
    : [null, []];
  const canReadSelectedCustomer =
    selectedItem !== null &&
    canOn(actor, Permission.CustomersRead, {
      customerId: selectedItem.customerId,
    });

  return (
    <WorkspaceScrollablePageShell pageId="crm-messages">
      <ConversationInboxHeader content={content.inbox} />
      <ConversationInbox
        basePath={crmMessagesPathFor(activeLocale)}
        canWriteSelected={
          selectedItem !== null &&
          canOn(actor, Permission.ChatWrite, {
            customerId: selectedItem.customerId,
          })
        }
        cockpitHref={
          selectedItem && canReadSelectedCustomer
            ? buildCustomerCockpitHref(
                workspaceAreaPathFor(activeLocale, WorkspaceArea.Crm),
                selectedItem.customerId,
              )
            : null
        }
        content={content}
        filter={request.filter}
        hasAnyConversation={allItems.length > 0}
        items={items}
        locale={activeLocale}
        ownerCandidates={ownerCandidates}
        selected={selected}
        selectedCustomerName={selectedItem?.customerDisplayName ?? null}
        viewerMemberId={actor.workspaceMemberId}
      />
    </WorkspaceScrollablePageShell>
  );
}
