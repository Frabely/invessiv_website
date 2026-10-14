"use client";
import { useId, useRef, useState, type SubmitEvent } from "react";
import { CheckboxControl, FormDialog } from "@invessiv/ui";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { ProjectLineItemFieldLimits } from "@invessiv/common/constants/crm/forms/project-line-item-field-limits";
import { ServiceRequestProjectWish as Mode } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { isServiceRequestWithoutOffer } from "@invessiv/common/patterns/crm/service-request-state";
import type { ServiceRequestErrorCode } from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import type {
  CrmProjectLineItemsDictionary,
  CrmServiceRequestsDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import type { ServiceRequestsViewModel } from "@/common/contracts/crm/service-requests-view-model";
import type { ServiceRequestAcceptFormValues } from "@/common/contracts/crm/service-request-accept-form-values";
import type { LineItemFieldsFormValues } from "@/common/contracts/crm/line-item-fields-form-values";
import type { Locale } from "@/config/i18n";
import {
  createServiceRequestAcceptForm,
  applyServiceRequestTemplate,
  validateServiceRequestAcceptForm,
  toAcceptServiceRequest,
} from "@/common/patterns/crm/service-requests/service-request-accept-form";
import { serviceRequestErrorText } from "@/common/patterns/crm/service-requests/service-request-error-text";
import { readDurationInput } from "@/common/patterns/crm/hours/duration-input";
import { parseEuroAmountToCents } from "@/common/patterns/crm/euro-cents";
import { validateLineItemFieldsForm } from "@/common/patterns/crm/line-item-fields-form";
import { resolveProjectLineItemFormBlocker } from "@/common/patterns/crm/project-line-item-form";
import { serviceRequestsApiService } from "@/client/crm/service-requests-api-service";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import { useFocusFirstInvalidField } from "@/hooks/shared/use-focus-first-invalid-field";
import { LineItemIdentityFields } from "@/components/workspace/crm/shared/line-item-identity-fields/line-item-identity-fields";
import { LineItemPricingFields } from "@/components/workspace/crm/shared/line-item-pricing-fields/line-item-pricing-fields";
import { LineItemFormMessages } from "@/components/workspace/crm/shared/line-item-form-messages/line-item-form-messages";
import { ProjectLineItemEffectFields } from "@/components/workspace/crm/projects/project-line-item-effect-fields/project-line-item-effect-fields";
import { ServiceRequestDetails } from "../service-request-details/service-request-details";
import { workspaceAreaPathFor } from "@/lib/auth/routes";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import layout from "@/components/workspace/crm/shared/line-item-form-layout/line-item-form-layout.module.css";
import { ServiceRequestProjectFields } from "../service-request-project-fields/service-request-project-fields";
import { ServiceRequestTemplateFields } from "../service-request-template-fields/service-request-template-fields";
import { LineItemStatusField } from "@/components/workspace/crm/shared/line-item-status-field/line-item-status-field";
import styles from "./service-request-accept-dialog.module.css";

export type ServiceRequestAcceptDialogProps = {
  request: ServiceRequestDto;
  viewModel: ServiceRequestsViewModel;
  content: CrmServiceRequestsDictionary;
  /** Labels of the shared line item fields. */
  lineItemsContent: CrmProjectLineItemsDictionary;
  locale: Locale;
  onCloseAction: () => void;
};
export function ServiceRequestAcceptDialog({
  request,
  viewModel,
  content,
  lineItemsContent: sharedContent,
  locale,
  onCloseAction,
}: ServiceRequestAcceptDialogProps) {
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const { formRef, focusFirstInvalidField } = useFocusFirstInvalidField();
  const [values, setValues] = useState(() =>
    createServiceRequestAcceptForm(request, viewModel, locale),
  );
  const [invalid, setInvalid] = useState(false);
  const mutation = useVersionedMutation<
    ServiceRequestDto,
    ServiceRequestErrorCode
  >(request, onCloseAction);
  // Without an offer the customer never saw a price, so accepting needs a deliberate tick.
  const withoutOffer = isServiceRequestWithoutOffer(mutation.current.status);
  const unconfirmed = withoutOffer && !values.confirmedWithoutOffer;
  const templates = viewModel.templates.filter((t) => t.kind === request.kind);
  const blockers = viewModel.blockers[values.projectId] ?? {
    hours: null,
    feedbackRound: null,
  };
  const blocker =
    values.projectMode === Mode.Existing
      ? resolveProjectLineItemFormBlocker(
          request.kind,
          blockers,
          values.allocateHoursToProject,
        )
      : null;
  const quantity = readDurationInput(values.quantityInput);
  const price = parseEuroAmountToCents(values.priceInput);
  function update<K extends keyof ServiceRequestAcceptFormValues>(
    key: K,
    value: ServiceRequestAcceptFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }
  function selectTemplate(id: string) {
    const template = templates.find((t) => t.id === id);
    if (template)
      setValues((current) =>
        applyServiceRequestTemplate(
          current,
          template,
          locale,
          mutation.current,
        ),
      );
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isSubmitting || blocker || unconfirmed) return;
    if (!validateServiceRequestAcceptForm(values, mutation.current)) {
      setInvalid(true);
      focusFirstInvalidField();
      return;
    }
    setInvalid(false);
    await mutation.submit((current) =>
      serviceRequestsApiService.accept(
        current.id,
        toAcceptServiceRequest(values, current, viewModel),
      ),
    );
  }
  const shared = {
    content: {
      ...sharedContent.form,
      pricingMode: sharedContent.list.pricingMode,
      interval: sharedContent.form.interval,
    },
    errors: invalid
      ? validateLineItemFieldsForm(
          values,
          ProjectLineItemFieldLimits.PriceCentsMax,
        )
      : {},
    namePrefix: "service-request",
    values,
    onChangeAction: (patch: Partial<LineItemFieldsFormValues>) =>
      setValues((current) => ({ ...current, ...patch })),
  };
  const noProject =
    values.projectMode === Mode.Existing && !viewModel.projects.length;
  const noTemplate =
    values.templateMode === Mode.Existing &&
    (!templates.length || !viewModel.canReadTemplates);
  return (
    <FormDialog
      size={DialogSize.Wide}
      formId={formId}
      title={
        withoutOffer
          ? content.form.acceptWithoutOfferTitle
          : content.form.acceptTitle
      }
      busy={mutation.isSubmitting}
      cancelLabel={content.form.cancel}
      closeLabel={content.form.close}
      onCloseAction={mutation.close}
      submitLabel={content.form.accept}
      submittingLabel={content.form.busy}
      submitDisabled={
        blocker !== null || noProject || noTemplate || unconfirmed
      }
      footerHint={content.form.required}
    >
      <form
        className={layout.form}
        id={formId}
        onSubmit={submit}
        noValidate
        ref={formRef}
      >
        <section aria-label={content.form.request} className={styles.request}>
          <ServiceRequestDetails
            request={mutation.current}
            content={content}
            locale={locale}
            crmPath={workspaceAreaPathFor(locale, WorkspaceArea.Crm)}
          />
        </section>
        {withoutOffer ? (
          <div className={styles.notice} data-warning="true">
            <p className={styles.noticeText}>
              {content.form.withoutOfferNotice}
            </p>
            <label className={styles.confirm}>
              <CheckboxControl
                checked={values.confirmedWithoutOffer}
                name="service-request-without-offer"
                onChange={(event) =>
                  update("confirmedWithoutOffer", event.target.checked)
                }
              />
              {content.form.withoutOfferConfirm}
            </label>
          </div>
        ) : (
          <div className={styles.notice}>
            <p className={styles.noticeText}>{content.form.offeredNotice}</p>
            {mutation.current.offeredPricingMode === null ? (
              <p className={styles.noticeText}>
                {content.form.legacyOfferNotice}
              </p>
            ) : null}
          </div>
        )}
        <ServiceRequestProjectFields
          request={request}
          viewModel={viewModel}
          content={content}
          values={values}
          unavailable={noProject}
          invalid={invalid}
          onChangeAction={(patch) =>
            setValues((current) => ({ ...current, ...patch }))
          }
        />
        <ServiceRequestTemplateFields
          request={request}
          viewModel={viewModel}
          content={content}
          values={values}
          unavailable={noTemplate}
          onChangeAction={(patch) =>
            setValues((current) => ({ ...current, ...patch }))
          }
          onSelectTemplateAction={selectTemplate}
        />
        <div className={layout.grid}>
          <LineItemIdentityFields
            {...shared}
            limits={ProjectLineItemFieldLimits}
            titleInputRef={titleRef}
          />
          <ProjectLineItemEffectFields
            allocateHoursToProject={values.allocateHoursToProject}
            onAllocateChangeAction={(next) =>
              update("allocateHoursToProject", next)
            }
            blocker={blocker}
            content={sharedContent}
            kind={request.kind}
            locale={locale}
            onQuantityChangeAction={(next) => update("quantityInput", next)}
            quantityError={invalid && !quantity.ok ? quantity.error : undefined}
            quantityInput={values.quantityInput}
            quantityMinutes={quantity.ok ? quantity.minutes : null}
            rateCents={price.ok ? price.cents : null}
            storedQuantityMinutes={undefined}
          />
          <LineItemPricingFields
            {...shared}
            kind={request.kind}
            pricingDisabled={request.kind !== LineItemKind.Standard}
          />
          {request.kind === LineItemKind.Standard ? (
            <LineItemStatusField
              label={sharedContent.form.fields.status}
              labels={sharedContent.list.status}
              value={values.status}
              onChangeAction={(next) => update("status", next)}
            />
          ) : null}
        </div>
        <LineItemFormMessages
          conflictMessage={
            mutation.hasConflict ? content.form.conflict : undefined
          }
          errorMessage={
            mutation.errorCode
              ? serviceRequestErrorText(mutation.errorCode, content)
              : invalid
                ? content.form.validation
                : undefined
          }
        />
      </form>
    </FormDialog>
  );
}
