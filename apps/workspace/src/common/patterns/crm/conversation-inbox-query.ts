import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import {
  CONVERSATION_INBOX_FILTER_VALUES,
  ConversationInboxFilter,
} from "@/common/constants/crm/conversation-inbox-filters";
import { ConversationInboxQueryParam } from "@/common/constants/crm/conversation-inbox-query-params";
import type { ConversationInboxRequest } from "@/common/contracts/crm/conversation-inbox-request";
import {
  buildDialogHref,
  type DialogSearchParamsInput,
  readDialogSearchParam,
} from "@/common/patterns/crm/dialog-query-primitives";

export function readConversationInboxRequest(
  searchParams: DialogSearchParamsInput,
): ConversationInboxRequest {
  const customerId = readDialogSearchParam(
    searchParams,
    ConversationInboxQueryParam.Customer,
  );
  const filter = readDialogSearchParam(
    searchParams,
    ConversationInboxQueryParam.Filter,
  );
  return {
    customerId: customerId && isUuid(customerId) ? customerId : null,
    filter:
      CONVERSATION_INBOX_FILTER_VALUES.find((value) => value === filter) ??
      ConversationInboxFilter.All,
  };
}

/** The default filter stays out of the URL so the plain inbox address remains canonical. */
export function buildConversationInboxHref(
  basePath: string,
  request: ConversationInboxRequest,
): string {
  const params = new URLSearchParams();
  if (request.filter !== ConversationInboxFilter.All)
    params.set(ConversationInboxQueryParam.Filter, request.filter);
  if (request.customerId)
    params.set(ConversationInboxQueryParam.Customer, request.customerId);
  return buildDialogHref(basePath, params);
}
