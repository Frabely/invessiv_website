"use client";
import { useId, type SubmitEvent } from "react";
import { FormDialog } from "@invessiv/ui";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import type { ServiceRequestErrorCode } from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { serviceRequestsApiService } from "@/client/crm/service-requests-api-service";
import { serviceRequestErrorText } from "@/common/patterns/crm/service-requests/service-request-error-text";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import { LineItemFormMessages } from "@/components/workspace/crm/shared/line-item-form-messages/line-item-form-messages";
import styles from "./service-request-withdraw-dialog.module.css";

export type ServiceRequestWithdrawDialogProps = {
  request: ServiceRequestDto;
  content: CrmServiceRequestsDictionary;
  onCloseAction: () => void;
};

/**
 * Records that the customer turned the offer down. It closes the request for good, so it asks
 * first; unlike a rejection by the team it needs no reason for the customer.
 */
export function ServiceRequestWithdrawDialog({
  request,
  content,
  onCloseAction,
}: ServiceRequestWithdrawDialogProps) {
  const formId = useId();
  const mutation = useVersionedMutation<
    ServiceRequestDto,
    ServiceRequestErrorCode
  >(request, onCloseAction);
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isSubmitting) return;
    await mutation.submit((current) =>
      serviceRequestsApiService.changeStatus(current.id, {
        to: ServiceRequestStatus.Withdrawn,
        version: current.version,
      }),
    );
  }
  return (
    <FormDialog
      formId={formId}
      title={content.form.withdrawTitle}
      description={request.title}
      busy={mutation.isSubmitting}
      cancelLabel={content.form.cancel}
      closeLabel={content.form.close}
      onCloseAction={mutation.close}
      submitLabel={content.form.withdraw}
      submittingLabel={content.form.busy}
    >
      <form className={styles.form} id={formId} onSubmit={submit} noValidate>
        <p className={styles.notice}>{content.form.withdrawNotice}</p>
        <LineItemFormMessages
          conflictMessage={
            mutation.hasConflict ? content.form.conflict : undefined
          }
          errorMessage={
            mutation.errorCode
              ? serviceRequestErrorText(mutation.errorCode, content)
              : undefined
          }
        />
      </form>
    </FormDialog>
  );
}
