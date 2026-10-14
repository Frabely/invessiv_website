"use client";
import { useId, useRef, useState, type SubmitEvent } from "react";
import { FormDialog } from "@invessiv/ui";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import type { ServiceRequestErrorCode } from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import type {
  CrmProjectLineItemsDictionary,
  CrmServiceRequestsDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import type { ServiceRequestsViewModel } from "@/common/contracts/crm/service-requests-view-model";
import type { Locale } from "@/config/i18n";
import { serviceRequestsApiService } from "@/client/crm/service-requests-api-service";
import { readDurationInput } from "@/common/patterns/crm/hours/duration-input";
import { serviceRequestErrorText } from "@/common/patterns/crm/service-requests/service-request-error-text";
import {
  createServiceRequestOfferForm,
  toOfferServiceRequest,
} from "@/common/patterns/crm/service-requests/service-request-offer-form";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import { DurationField } from "@/components/workspace/crm/hours/duration-field/duration-field";
import { LineItemFormMessages } from "@/components/workspace/crm/shared/line-item-form-messages/line-item-form-messages";
import { LineItemPricingFields } from "@/components/workspace/crm/shared/line-item-pricing-fields/line-item-pricing-fields";
import { validateLineItemFieldsForm } from "@/common/patterns/crm/line-item-fields-form";
import { ProjectLineItemFieldLimits } from "@invessiv/common/constants/crm/forms/project-line-item-field-limits";
import type { LineItemFieldsFormValues } from "@/common/contracts/crm/line-item-fields-form-values";
import { LineItemFieldsFormValidationCode } from "@/common/constants/crm/forms/line-item-fields-form-validation-codes";
import styles from "./service-request-offer-dialog.module.css";

export type ServiceRequestOfferDialogProps = {
  request: ServiceRequestDto;
  viewModel: ServiceRequestsViewModel;
  content: CrmServiceRequestsDictionary;
  /** Labels of the shared duration and price fields. */
  lineItemsContent: CrmProjectLineItemsDictionary;
  locale: Locale;
  onCloseAction: () => void;
};

/**
 * Marks the offer as sent and keeps what was offered. The customer never sees these values in
 * the portal; they are where the acceptance starts once the customer agreed.
 */
export function ServiceRequestOfferDialog({
  request,
  viewModel,
  content,
  lineItemsContent,
  locale,
  onCloseAction,
}: ServiceRequestOfferDialogProps) {
  const formId = useId();
  const priceRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState(() =>
    createServiceRequestOfferForm(request, viewModel.templates, locale),
  );
  const [invalid, setInvalid] = useState(false);
  const mutation = useVersionedMutation<
    ServiceRequestDto,
    ServiceRequestErrorCode
  >(request, onCloseAction);
  const hours = request.kind === LineItemKind.Hours;
  const quantity = readDurationInput(values.quantityInput);
  const quantityTexts = lineItemsContent.form.quantity;
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isSubmitting) return;
    if (toOfferServiceRequest(values, mutation.current) === null) {
      setInvalid(true);
      priceRef.current?.focus();
      return;
    }
    setInvalid(false);
    await mutation.submit((current) => {
      const input = toOfferServiceRequest(values, current);
      if (input === null) throw new Error("Offer form changed while sending");
      return serviceRequestsApiService.changeStatus(current.id, input);
    });
  }
  return (
    <FormDialog
      formId={formId}
      title={content.form.offerTitle}
      description={request.title}
      busy={mutation.isSubmitting}
      cancelLabel={content.form.cancel}
      closeLabel={content.form.close}
      onCloseAction={mutation.close}
      submitLabel={content.form.offer}
      submittingLabel={content.form.busy}
      footerHint={content.form.required}
    >
      <form className={styles.form} id={formId} onSubmit={submit} noValidate>
        <p className={styles.notice}>{content.form.offerNotice}</p>
        <LineItemPricingFields
          content={{
            ...lineItemsContent.form,
            validation: {
              ...lineItemsContent.form.validation,
              [LineItemFieldsFormValidationCode.PriceInvalid]:
                content.form.offerPriceInvalid,
            },
            fields: {
              ...lineItemsContent.form.fields,
              priceCents: content.form.offerPrice,
              hourlyRate: content.form.offerRate,
            },
            pricingMode: lineItemsContent.list.pricingMode,
            interval: lineItemsContent.form.interval,
          }}
          errors={
            invalid
              ? validateLineItemFieldsForm(
                  values,
                  ProjectLineItemFieldLimits.PriceCentsMax,
                )
              : {}
          }
          namePrefix="service-request-offer"
          values={values}
          kind={request.kind}
          pricingDisabled={request.kind !== LineItemKind.Standard}
          priceInputRef={priceRef}
          priceHint={content.form.offerPriceHint}
          onChangeAction={(patch: Partial<LineItemFieldsFormValues>) =>
            setValues((current) => ({ ...current, ...patch }))
          }
        />
        {hours ? (
          <DurationField
            decreaseHoursLabel={quantityTexts.decreaseHours}
            decreaseLabel={quantityTexts.decrease}
            errorMessage={
              invalid && !quantity.ok
                ? formatMessage(quantityTexts[quantity.error], {
                    duration: formatDuration(HoursLimits.MaxLedgerMinutes),
                  })
                : undefined
            }
            hint={quantityTexts.hint}
            hoursLabel={quantityTexts.hours}
            increaseHoursLabel={quantityTexts.increaseHours}
            increaseLabel={quantityTexts.increase}
            label={lineItemsContent.form.fields.quantity}
            minutesLabel={quantityTexts.minutes}
            name="service-request-offer-quantity"
            onChangeAction={(next) =>
              setValues((current) => ({ ...current, quantityInput: next }))
            }
            value={values.quantityInput}
          />
        ) : null}
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
