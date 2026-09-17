"use client";

import {
  type KeyboardEvent,
  type Ref,
  type SubmitEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { LeadConversionErrorCode } from "@invessiv/common/constants/crm/errors/lead-conversion-error-codes";
import { CustomerFieldLimits } from "@invessiv/common/constants/crm/forms/customer-field-limits";
import { CUSTOMER_STATUS_VALUES } from "@invessiv/common/constants/crm/customer-statuses";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";
import type { CustomerContactWriteDto } from "@invessiv/common/contracts/crm/customer-contact-write.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { LeadDetailDto } from "@invessiv/common/contracts/leads/lead-detail.dto";
import {
  ButtonControl,
  CustomSelect,
  Dialog,
  DialogSize,
  FormField,
  PrimaryCtaButton,
} from "@invessiv/ui";
import { customersApiService } from "@/client/crm/customers-api-service";
import { leadConversionApiService } from "@/client/crm/lead-conversion-api-service";
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
  validateCustomerContact,
  validateCustomerForm,
} from "@/common/patterns/crm/customer-form";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import { buildLeadDetailHref } from "@/common/patterns/leads/lead-detail-query";
import type { CrmFormDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import { CustomerContactSection } from "../../contacts/customer-contact-section/customer-contact-section";
import styles from "./customer-form-dialog.module.css";

type CustomerFormDialogProps = {
  categories: LeadCategoryOption[];
  /** Where closing navigates: the overview without dialog params. */
  closeHref: string;
  content: CrmFormDictionary;
  /** Null creates a customer; an existing one opens the edit mode without contact fields. */
  customer: CustomerDetailDto | null;
  locale: Locale;
  /** CRM overview path used after a successful lead conversion. */
  crmBasePath?: string;
  /** Leads overview path used by source-lead backlinks in edit mode. */
  leadsBasePath?: string;
  /** Present only when the create dialog converts this lead. */
  sourceLead?: LeadDetailDto;
};

type TextFieldKey = Exclude<
  keyof CustomerFormValues,
  "categoryId" | "contactPreferredLocale" | "notes" | "status"
>;

const NOTES_COUNTER_THRESHOLD = 0.8;
const DISPLAY_NAME_INPUT_NAME = "customer-display-name";
const CustomerFormTab = {
  Customer: "customer",
  Contacts: "contacts",
  Address: "address",
  Details: "details",
} as const;

type CustomerFormTab = (typeof CustomerFormTab)[keyof typeof CustomerFormTab];

const CUSTOMER_FORM_TABS = [
  CustomerFormTab.Customer,
  CustomerFormTab.Contacts,
  CustomerFormTab.Address,
  CustomerFormTab.Details,
] as const;

const CUSTOMER_TAB_FIELDS = [
  "displayName",
  "companyName",
  "categoryId",
  "status",
] as const;
const CONTACT_TAB_FIELDS = [
  "contactFirstName",
  "contactLastName",
  "contactEmail",
  "contactPhone",
  "contactRoleLabel",
  "contactPreferredLocale",
] as const;
const ADDRESS_TAB_FIELDS = ["street", "postalCode", "city", "country"] as const;
const DETAILS_TAB_FIELDS = [
  "websiteUrl",
  "vatId",
  "hourlyRate",
  "notes",
] as const;

export function CustomerFormDialog({
  categories,
  closeHref,
  content,
  customer,
  locale,
  crmBasePath,
  leadsBasePath,
  sourceLead,
}: CustomerFormDialogProps) {
  const router = useRouter();
  const formId = useId();
  const tabsId = useId();
  const contactConfirmButtonId = useId();
  const customerHeadingId = useId();
  const addressHeadingId = useId();
  const detailsHeadingId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const displayNameInputRef = useRef<HTMLInputElement>(null);
  const mode = customer
    ? CustomerFormDialogMode.Edit
    : CustomerFormDialogMode.Create;
  const [values, setValues] = useState(() =>
    createCustomerFormValues(customer, locale, sourceLead),
  );
  const [conversionError, setConversionError] =
    useState<LeadConversionErrorCode | null>(null);
  const [conversionSubmitting, setConversionSubmitting] = useState(false);
  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const [activeTab, setActiveTab] = useState<CustomerFormTab>(
    CustomerFormTab.Customer,
  );
  const [contactEditorOpen, setContactEditorOpen] = useState(!customer);
  const [contacts, setContacts] = useState<CustomerContactWriteDto[]>(
    () =>
      customer?.contacts.map((contact) => ({
        id: contact.id,
        personId: contact.personId,
        assignmentVersion: contact.assignmentVersion,
        personVersion: contact.personVersion,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.primaryEmail,
        phone: contact.primaryPhone,
        roleLabel: contact.roleLabel,
        preferredLocale: contact.preferredLocale,
        isPrimary: contact.isPrimary,
      })) ?? [],
  );
  const mutation = useVersionedMutation<
    CustomerDetailDto | null,
    CustomerErrorCode
  >(customer, () => router.replace(closeHref, { scroll: false }));
  const isNameTaken =
    mutation.errorCode === CustomerErrorCode.DisplayNameTaken ||
    conversionError === LeadConversionErrorCode.DisplayNameTaken;
  const isSubmitting = mutation.isSubmitting || conversionSubmitting;

  useEffect(() => {
    if (isNameTaken) {
      displayNameInputRef.current?.focus();
    }
  }, [isNameTaken]);

  function update<K extends keyof CustomerFormValues>(
    key: K,
    value: CustomerFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const nextErrors = {
      ...validateCustomerForm(values, mode, contacts.length > 0),
      ...(contactEditorOpen ? validateCustomerContact(values) : {}),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const invalidTab = findFirstInvalidTab(nextErrors);
      setActiveTab(invalidTab);
      if (invalidTab === CustomerFormTab.Contacts) {
        setContactEditorOpen(true);
      }
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }

    if (contactEditorOpen) {
      setActiveTab(CustomerFormTab.Contacts);
      requestAnimationFrame(() =>
        document.getElementById(contactConfirmButtonId)?.focus(),
      );
      return;
    }

    if (sourceLead && crmBasePath) {
      setConversionSubmitting(true);
      setConversionError(null);
      const result = await leadConversionApiService.convertLead(
        sourceLead.id,
        toCreateCustomerRequest(values, contacts),
      );
      if (result.ok) {
        router.replace(crmBasePath, { scroll: false });
        router.refresh();
        return;
      }
      setConversionSubmitting(false);
      setConversionError(result.code);
      return;
    }

    await mutation.submit((current) =>
      current
        ? customersApiService.updateCustomer(
            current.id,
            toUpdateCustomerRequest(values, current.version, contacts),
          )
        : customersApiService.createCustomer(
            toCreateCustomerRequest(values, contacts),
          ),
    );
  }

  function errorFor(key: keyof CustomerFormValues): string | undefined {
    const code = errors[key];
    return code ? content.validation[code] : undefined;
  }

  function hasTabError(tab: CustomerFormTab) {
    const fields =
      tab === CustomerFormTab.Customer
        ? CUSTOMER_TAB_FIELDS
        : tab === CustomerFormTab.Contacts
          ? CONTACT_TAB_FIELDS
          : tab === CustomerFormTab.Address
            ? ADDRESS_TAB_FIELDS
            : DETAILS_TAB_FIELDS;
    return fields.some((field) => Boolean(errors[field]));
  }

  function findFirstInvalidTab(
    nextErrors: CustomerFormErrors,
  ): CustomerFormTab {
    const tabs = [
      [CustomerFormTab.Customer, CUSTOMER_TAB_FIELDS],
      [CustomerFormTab.Contacts, CONTACT_TAB_FIELDS],
      [CustomerFormTab.Address, ADDRESS_TAB_FIELDS],
      [CustomerFormTab.Details, DETAILS_TAB_FIELDS],
    ] as const;
    return (
      tabs.find(([, fields]) =>
        fields.some((field) => Boolean(nextErrors[field])),
      )?.[0] ?? CustomerFormTab.Customer
    );
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentTab: CustomerFormTab,
  ) {
    const currentIndex = CUSTOMER_FORM_TABS.indexOf(currentTab);
    const nextIndex =
      event.key === "ArrowRight"
        ? (currentIndex + 1) % CUSTOMER_FORM_TABS.length
        : event.key === "ArrowLeft"
          ? (currentIndex - 1 + CUSTOMER_FORM_TABS.length) %
            CUSTOMER_FORM_TABS.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? CUSTOMER_FORM_TABS.length - 1
              : null;
    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = CUSTOMER_FORM_TABS[nextIndex];
    setActiveTab(nextTab);
    requestAnimationFrame(() =>
      document.getElementById(`${tabsId}-${nextTab}-tab`)?.focus(),
    );
  }

  function renderTextField(
    key: TextFieldKey,
    options: {
      autoComplete?: string;
      className?: string;
      hint?: string;
      inputMode?: "decimal" | "email" | "tel" | "url";
      inputRef?: Ref<HTMLInputElement>;
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
        inputRef={options.inputRef}
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
  const statusErrorCode = !isNameTaken
    ? (conversionError ?? mutation.errorCode)
    : null;

  return (
    <Dialog
      bodyClassName={styles.dialogBody}
      busy={isSubmitting}
      closeLabel={content.buttons.close}
      description={
        customer
          ? formatMessage(content.description.edit, {
              name: customer.displayName,
            })
          : undefined
      }
      footer={
        <>
          <p className={styles.footerRequiredHint}>{content.requiredHint}</p>
          <div className={styles.footerActions}>
            <ButtonControl
              disabled={isSubmitting}
              onClick={mutation.close}
              type="button"
              variant="ghost"
            >
              {content.buttons.cancel}
            </ButtonControl>
            <PrimaryCtaButton
              disabled={isSubmitting}
              form={formId}
              type="submit"
            >
              {isSubmitting
                ? content.buttons.submitting
                : customer
                  ? content.buttons.submitEdit
                  : sourceLead
                    ? content.buttons.submitConversion
                    : content.buttons.submitCreate}
            </PrimaryCtaButton>
          </div>
        </>
      }
      initialFocusRef={displayNameInputRef}
      onCloseAction={mutation.close}
      size={DialogSize.Wide}
      title={
        customer
          ? content.title.edit
          : sourceLead
            ? content.title.convert
            : content.title.create
      }
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
        ref={formRef}
      >
        {customer && leadsBasePath && customer.sourceLeads.length > 0 ? (
          <aside className={styles.sourceLeads}>
            <strong>{content.sourceLeads.title}</strong>
            {customer.sourceLeads.map((lead) => (
              <a
                href={buildLeadDetailHref(leadsBasePath, lead.id)}
                key={lead.id}
              >
                {lead.displayName}
              </a>
            ))}
          </aside>
        ) : null}
        <div
          aria-label={content.tabs.label}
          className={styles.tabs}
          role="tablist"
        >
          {[
            { tab: CustomerFormTab.Customer, label: content.sections.customer },
            {
              tab: CustomerFormTab.Contacts,
              label: customer
                ? content.sections.additionalContact
                : content.sections.contact,
            },
            { tab: CustomerFormTab.Address, label: content.sections.address },
            { tab: CustomerFormTab.Details, label: content.sections.details },
          ].map(({ tab, label }) => (
            <button
              aria-controls={`${tabsId}-${tab}-panel`}
              aria-selected={activeTab === tab}
              className={styles.tab}
              data-invalid={hasTabError(tab) || undefined}
              id={`${tabsId}-${tab}-tab`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(event) => handleTabKeyDown(event, tab)}
              role="tab"
              tabIndex={activeTab === tab ? 0 : -1}
              type="button"
            >
              {label}
              {hasTabError(tab) ? (
                <span aria-hidden="true" className={styles.tabErrorDot} />
              ) : null}
            </button>
          ))}
        </div>
        <div
          aria-labelledby={`${tabsId}-${CustomerFormTab.Customer}-tab`}
          hidden={activeTab !== CustomerFormTab.Customer}
          id={`${tabsId}-${CustomerFormTab.Customer}-panel`}
          role="tabpanel"
        >
          <section
            aria-labelledby={customerHeadingId}
            className={styles.section}
          >
            <h3 className={styles.sectionTitle} id={customerHeadingId}>
              {content.sections.customer}
            </h3>
            <div className={styles.grid}>
              {renderTextField("displayName", {
                className: styles.fullWidth,
                hint: content.hints.displayName,
                inputRef: displayNameInputRef,
                label: content.fields.displayName,
                maxLength: CustomerFieldLimits.DisplayNameMaxLength,
                name: DISPLAY_NAME_INPUT_NAME,
                placeholder: content.placeholders.displayName,
                required: true,
              })}
              {renderTextField("companyName", {
                autoComplete: "organization",
                label: content.fields.companyName,
                maxLength: CustomerFieldLimits.CompanyNameMaxLength,
                name: "customer-company-name",
                placeholder: content.placeholders.companyName,
              })}
              <FormField
                kind={FormFieldKind.Custom}
                label={content.fields.category}
                renderControl={({ describedBy, id, invalid }) => (
                  <CustomSelect
                    describedBy={describedBy}
                    id={id}
                    invalid={invalid}
                    onChange={(next) => update("categoryId", next)}
                    options={[
                      { label: content.placeholders.category, value: "" },
                      ...categories.map((category) => ({
                        label: category.label,
                        value: category.id,
                      })),
                    ]}
                    value={values.categoryId}
                  />
                )}
              />
              {customer ? (
                <FormField
                  kind={FormFieldKind.Custom}
                  label={content.fields.status}
                  renderControl={({ describedBy, id, invalid }) => (
                    <CustomSelect
                      describedBy={describedBy}
                      id={id}
                      invalid={invalid}
                      onChange={(next) => update("status", next)}
                      options={CUSTOMER_STATUS_VALUES.map((status) => ({
                        label: content.status[status],
                        value: status,
                      }))}
                      value={values.status}
                    />
                  )}
                />
              ) : null}
            </div>
          </section>
        </div>

        <div
          aria-labelledby={`${tabsId}-${CustomerFormTab.Contacts}-tab`}
          hidden={activeTab !== CustomerFormTab.Contacts}
          id={`${tabsId}-${CustomerFormTab.Contacts}-panel`}
          role="tabpanel"
        >
          <CustomerContactSection
            confirmButtonId={contactConfirmButtonId}
            content={content}
            contacts={contacts}
            customerExists={Boolean(customer)}
            editorOpen={contactEditorOpen}
            errors={errors}
            locale={locale}
            onContactFieldChangeAction={update}
            onContactsChangeAction={setContacts}
            onEditorOpenChangeAction={setContactEditorOpen}
            onErrorsChangeAction={setErrors}
            values={values}
          />
        </div>
        <div
          aria-labelledby={`${tabsId}-${CustomerFormTab.Address}-tab`}
          hidden={activeTab !== CustomerFormTab.Address}
          id={`${tabsId}-${CustomerFormTab.Address}-panel`}
          role="tabpanel"
        >
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
        </div>

        <div
          aria-labelledby={`${tabsId}-${CustomerFormTab.Details}-tab`}
          hidden={activeTab !== CustomerFormTab.Details}
          id={`${tabsId}-${CustomerFormTab.Details}-panel`}
          role="tabpanel"
        >
          <section
            aria-labelledby={detailsHeadingId}
            className={styles.section}
          >
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
        </div>

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
