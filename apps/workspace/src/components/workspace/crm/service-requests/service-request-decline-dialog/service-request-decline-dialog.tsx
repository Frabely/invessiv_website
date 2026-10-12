"use client";
import { useId, useRef, useState, type SubmitEvent } from "react";
import { FormDialog, FormField } from "@invessiv/ui";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import type { ServiceRequestErrorCode } from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import { ServiceRequestFieldLimits } from "@invessiv/common/constants/crm/forms/service-request-field-limits";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { serviceRequestsApiService } from "@/client/crm/service-requests-api-service";
import { serviceRequestErrorText } from "@/common/patterns/crm/service-requests/service-request-error-text";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import { LineItemFormMessages } from "@/components/workspace/crm/shared/line-item-form-messages/line-item-form-messages";
import styles from "./service-request-decline-dialog.module.css";
export function ServiceRequestDeclineDialog({
  request,
  content,
  onCloseAction,
}: {
  request: ServiceRequestDto;
  content: CrmServiceRequestsDictionary;
  onCloseAction: () => void;
}) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [reason, setReason] = useState("");
  const [missing, setMissing] = useState(false);
  const mutation = useVersionedMutation<
    ServiceRequestDto,
    ServiceRequestErrorCode
  >(request, onCloseAction);
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isSubmitting) return;
    setMissing(!reason.trim());
    if (!reason.trim()) {
      formRef.current?.querySelector("textarea")?.focus();
      return;
    }
    await mutation.submit((current) =>
      serviceRequestsApiService.decline(current.id, {
        to: ServiceRequestStatus.Declined,
        version: current.version,
        reason: reason.trim(),
      }),
    );
  }
  return (
    <FormDialog
      formId={formId}
      title={content.form.declineTitle}
      description={request.title}
      busy={mutation.isSubmitting}
      cancelLabel={content.form.cancel}
      closeLabel={content.form.close}
      onCloseAction={mutation.close}
      submitLabel={content.form.decline}
      submittingLabel={content.form.busy}
      footerHint={content.form.required}
    >
      <form
        ref={formRef}
        className={styles.form}
        id={formId}
        onSubmit={submit}
        noValidate
      >
        <FormField
          kind={FormFieldKind.Textarea}
          label={content.form.reason}
          hint={content.form.reasonHint}
          required
          errorMessage={missing ? content.form.reasonRequired : undefined}
          textareaProps={{
            value: reason,
            onChange: (e) => setReason(e.target.value),
            maxLength: ServiceRequestFieldLimits.DeclineReasonMaxLength,
            rows: 5,
          }}
        />
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
