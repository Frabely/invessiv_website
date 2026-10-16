import Link from "next/link";
import { faCirclePlus, faHeadset } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import type { PortalContactDto } from "@invessiv/common/contracts/portal/portal-contact.dto";
import { ButtonLink } from "@invessiv/ui";
import { FeedbackNoticeTone } from "@/common/constants/portal/feedback-notice-tones";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import { FeedbackContactWays } from "../feedback-contact-ways/feedback-contact-ways";
import { FeedbackStateNotice } from "../feedback-state-notice/feedback-state-notice";

export type FeedbackQuotaNoticeProps = {
  /** The responsible member for a call or an email; null without one. */
  contact: PortalContactDto | null;
  content: PortalFeedbackDictionary;
  /** Messages page; null without chat access. */
  messagesHref: string | null;
  /**
   * The service request dialog, opened on the further round for this project. Null when no such
   * service is offered for the project or the reader may not request.
   */
  requestHref?: string | null;
};

/**
 * Every round is used: a further one is requested as a service where it is offered, and either way
 * the customer can reach us in the chat, in a call or by email.
 */
export function FeedbackQuotaNotice({
  contact,
  content,
  messagesHref,
  requestHref = null,
}: FeedbackQuotaNoticeProps) {
  const texts = content.states.exhausted;

  return (
    <FeedbackStateNotice
      description={requestHref ? texts.requestDescription : texts.description}
      icon={faHeadset}
      title={texts.title}
      tone={FeedbackNoticeTone.Neutral}
    >
      <FeedbackContactWays
        chatHref={messagesHref}
        chatLabel={texts.chatLink}
        contact={contact}
        content={content}
        leading={
          requestHref ? (
            <ButtonLink
              href={requestHref}
              linkComponent={Link}
              size={ButtonSize.Control}
              variant={ButtonVariant.Ghost}
            >
              <FontAwesomeIcon aria-hidden="true" icon={faCirclePlus} />
              {texts.requestLink}
            </ButtonLink>
          ) : null
        }
      />
    </FeedbackStateNotice>
  );
}
