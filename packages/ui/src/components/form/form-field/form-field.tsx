"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  Ref,
  TextareaHTMLAttributes,
} from "react";
import type { FormFieldControlBindings } from "@invessiv/common/contracts/ui/form-field-control-bindings";
import {
  FormFieldKind,
  type FormFieldKind as FormFieldKindType,
} from "@invessiv/common/constants/form/form-field-kinds";
import { FormFieldLabel } from "../form-field-label/form-field-label";
import styles from "./form-field.module.css";

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

type TextInputKind = Exclude<
  FormFieldKindType,
  | typeof FormFieldKind.Custom
  | typeof FormFieldKind.Select
  | typeof FormFieldKind.Textarea
>;

type TextFieldProps = BaseFormFieldProps & {
  inputRef?: Ref<HTMLInputElement>;
  inputProps?: InputHTMLAttributes<HTMLInputElement> & {
    ref?: Ref<HTMLInputElement>;
  };
  kind: TextInputKind;
};

type TextareaFieldProps = BaseFormFieldProps & {
  kind: typeof FormFieldKind.Textarea;
  textareaProps?: TextareaHTMLAttributes<HTMLTextAreaElement>;
};

/** Escape hatch for controls FormField can't render natively, e.g. `CustomSelect`. */
type CustomFieldProps = BaseFormFieldProps & {
  kind: typeof FormFieldKind.Custom;
  renderControl: (bindings: FormFieldControlBindings) => ReactNode;
};

export type FormFieldProps =
  TextFieldProps | TextareaFieldProps | CustomFieldProps;

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
        {props.kind === FormFieldKind.Custom
          ? renderCustom(props, resolvedErrorId, resolvedHintId)
          : null}
        {props.kind !== FormFieldKind.Textarea &&
        props.kind !== FormFieldKind.Custom
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

  if (props.kind === FormFieldKind.Custom) {
    return slugifyFieldLabel(props.label, props.kind);
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
        ref={(element) => {
          assignInputRef(props.inputProps?.ref, element);
          assignInputRef(props.inputRef, element);
        }}
        type={props.kind}
      />
      {inputSuffix ? (
        <span className={styles.endAdornment}>{inputSuffix}</span>
      ) : null}
    </span>
  );
}

function assignInputRef(
  ref: Ref<HTMLInputElement> | undefined,
  element: HTMLInputElement | null,
) {
  if (typeof ref === "function") {
    ref(element);
    return;
  }

  if (ref) {
    ref.current = element;
  }
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

function renderCustom(
  props: CustomFieldProps,
  errorMessageId?: string,
  hintId?: string,
) {
  const describedBy = [hintId, props.errorMessage ? errorMessageId : undefined]
    .filter(Boolean)
    .join(" ");

  return props.renderControl({
    describedBy: describedBy || undefined,
    invalid: Boolean(props.errorMessage),
  });
}
