"use client";

import type { FieldValues, Path, UseFormRegister } from "react-hook-form";
import { CONTACT_FIELD_ERROR_CODE } from "@invessiv/common/constants/contact/contact-field-error-codes";
import { CONTACT_FORM_FIELD_NAME } from "@invessiv/common/constants/contact/contact-form-field-names";
import { FormRequiredMarker } from "@/components/shared/form/form-required-marker/form-required-marker";
import styles from "./contact-consent-field.module.css";

type ContactConsentFieldProps<TValues extends FieldValues> = {
  checkboxClassName?: string;
  className: string;
  consentLabel: string;
  errorClassName: string;
  errorId: string;
  errorMessage?: string;
  privacyHref: string;
  privacyLabel: string;
  privacySuffix?: string;
  registerAction: UseFormRegister<TValues>;
};

export function ContactConsentField<TValues extends FieldValues>({
  checkboxClassName,
  className,
  consentLabel,
  errorClassName,
  errorId,
  errorMessage,
  privacyHref,
  privacyLabel,
  privacySuffix,
  registerAction,
}: ContactConsentFieldProps<TValues>) {
  const consentField = CONTACT_FORM_FIELD_NAME.ConsentAccepted as Path<TValues>;

  return (
    <label className={className}>
      <input
        {...registerAction(consentField, {
          validate: (value) =>
            value || CONTACT_FIELD_ERROR_CODE.ConsentRequired,
        })}
        aria-describedby={errorId}
        aria-invalid={errorMessage ? "true" : undefined}
        className={checkboxClassName}
        type="checkbox"
      />
      <span className={styles.text}>
        {consentLabel}{" "}
        <span className={styles.privacyGroup}>
          <a className={styles.link} href={privacyHref} target="_self">
            {privacyLabel}
          </a>
          {privacySuffix}
          <FormRequiredMarker className={styles.requiredMarker} />
        </span>
      </span>
      <p
        aria-hidden={errorMessage ? undefined : "true"}
        className={`${errorClassName}${errorMessage ? "" : ` ${styles.errorHidden}`}`}
        id={errorId}
        role={errorMessage ? "alert" : undefined}
      >
        {errorMessage ?? " "}
      </p>
    </label>
  );
}
