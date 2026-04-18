"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { ContactFieldLabel } from "@/components/marketing/home/sections/contact-section/shared/contact-field-label/contact-field-label";
import styles from "./contact-form-field.module.css";

type FieldOption = {
  label: string;
  value: string;
};

type BaseContactFormFieldProps = {
  className?: string;
  controlClassName?: string;
  errorMessage?: string;
  errorMessageId?: string;
  hint?: ReactNode;
  hintId?: string;
  label: string;
  required?: boolean;
};

type SelectFieldProps = BaseContactFormFieldProps & {
  kind: "select";
  options: FieldOption[];
  selectProps?: SelectHTMLAttributes<HTMLSelectElement> & {
    "data-empty"?: string;
  };
};

type TextFieldProps = BaseContactFormFieldProps & {
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  kind: "email" | "tel" | "text" | "url";
};

type TextareaFieldProps = BaseContactFormFieldProps & {
  kind: "textarea";
  textareaProps?: TextareaHTMLAttributes<HTMLTextAreaElement>;
};

export type ContactFormFieldProps =
  | SelectFieldProps
  | TextFieldProps
  | TextareaFieldProps;

export function ContactFormField(props: ContactFormFieldProps) {
  const {
    className,
    controlClassName,
    errorMessage,
    errorMessageId,
    hint,
    hintId,
    label,
    required = false,
  } = props;

  const rootClassName = className
    ? `${styles.field} ${className}`
    : styles.field;

  return (
    <label className={rootClassName}>
      <span className={styles.label}>
        <ContactFieldLabel label={label} required={required} />
      </span>
      <span className={styles.control}>
        {props.kind === "textarea"
          ? renderTextarea(props, controlClassName, errorMessageId, hintId)
          : null}
        {props.kind === "select"
          ? renderSelect(props, controlClassName, errorMessageId, hintId)
          : null}
        {props.kind !== "textarea" && props.kind !== "select"
          ? renderInput(props, controlClassName, errorMessageId, hintId)
          : null}
      </span>
      {hint ? (
        <small className={styles.hint} id={hintId}>
          {hint}
        </small>
      ) : null}
      <small
        aria-hidden={errorMessage ? undefined : "true"}
        className={`${styles.error}${errorMessage ? "" : ` ${styles.errorHidden}`}`}
        id={errorMessageId}
        role={errorMessage ? "alert" : undefined}
      >
        {errorMessage ?? "\u00A0"}
      </small>
    </label>
  );
}

function renderInput(
  props: TextFieldProps,
  controlClassName?: string,
  errorMessageId?: string,
  hintId?: string,
) {
  const describedBy = [
    props.inputProps?.["aria-describedby"],
    hintId,
    errorMessageId,
  ]
    .filter(Boolean)
    .join(" ");
  const className = [props.inputProps?.className, controlClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <input
      {...props.inputProps}
      aria-describedby={describedBy || undefined}
      className={className || undefined}
      type={props.kind}
    />
  );
}

function renderTextarea(
  props: TextareaFieldProps,
  controlClassName?: string,
  errorMessageId?: string,
  hintId?: string,
) {
  const describedBy = [
    props.textareaProps?.["aria-describedby"],
    hintId,
    errorMessageId,
  ]
    .filter(Boolean)
    .join(" ");
  const className = [props.textareaProps?.className, controlClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <textarea
      {...props.textareaProps}
      aria-describedby={describedBy || undefined}
      className={className || undefined}
    />
  );
}

function renderSelect(
  props: SelectFieldProps,
  controlClassName?: string,
  errorMessageId?: string,
  hintId?: string,
) {
  const describedBy = [
    props.selectProps?.["aria-describedby"],
    hintId,
    errorMessageId,
  ]
    .filter(Boolean)
    .join(" ");
  const className = [props.selectProps?.className, controlClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <select
      {...props.selectProps}
      aria-describedby={describedBy || undefined}
      className={className || undefined}
    >
      {props.options.map((option) => (
        <option key={`${option.value}-${option.label}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
