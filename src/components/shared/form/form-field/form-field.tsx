"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useId } from "react";
import { FormFieldLabel } from "@/components/shared/form/form-field-label/form-field-label";
import styles from "./form-field.module.css";

type FieldOption = {
  label: string;
  value: string;
};

type BaseFormFieldProps = {
  className?: string;
  controlClassName?: string;
  errorMessage?: string;
  errorMessageId?: string;
  hint?: ReactNode;
  hintId?: string;
  label: string;
  required?: boolean;
};

type SelectFieldProps = BaseFormFieldProps & {
  kind: "select";
  options: FieldOption[];
  selectProps?: SelectHTMLAttributes<HTMLSelectElement> & {
    "data-empty"?: string;
  };
};

type TextFieldProps = BaseFormFieldProps & {
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  kind: "email" | "number" | "tel" | "text" | "url";
};

type TextareaFieldProps = BaseFormFieldProps & {
  kind: "textarea";
  textareaProps?: TextareaHTMLAttributes<HTMLTextAreaElement>;
};

export type FormFieldProps =
  | SelectFieldProps
  | TextFieldProps
  | TextareaFieldProps;

export function FormField(props: FormFieldProps) {
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

  const generatedId = useId();
  const resolvedErrorId = errorMessageId ?? `${generatedId}-error`;
  const resolvedHintId = hintId ?? (hint ? `${generatedId}-hint` : undefined);
  const rootClassName = className
    ? `${styles.field} ${className}`
    : styles.field;

  return (
    <label className={rootClassName}>
      <span className={styles.label}>
        <FormFieldLabel label={label} required={required} />
      </span>
      <span className={styles.control}>
        {props.kind === "textarea"
          ? renderTextarea(
              props,
              controlClassName,
              resolvedErrorId,
              resolvedHintId,
            )
          : null}
        {props.kind === "select"
          ? renderSelect(
              props,
              controlClassName,
              resolvedErrorId,
              resolvedHintId,
            )
          : null}
        {props.kind !== "textarea" && props.kind !== "select"
          ? renderInput(
              props,
              controlClassName,
              resolvedErrorId,
              resolvedHintId,
            )
          : null}
      </span>
      {hint ? (
        <small className={styles.hint} id={resolvedHintId}>
          {hint}
        </small>
      ) : null}
      <small
        aria-hidden={errorMessage ? undefined : "true"}
        className={`${styles.error}${errorMessage ? "" : ` ${styles.errorHidden}`}`}
        id={resolvedErrorId}
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
    props.errorMessage ? errorMessageId : undefined,
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
      aria-invalid={
        props.inputProps?.["aria-invalid"] ??
        (props.errorMessage ? "true" : undefined)
      }
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
    props.errorMessage ? errorMessageId : undefined,
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
      aria-invalid={
        props.textareaProps?.["aria-invalid"] ??
        (props.errorMessage ? "true" : undefined)
      }
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
    props.errorMessage ? errorMessageId : undefined,
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
      aria-invalid={
        props.selectProps?.["aria-invalid"] ??
        (props.errorMessage ? "true" : undefined)
      }
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
