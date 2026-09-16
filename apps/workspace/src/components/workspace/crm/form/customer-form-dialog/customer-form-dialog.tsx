"use client";

import { type SubmitEvent, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { faBuilding, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  CUSTOMER_TYPE_VALUES,
  CustomerType,
} from "@invessiv/common/constants/crm/customer-types";
import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { CustomerFieldLimits } from "@invessiv/common/constants/crm/forms/customer-field-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";
import {
  type Locale,
  SUPPORTED_LOCALES,
} from "@invessiv/common/contracts/i18n/locale";
import { formatCustomerNumber } from "@invessiv/common/patterns/crm/format-customer-number";
import {
  ButtonControl,
  Dialog,
  DialogSize,
  FormField,
  PrimaryCtaButton,
} from "@invessiv/ui";
import { customersApiService } from "@/client/crm/customers-api-service";
import { CustomerFormDialogMode } from "@/common/constants/crm/forms/customer-form-dialog-modes";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import type {
  CustomerFormErrors,
  CustomerFormValues,
} from "@/common/contracts/crm/customer-form-values";
import type { LeadCategoryOption } from "@/common/contracts/leads/lead-category-option";
import {
  createCustomerFormValues,
  toCreateCustomerRequest,
  toUpdateCustomerRequest,
  validateCustomerForm,
} from "@/common/patterns/crm/customer-form";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmFormDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import styles from "./customer-form-dialog.module.css";

type CustomerFormDialogProps = {
  categories: LeadCategoryOption[];
  /** Where closing navigates: the overview without dialog params. */
  closeHref: string;
  content: CrmFormDictionary;
  /** Null creates a customer; an existing one opens the edit mode without contact fields. */
  customer: CustomerDetailDto | null;
  locale: Locale;
};

type TextFieldKey = Exclude<
  keyof CustomerFormValues,
  "customerType" | "categoryId" | "contactPreferredLocale" | "notes"
>;

const NOTES_COUNTER_THRESHOLD = 0.8;
const DISPLAY_NAME_INPUT_NAME = "customer-display-name";

const TYPE_ICONS = {
  [CustomerType.Company]: faBuilding,
  [CustomerType.Individual]: faUser,
} as const;

export function CustomerFormDialog({
  categories,
  closeHref,
  content,
  customer,
  locale,
}: CustomerFormDialogProps) {
  const router = useRouter();
  const formId = useId();
  const customerHeadingId = useId();
  const contactHeadingId = useId();
  const addressHeadingId = useId();
  const detailsHeadingId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const typeInputRef = useRef<HTMLInputElement>(null);
  const mode = customer
    ? CustomerFormDialogMode.Edit
    : CustomerFormDialogMode.Create;
  const [values, setValues] = useState(() =>
    createCustomerFormValues(customer, locale),
  );
  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const mutation = useVersionedMutation<
    CustomerDetailDto | null,
    CustomerErrorCode
  >(customer, () => router.replace(closeHref, { scroll: false }));
  const isNameTaken = mutation.errorCode === CustomerErrorCode.DisplayNameTaken;

  useEffect(() => {
    if (isNameTaken) {
      formRef.current
        ?.querySelector<HTMLInputElement>(
          `input[name="${DISPLAY_NAME_INPUT_NAME}"]`,
        )
        ?.focus();
    }
  }, [isNameTaken]);

  function update<K extends keyof CustomerFormValues>(
    key: K,
    value: CustomerFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (
        !current[key] &&
        !(key === "contactEmail" && current.contactLastName)
      ) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      if (key === "contactEmail") {
        delete next.contactLastName;
      }
      return next;
    });
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isSubmitting) {
      return;
    }

    const nextErrors = validateCustomerForm(values, mode);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }

    await mutation.submit((current) =>
      current
        ? customersApiService.updateCustomer(
            current.id,
            toUpdateCustomerRequest(values, current.version),
          )
        : customersApiService.createCustomer(toCreateCustomerRequest(values)),
    );
  }

  function errorFor(key: keyof CustomerFormValues): string | undefined {
    const code = errors[key];
    return code ? content.validation[code] : undefined;
  }

  function renderTextField(
    key: TextFieldKey,
    options: {
      autoComplete?: string;
      className?: string;
      hint?: string;
      inputMode?: "decimal" | "email" | "tel" | "url";
      kind?:
        | typeof FormFieldKind.Text
        | typeof FormFieldKind.Email
        | typeof FormFieldKind.Tel
        | typeof FormFieldKind.Url;
      label: string;
      maxLength: number;
      name: string;
      placeholder: string;
      required?: boolean;
      suffix?: string;
    },
  ) {
    const errorMessage =
      key === "displayName" && isNameTaken && !errors.displayName
        ? content.validation.displayNameTaken
        : errorFor(key);

    return (
      <FormField
        className={options.className}
        errorMessage={errorMessage}
        hint={options.hint}
        inputProps={{
          autoComplete: options.autoComplete ?? "off",
          inputMode: options.inputMode,
          maxLength: options.maxLength,
          name: options.name,
          onChange: (event) => update(key, event.target.value),
          placeholder: options.placeholder,
          value: values[key],
        }}
        inputSuffix={options.suffix}
        kind={options.kind ?? FormFieldKind.Text}
        label={options.label}
        required={options.required}
      />
    );
  }

  const notesThreshold = Math.floor(
    CustomerFieldLimits.NotesMaxLength * NOTES_COUNTER_THRESHOLD,
  );
  const statusErrorCode =
    mutation.errorCode && !isNameTaken ? mutation.errorCode : null;

  return (
    <Dialog
      busy={mutation.isSubmitting}
      closeLabel={content.buttons.close}
      description={
        customer
          ? formatMessage(content.description.edit, {
              number: formatCustomerNumber(customer.customerNumber),
            })
          : content.description.create
      }
      footer={
        <>
          <ButtonControl
            disabled={mutation.isSubmitting}
            onClick={mutation.close}
            type="button"
            variant="ghost"
          >
            {content.buttons.cancel}
          </ButtonControl>
          <PrimaryCtaButton
            disabled={mutation.isSubmitting}
            form={formId}
            type="submit"
          >
            {mutation.isSubmitting
              ? content.buttons.submitting
              : customer
                ? content.buttons.submitEdit
                : content.buttons.submitCreate}
          </PrimaryCtaButton>
        </>
      }
      initialFocusRef={typeInputRef}
      onCloseAction={mutation.close}
      size={DialogSize.Wide}
      title={customer ? content.title.edit : content.title.create}
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <fieldset className={styles.typeSwitch}>
          <legend className={styles.legend}>
            {content.customerType.legend}
          </legend>
          <div className={styles.segments}>
            {CUSTOMER_TYPE_VALUES.map((type) => {
              const checked = values.customerType === type;
              return (
                <label
                  className={styles.segment}
                  data-checked={checked ? "true" : "false"}
                  key={type}
                >
                  <input
                    checked={checked}
                    className={styles.segmentInput}
                    name="customer-type"
                    onChange={() => update("customerType", type)}
                    ref={checked ? typeInputRef : undefined}
                    type="radio"
                    value={type}
                  />
                  <FontAwesomeIcon
                    aria-hidden="true"
                    className={styles.segmentIcon}
                    icon={TYPE_ICONS[type]}
                  />
                  <span>{content.customerType[type]}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <section aria-labelledby={customerHeadingId} className={styles.section}>
          <h3 className={styles.sectionTitle} id={customerHeadingId}>
            {content.sections.customer}
          </h3>
          <div className={styles.grid}>
            {renderTextField("displayName", {
              className: styles.fullWidth,
              hint: content.hints.displayName,
              label: content.fields.displayName,
              maxLength: CustomerFieldLimits.DisplayNameMaxLength,
              name: DISPLAY_NAME_INPUT_NAME,
              placeholder: content.placeholders.displayName,
              required: true,
            })}
            {values.customerType === CustomerType.Company
              ? renderTextField("companyName", {
                  autoComplete: "organization",
                  label: content.fields.companyName,
                  maxLength: CustomerFieldLimits.CompanyNameMaxLength,
                  name: "customer-company-name",
                  placeholder: content.placeholders.companyName,
                })
              : null}
            <FormField
              kind={FormFieldKind.Select}
              label={content.fields.category}
              options={[
                { label: content.placeholders.category, value: "" },
                ...categories.map((category) => ({
                  label: category.label,
                  value: category.id,
                })),
              ]}
              selectProps={{
                name: "customer-category",
                onChange: (event) => update("categoryId", event.target.value),
                value: values.categoryId,
              }}
            />
          </div>
        </section>

        {customer ? null : (
          <section
            aria-labelledby={contactHeadingId}
            className={styles.section}
            data-variant="grouped"
          >
            <div className={styles.sectionIntro}>
              <h3 className={styles.sectionTitle} id={contactHeadingId}>
                {content.sections.contact}
              </h3>
              <p className={styles.sectionHint}>
                {content.sectionHints.contact}
              </p>
            </div>
            <div className={styles.grid}>
              {renderTextField("contactFirstName", {
                autoComplete: "given-name",
                label: content.fields.firstName,
                maxLength: CustomerFieldLimits.PersonNameMaxLength,
                name: "contact-first-name",
                placeholder: content.placeholders.firstName,
              })}
              {renderTextField("contactLastName", {
                autoComplete: "family-name",
                label: content.fields.lastName,
                maxLength: CustomerFieldLimits.PersonNameMaxLength,
                name: "contact-last-name",
                placeholder: content.placeholders.lastName,
              })}
              {renderTextField("contactEmail", {
                autoComplete: "email",
                inputMode: "email",
                kind: FormFieldKind.Email,
                label: content.fields.email,
                maxLength: CustomerFieldLimits.EmailMaxLength,
                name: "contact-email",
                placeholder: content.placeholders.email,
              })}
              {renderTextField("contactPhone", {
                autoComplete: "tel",
                inputMode: "tel",
                kind: FormFieldKind.Tel,
                label: content.fields.phone,
                maxLength: CustomerFieldLimits.PhoneMaxLength,
                name: "contact-phone",
                placeholder: content.placeholders.phone,
              })}
              {renderTextField("contactRoleLabel", {
                autoComplete: "organization-title",
                label: content.fields.roleLabel,
                maxLength: CustomerFieldLimits.RoleLabelMaxLength,
                name: "contact-role",
                placeholder: content.placeholders.roleLabel,
              })}
              <FormField
                kind={FormFieldKind.Select}
                label={content.fields.preferredLocale}
                options={SUPPORTED_LOCALES.map((entry) => ({
                  label: content.locales[entry],
                  value: entry,
                }))}
                selectProps={{
                  name: "contact-locale",
                  onChange: (event) =>
                    update(
                      "contactPreferredLocale",
                      event.target.value as Locale,
                    ),
                  value: values.contactPreferredLocale,
                }}
              />
            </div>
          </section>
        )}

        <section
          aria-labelledby={addressHeadingId}
          className={styles.section}
          data-variant="grouped"
        >
          <h3 className={styles.sectionTitle} id={addressHeadingId}>
            {content.sections.address}
          </h3>
          <div className={styles.addressGrid}>
            {renderTextField("street", {
              autoComplete: "street-address",
              className: styles.fullWidth,
              label: content.fields.street,
              maxLength: CustomerFieldLimits.StreetMaxLength,
              name: "customer-street",
              placeholder: content.placeholders.street,
            })}
            {renderTextField("postalCode", {
              autoComplete: "postal-code",
              label: content.fields.postalCode,
              maxLength: CustomerFieldLimits.PostalCodeMaxLength,
              name: "customer-postal-code",
              placeholder: content.placeholders.postalCode,
            })}
            {renderTextField("city", {
              autoComplete: "address-level2",
              label: content.fields.city,
              maxLength: CustomerFieldLimits.CityMaxLength,
              name: "customer-city",
              placeholder: content.placeholders.city,
            })}
            {renderTextField("country", {
              autoComplete: "country-name",
              className: styles.fullWidth,
              label: content.fields.country,
              maxLength: CustomerFieldLimits.CountryMaxLength,
              name: "customer-country",
              placeholder: content.placeholders.country,
            })}
          </div>
        </section>

        <section aria-labelledby={detailsHeadingId} className={styles.section}>
          <h3 className={styles.sectionTitle} id={detailsHeadingId}>
            {content.sections.details}
          </h3>
          <div className={styles.grid}>
            {renderTextField("websiteUrl", {
              autoComplete: "url",
              inputMode: "url",
              kind: FormFieldKind.Url,
              label: content.fields.websiteUrl,
              maxLength: CustomerFieldLimits.WebsiteUrlMaxLength,
              name: "customer-website",
              placeholder: content.placeholders.websiteUrl,
            })}
            {renderTextField("vatId", {
              label: content.fields.vatId,
              maxLength: CustomerFieldLimits.VatIdMaxLength,
              name: "customer-vat-id",
              placeholder: content.placeholders.vatId,
            })}
            {renderTextField("hourlyRate", {
              hint: content.hints.hourlyRate,
              inputMode: "decimal",
              label: content.fields.hourlyRate,
              maxLength: 12,
              name: "customer-hourly-rate",
              placeholder: content.placeholders.hourlyRate,
              suffix: content.currencySymbol,
            })}
            <FormField
              className={styles.fullWidth}
              hint={
                values.notes.length >= notesThreshold
                  ? formatMessage(content.hints.notesCounter, {
                      count: values.notes.length,
                      max: CustomerFieldLimits.NotesMaxLength,
                    })
                  : undefined
              }
              kind={FormFieldKind.Textarea}
              label={content.fields.notes}
              textareaProps={{
                maxLength: CustomerFieldLimits.NotesMaxLength,
                name: "customer-notes",
                onChange: (event) => update("notes", event.target.value),
                placeholder: content.placeholders.notes,
                rows: 3,
                value: values.notes,
              }}
            />
          </div>
        </section>

        <p className={styles.requiredHint}>{content.requiredHint}</p>

        {mutation.hasConflict && mutation.current ? (
          <section
            className={styles.message}
            data-tone={DialogMessageTone.Conflict}
            role="alert"
          >
            <p className={styles.messageText}>{content.conflict.message}</p>
            <p className={styles.messageDetail}>
              {formatMessage(content.conflict.currentName, {
                name: mutation.current.displayName,
              })}
            </p>
          </section>
        ) : null}
        {statusErrorCode ? (
          <p
            className={styles.message}
            data-tone={DialogMessageTone.Error}
            role="alert"
          >
            {content.errors[statusErrorCode]}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
