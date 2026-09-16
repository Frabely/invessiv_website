"use client";

import { type Dispatch, type SetStateAction, useId, useState } from "react";
import {
  faPenToSquare,
  faTrash,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CustomerFieldLimits } from "@invessiv/common/constants/crm/forms/customer-field-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { CustomerContactWriteDto } from "@invessiv/common/contracts/crm/customer-contact-write.dto";
import {
  type Locale,
  SUPPORTED_LOCALES,
} from "@invessiv/common/contracts/i18n/locale";
import {
  ButtonControl,
  ConfirmDialog,
  CustomSelect,
  FormField,
  PrimaryCtaButton,
} from "@invessiv/ui";
import type {
  CustomerFormErrors,
  CustomerFormValues,
} from "@/common/contracts/crm/customer-form-values";
import {
  toCustomerContactWrite,
  validateCustomerContact,
} from "@/common/patterns/crm/customer-form";
import type { CrmFormDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./customer-contact-section.module.css";

type ContactField =
  | "contactFirstName"
  | "contactLastName"
  | "contactEmail"
  | "contactPhone"
  | "contactRoleLabel"
  | "contactPreferredLocale";

type CustomerContactSectionProps = {
  content: CrmFormDictionary;
  contacts: CustomerContactWriteDto[];
  customerExists: boolean;
  errors: CustomerFormErrors;
  locale: Locale;
  onContactFieldChange: (key: ContactField, value: string | Locale) => void;
  onErrorsChange: Dispatch<SetStateAction<CustomerFormErrors>>;
  onContactsChange: Dispatch<SetStateAction<CustomerContactWriteDto[]>>;
  values: CustomerFormValues;
};

export function CustomerContactSection({
  content,
  contacts,
  customerExists,
  errors,
  locale,
  onContactFieldChange,
  onContactsChange,
  onErrorsChange,
  values,
}: CustomerContactSectionProps) {
  const headingId = useId();
  const localeSelectId = useId();
  const [editorOpen, setEditorOpen] = useState(!customerExists);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  function errorFor(key: ContactField) {
    const code = errors[key];
    return code ? content.validation[code] : undefined;
  }

  function replaceDraft(next: Partial<CustomerFormValues>) {
    (Object.entries(next) as [ContactField, string | Locale][]).forEach(
      ([key, value]) => onContactFieldChange(key, value),
    );
  }

  function clearDraft() {
    replaceDraft({
      contactFirstName: "",
      contactLastName: "",
      contactEmail: "",
      contactPhone: "",
      contactRoleLabel: "",
      contactPreferredLocale: locale,
    });
  }

  function beginAdd() {
    clearDraft();
    setEditingIndex(null);
    setEditorOpen(true);
  }

  function beginEdit(index: number) {
    const contact = contacts[index];
    if (!contact) return;
    replaceDraft({
      contactFirstName: contact.firstName ?? "",
      contactLastName: contact.lastName ?? "",
      contactEmail: contact.email ?? "",
      contactPhone: contact.phone ?? "",
      contactRoleLabel: contact.roleLabel ?? "",
      contactPreferredLocale: contact.preferredLocale,
    });
    setEditingIndex(index);
    setEditorOpen(true);
  }

  function confirmDraft() {
    const nextErrors = validateCustomerContact(values);
    onErrorsChange((current) => ({ ...current, ...nextErrors }));
    if (Object.keys(nextErrors).length > 0) return;
    const next = toCustomerContactWrite(values, contacts.length === 0);
    onContactsChange((current) =>
      editingIndex === null
        ? [...current, next]
        : current.map((contact, index) =>
            index === editingIndex
              ? {
                  ...next,
                  id: contact.id,
                  personId: contact.personId,
                  assignmentVersion: contact.assignmentVersion,
                  personVersion: contact.personVersion,
                  isPrimary: contact.isPrimary,
                }
              : contact,
          ),
    );
    clearDraft();
    setEditorOpen(false);
    setEditingIndex(null);
  }

  function makePrimary(index: number) {
    onContactsChange((current) =>
      current.map((contact, contactIndex) => ({
        ...contact,
        isPrimary: contactIndex === index,
      })),
    );
  }

  function removeContact() {
    if (removingIndex === null) return;
    onContactsChange((current) =>
      current.filter((_, index) => index !== removingIndex),
    );
    setRemovingIndex(null);
  }

  return (
    <>
      <section
        aria-labelledby={headingId}
        className={styles.section}
        data-variant="grouped"
      >
        <div className={styles.intro}>
          <h3 className={styles.title} id={headingId}>
            {customerExists
              ? content.sections.additionalContact
              : content.sections.contact}
          </h3>
          <p className={styles.hint}>
            {customerExists
              ? content.sectionHints.additionalContact
              : content.sectionHints.contact}
          </p>
        </div>
        {contacts.length > 0 ? (
          <ul className={styles.list}>
            {contacts.map((contact, index) => (
              <li
                className={styles.listItem}
                key={contact.id ?? `new-contact-${index}`}
              >
                <span>
                  {[contact.firstName, contact.lastName]
                    .filter(Boolean)
                    .join(" ") || contact.email}
                </span>
                <div className={styles.contactMeta}>
                  {contact.roleLabel ? (
                    <span className={styles.meta}>{contact.roleLabel}</span>
                  ) : null}
                  {contact.isPrimary ? (
                    <span
                      aria-label={content.contact.primary}
                      className={styles.primaryIndicator}
                      title={content.contact.primary}
                    >
                      <FontAwesomeIcon aria-hidden="true" icon={faUserTie} />
                    </span>
                  ) : null}
                </div>
                <div className={styles.actions}>
                  <ButtonControl
                    aria-label={content.buttons.edit}
                    onClick={() => beginEdit(index)}
                    title={content.buttons.edit}
                    type="button"
                    variant="ghost"
                  >
                    <FontAwesomeIcon aria-hidden="true" icon={faPenToSquare} />
                  </ButtonControl>
                  {!contact.isPrimary ? (
                    <ButtonControl
                      aria-label={content.buttons.makePrimary}
                      onClick={() => makePrimary(index)}
                      title={content.buttons.makePrimary}
                      type="button"
                      variant="ghost"
                    >
                      <FontAwesomeIcon aria-hidden="true" icon={faUserTie} />
                    </ButtonControl>
                  ) : null}
                  <ButtonControl
                    aria-label={content.buttons.remove}
                    disabled={contact.isPrimary}
                    onClick={() => setRemovingIndex(index)}
                    title={content.buttons.remove}
                    type="button"
                    variant="ghost"
                  >
                    <FontAwesomeIcon aria-hidden="true" icon={faTrash} />
                  </ButtonControl>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {editorOpen ? (
          <div className={styles.grid}>
            <FormField
              errorMessage={errorFor("contactFirstName")}
              inputProps={{
                autoComplete: "given-name",
                maxLength: CustomerFieldLimits.PersonNameMaxLength,
                name: "contact-first-name",
                onChange: (event) =>
                  onContactFieldChange("contactFirstName", event.target.value),
                placeholder: content.placeholders.firstName,
                value: values.contactFirstName,
              }}
              kind={FormFieldKind.Text}
              label={content.fields.firstName}
            />
            <FormField
              errorMessage={errorFor("contactLastName")}
              inputProps={{
                autoComplete: "family-name",
                maxLength: CustomerFieldLimits.PersonNameMaxLength,
                name: "contact-last-name",
                onChange: (event) =>
                  onContactFieldChange("contactLastName", event.target.value),
                placeholder: content.placeholders.lastName,
                value: values.contactLastName,
              }}
              kind={FormFieldKind.Text}
              label={content.fields.lastName}
            />
            <FormField
              errorMessage={errorFor("contactEmail")}
              inputProps={{
                autoComplete: "email",
                inputMode: "email",
                maxLength: CustomerFieldLimits.EmailMaxLength,
                name: "contact-email",
                onChange: (event) =>
                  onContactFieldChange("contactEmail", event.target.value),
                placeholder: content.placeholders.email,
                value: values.contactEmail,
              }}
              kind={FormFieldKind.Email}
              label={content.fields.email}
            />
            <FormField
              errorMessage={errorFor("contactPhone")}
              inputProps={{
                autoComplete: "tel",
                inputMode: "tel",
                maxLength: CustomerFieldLimits.PhoneMaxLength,
                name: "contact-phone",
                onChange: (event) =>
                  onContactFieldChange("contactPhone", event.target.value),
                placeholder: content.placeholders.phone,
                value: values.contactPhone,
              }}
              kind={FormFieldKind.Tel}
              label={content.fields.phone}
            />
            <FormField
              inputProps={{
                autoComplete: "organization-title",
                maxLength: CustomerFieldLimits.RoleLabelMaxLength,
                name: "contact-role",
                onChange: (event) =>
                  onContactFieldChange("contactRoleLabel", event.target.value),
                placeholder: content.placeholders.roleLabel,
                value: values.contactRoleLabel,
              }}
              kind={FormFieldKind.Text}
              label={content.fields.roleLabel}
            />
            <div className={styles.selectField}>
              <span className={styles.fieldLabel}>
                {content.fields.preferredLocale}
              </span>
              <CustomSelect<Locale>
                ariaLabel={content.fields.preferredLocale}
                id={localeSelectId}
                onChange={(next) =>
                  onContactFieldChange("contactPreferredLocale", next)
                }
                options={SUPPORTED_LOCALES.map((entry) => ({
                  label: content.locales[entry],
                  value: entry,
                }))}
                value={values.contactPreferredLocale}
              />
            </div>
          </div>
        ) : null}
        {editorOpen ? (
          <div className={styles.editorActions}>
            <ButtonControl
              onClick={() => setEditorOpen(false)}
              type="button"
              variant="ghost"
            >
              {content.buttons.cancel}
            </ButtonControl>
            <PrimaryCtaButton onClick={confirmDraft} type="button">
              {content.buttons.confirmContact}
            </PrimaryCtaButton>
          </div>
        ) : (
          <ButtonControl onClick={beginAdd} type="button" variant="ghost">
            + {content.buttons.addContact}
          </ButtonControl>
        )}
      </section>
      {removingIndex !== null ? (
        <ConfirmDialog
          cancelLabel={content.buttons.cancel}
          closeLabel={content.buttons.close}
          confirmLabel={content.buttons.confirmRemoveContact}
          description={content.contact.removeDescription}
          onCancelAction={() => setRemovingIndex(null)}
          onConfirmAction={removeContact}
          title={content.contact.removeTitle}
          tone="danger"
        />
      ) : null}
    </>
  );
}
