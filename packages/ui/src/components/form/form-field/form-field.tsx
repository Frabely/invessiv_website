"use client";

import {
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
  useId,
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
  controlId?: string;
  kind: typeof FormFieldKind.Custom;
  renderControl: (bindings: FormFieldControlBindings) => ReactNode;
};

export type FormFieldProps =
  TextFieldProps | TextareaFieldProps | CustomFieldProps;

export function FormField(props: FormFieldProps) {
  const generatedControlId = useId();
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

  const controlId = getControlId(props, generatedControlId);
  const fieldBaseId = controlId;
  const resolvedErrorId = errorMessageId ?? `${fieldBaseId}-error`;
  const resolvedHintId = hintId ?? (hint ? `${fieldBaseId}-hint` : undefined);
  const rootClassName = className
    ? `${styles.field} ${className}`
    : styles.field;

  return (
    <div className={rootClassName}>
      <label className={styles.label} htmlFor={controlId}>
        <FormFieldLabel label={label} required={required} />
      </label>
      <div className={styles.control}>
        {props.kind === FormFieldKind.Textarea
          ? renderTextarea(
              props,
              controlId,
              controlClassName,
              resolvedErrorId,
              resolvedHintId,
            )
          : null}
        {props.kind === FormFieldKind.Custom
          ? renderCustom(props, controlId, resolvedErrorId, resolvedHintId)
          : null}
        {props.kind !== FormFieldKind.Textarea &&
        props.kind !== FormFieldKind.Custom
          ? renderInput(
              props,
              controlId,
              controlClassName,
              resolvedErrorId,
              resolvedHintId,
              inputSuffix,
            )
          : null}
      </div>
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
    </div>
  );
}

function getControlId(
  props: FormFieldProps,
  generatedControlId: string,
): string {
  if (props.kind === FormFieldKind.Textarea) {
    return (
      props.textareaProps?.id ?? props.textareaProps?.name ?? generatedControlId
    );
  }

  if (props.kind === FormFieldKind.Custom) {
    return props.controlId ?? generatedControlId;
  }

  return props.inputProps?.id ?? props.inputProps?.name ?? generatedControlId;
}

function renderInput(
  props: TextFieldProps,
  controlId: string,
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
        id={controlId}
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
  controlId: string,
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
      id={controlId}
    />
  );
}

function renderCustom(
  props: CustomFieldProps,
  controlId: string,
  errorMessageId?: string,
  hintId?: string,
) {
  const describedBy = [hintId, props.errorMessage ? errorMessageId : undefined]
    .filter(Boolean)
    .join(" ");

  return props.renderControl({
    describedBy: describedBy || undefined,
    id: controlId,
    invalid: Boolean(props.errorMessage),
  });
}
