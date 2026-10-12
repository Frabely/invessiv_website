"use client";
import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ButtonControl, ButtonLink } from "@invessiv/ui";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import { ServiceRequestStatus as S } from "@invessiv/common/constants/crm/service-request-statuses";
import { ServiceRequestTransitionSide } from "@invessiv/common/constants/crm/service-request-transition-sides";
import { canTransitionServiceRequest } from "@invessiv/common/patterns/crm/service-request-state";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ServiceRequestDialogAction } from "@/common/constants/crm/service-request-inbox-query-params";
import { VersionedMutationOutcomeKind } from "@/common/constants/client/versioned-mutation-outcome-kinds";
import { isServiceRequestWithoutOffer } from "@/common/patterns/crm/service-requests/service-request-accept-form";
import { buildServiceRequestActionHref } from "@/common/patterns/crm/service-request-inbox-query";
import { serviceRequestErrorText } from "@/common/patterns/crm/service-requests/service-request-error-text";
import { serviceRequestsApiService } from "@/client/crm/service-requests-api-service";
import { useVersionedCommand } from "@/hooks/workspace/use-versioned-command";
import styles from "./service-request-actions.module.css";
export function ServiceRequestActions({
  request,
  content,
}: {
  request: ServiceRequestDto;
  content: CrmServiceRequestsDictionary;
}) {
  const [current, setCurrent] = useState(request);
  const [message, setMessage] = useState<string | null>(null);
  const command = useVersionedCommand();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const can = (to: S) =>
    canTransitionServiceRequest(
      current.status,
      to,
      ServiceRequestTransitionSide.Internal,
    );
  async function offer() {
    if (command.busy) return;
    setMessage(null);
    const result = await command.run(() =>
      serviceRequestsApiService.changeStatus(current.id, {
        to: S.Offered,
        version: current.version,
      }),
    );
    if (result.kind === VersionedMutationOutcomeKind.Saved) {
      setCurrent(result.value);
      router.refresh();
    } else if (result.kind === VersionedMutationOutcomeKind.Conflict) {
      setCurrent(result.current);
      setMessage(content.form.conflict);
      router.refresh();
    } else setMessage(serviceRequestErrorText(result.code, content));
  }
  // The customer has seen no price before an offer, so accepting is the main step only afterwards.
  const withoutOffer = isServiceRequestWithoutOffer(current);
  return (
    <div className={styles.root}>
      <div className={styles.actions}>
        {can(S.Offered) ? (
          <ButtonControl disabled={command.busy} type="button" onClick={offer}>
            {command.busy ? content.actions.busy : content.actions.offered}
          </ButtonControl>
        ) : null}
        {can(S.Accepted) ? (
          <ButtonLink
            href={buildServiceRequestActionHref(
              pathname,
              params.toString(),
              current.id,
              ServiceRequestDialogAction.Accept,
            )}
            variant={withoutOffer ? ButtonVariant.Ghost : ButtonVariant.Primary}
            linkComponent={Link}
            linkComponentProps={{ scroll: false }}
          >
            {withoutOffer
              ? content.actions.acceptWithoutOffer
              : content.actions.accept}
          </ButtonLink>
        ) : null}
        {can(S.Declined) ? (
          <ButtonLink
            href={buildServiceRequestActionHref(
              pathname,
              params.toString(),
              current.id,
              ServiceRequestDialogAction.Decline,
            )}
            variant={ButtonVariant.Ghost}
            linkComponent={Link}
            linkComponentProps={{ scroll: false }}
          >
            {content.actions.decline}
          </ButtonLink>
        ) : null}
      </div>
      {message ? (
        <p role="alert" className={styles.message}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
