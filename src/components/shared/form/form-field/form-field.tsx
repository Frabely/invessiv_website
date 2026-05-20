"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import {
  FormFieldKind,
  type FormFieldKind as FormFieldKindType,
} from "@invessiv/common/constants/form/form-field-kinds";
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
  inputSuffix?: ReactNode;
  hint?: ReactNode;
  hintId?: string;
  label: string;
  required?: boolean;
};

type SelectFieldProps = BaseFormFieldProps & {
  kind: typeof FormFieldKind.Select;
  options: FieldOption[];
  selectProps?: SelectHTMLAttributes<HTMLSelectElement> & {
    "data-empty"?: string;
  };
};

type TextInputKind = Exclude<
  FormFieldKindType,
  typeof FormFieldKind.Select | typeof FormFieldKind.Textarea
>;

type TextFieldProps = BaseFormFieldProps & {
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  kind: TextInputKind;
};

type TextareaFieldProps = BaseFormFieldProps & {
  kind: typeof FormFieldKind.Textarea;
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
    inputSuffix,
    hint,
    hintId,
    label,
    required = false,
  } = props;

  const fieldBaseId = getFieldBaseId(props);
  const resolvedErrorId = errorMessageId ?? `${fieldBaseId}-error`;
  const resolvedHintId = hintId ?? (hint ? `${fieldBaseId}-hint` : undefined);
  const rootClassName = className
    ? `${styles.field} ${className}`
    : styles.field;

  return (
    <label className={rootClassName}>
      <span className={styles.label}>
        <FormFieldLabel label={label} required={required} />
      </span>
      <span className={styles.control}>
        {props.kind === FormFieldKind.Textarea
          ? renderTextarea(
              props,
              controlClassName,
              resolvedErrorId,
              resolvedHintId,
            )
          : null}
        {props.kind === FormFieldKind.Select
          ? renderSelect(
              props,
              controlClassName,
              resolvedErrorId,
              resolvedHintId,
            )
          : null}
        {props.kind !== FormFieldKind.Textarea &&
        props.kind !== FormFieldKind.Select
          ? renderInput(
              props,
              controlClassName,
              resolvedErrorId,
              resolvedHintId,
              inputSuffix,
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

function getFieldBaseId(props: FormFieldProps): string {
  if (props.kind === FormFieldKind.Textarea) {
    return (
      props.textareaProps?.id ??
      props.textareaProps?.name ??
      slugifyFieldLabel(props.label, props.kind)
    );
  }

  if (props.kind === FormFieldKind.Select) {
    return (
      props.selectProps?.id ??
      props.selectProps?.name ??
      slugifyFieldLabel(props.label, props.kind)
    );
  }

  return (
    props.inputProps?.id ??
    props.inputProps?.name ??
    slugifyFieldLabel(props.label, props.kind)
  );
}

function slugifyFieldLabel(label: string, kind: string): string {
  const normalizedLabel = label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return normalizedLabel ? `${normalizedLabel}-${kind}` : kind;
}

function renderInput(
  props: TextFieldProps,
  controlClassName?: string,
  errorMessageId?: string,
  hintId?: string,
  inputSuffix?: ReactNode,
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
    <span className={styles.inputShell}>
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
      {inputSuffix ? (
        <span className={styles.endAdornment}>{inputSuffix}</span>
      ) : null}
    </span>
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
