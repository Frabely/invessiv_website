"use client";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ButtonLink } from "@invessiv/ui";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import { ServiceRequestStatus as S } from "@invessiv/common/constants/crm/service-request-statuses";
import { ServiceRequestTransitionSide } from "@invessiv/common/constants/crm/service-request-transition-sides";
import {
  canTransitionServiceRequest,
  isServiceRequestWithoutOffer,
} from "@invessiv/common/patterns/crm/service-request-state";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ServiceRequestDialogAction as Action } from "@/common/constants/crm/service-request-inbox-query-params";
import { buildServiceRequestActionHref } from "@/common/patterns/crm/service-request-inbox-query";
import styles from "./service-request-actions.module.css";

/**
 * Every action opens its dialog through the URL. The offer leads while the customer knows no
 * price; afterwards their answer does: agreed opens the acceptance, declined closes the request.
 */
export function ServiceRequestActions({
  request,
  content,
}: {
  request: ServiceRequestDto;
  content: CrmServiceRequestsDictionary;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const can = (to: S) =>
    canTransitionServiceRequest(
      request.status,
      to,
      ServiceRequestTransitionSide.Internal,
    );
  const withoutOffer = isServiceRequestWithoutOffer(request.status);
  const action = (target: Action, label: string, variant: ButtonVariant) => (
    <ButtonLink
      href={buildServiceRequestActionHref(
        pathname,
        params.toString(),
        request.id,
        target,
      )}
      variant={variant}
      linkComponent={Link}
      linkComponentProps={{ scroll: false }}
    >
      {label}
    </ButtonLink>
  );
  return (
    <div className={styles.actions}>
      {can(S.Offered)
        ? action(Action.Offer, content.actions.offered, ButtonVariant.Primary)
        : null}
      {can(S.Accepted)
        ? action(
            Action.Accept,
            withoutOffer
              ? content.actions.acceptWithoutOffer
              : content.actions.accept,
            withoutOffer ? ButtonVariant.Ghost : ButtonVariant.Primary,
          )
        : null}
      {can(S.Withdrawn)
        ? action(
            Action.Withdraw,
            content.actions.customerDeclined,
            ButtonVariant.Ghost,
          )
        : null}
      {can(S.Declined)
        ? action(Action.Decline, content.actions.decline, ButtonVariant.Ghost)
        : null}
    </div>
  );
}
