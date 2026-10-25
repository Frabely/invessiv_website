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
import { FormHint } from "../form-hint/form-hint";
import styles from "./form-field.module.css";

type BaseFormFieldProps = {
  className?: string;
  controlClassName?: string;
  errorMessage?: string;
  errorMessageId?: string;
  /** Sits inside the input at its start, e.g. a preview of the value; the text moves aside. */
  inputPrefix?: ReactNode;
  inputSuffix?: ReactNode;
  /** A control-high action next to the input, outside its frame, e.g. a picker for the value. */
  inputAction?: ReactNode;
  hint?: ReactNode;
  hintId?: string;
  label: string;
  /** Sits at the end of the label row, e.g. a character counter; hidden from assistive tech. */
  labelSuffix?: ReactNode;
  required?: boolean;
  /**
   * Keeps an empty line below the control for an error, so it does not push the form when it
   * appears. Switch it off where fields sit in rows and must end at the same height.
   */
  reserveErrorSpace?: boolean;
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
  /**
   * Opens as high as a one-line input and grows with what is typed, instead of reserving a tall
   * box up front. Browsers that cannot size a field by its content keep the drag handle.
   */
  autoGrow?: boolean;
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
    inputAction,
    inputPrefix,
    inputSuffix,
    hint,
    hintId,
    label,
    labelSuffix,
    required = false,
    reserveErrorSpace = true,
  } = props;

  const controlId = getControlId(props, generatedControlId);
  const fieldBaseId = controlId;
  const resolvedErrorId = errorMessageId ?? `${fieldBaseId}-error`;
  const resolvedHintId = hintId ?? (hint ? `${fieldBaseId}-hint` : undefined);
  const rootClassName = className
    ? `${styles.field} ${className}`
    : styles.field;
  const labelElement = (
    <label className={styles.label} htmlFor={controlId}>
      <FormFieldLabel label={label} required={required} />
    </label>
  );

  return (
    <div className={rootClassName}>
      {labelSuffix ? (
        <div className={styles.labelRow}>
          {labelElement}
          <span aria-hidden="true" className={styles.labelSuffix}>
            {labelSuffix}
          </span>
        </div>
      ) : (
        labelElement
      )}
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
              { action: inputAction, prefix: inputPrefix, suffix: inputSuffix },
            )
          : null}
      </div>
      {hint ? <FormHint id={resolvedHintId}>{hint}</FormHint> : null}
      {errorMessage || reserveErrorSpace ? (
        <small
          aria-hidden={errorMessage ? undefined : "true"}
          className={`${styles.error}${errorMessage ? "" : ` ${styles.errorHidden}`}`}
          id={resolvedErrorId}
          role={errorMessage ? "alert" : undefined}
        >
          {errorMessage ?? "\u00A0"}
        </small>
      ) : null}
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

type InputAdornments = {
  action?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
};

function renderInput(
  props: TextFieldProps,
  controlId: string,
  controlClassName: string | undefined,
  errorMessageId: string | undefined,
  hintId: string | undefined,
  adornments: InputAdornments,
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

  const shell = (
    <span
      className={styles.inputShell}
      data-prefixed={adornments.prefix ? "true" : undefined}
      data-suffixed={adornments.suffix ? "true" : undefined}
    >
      {adornments.prefix ? (
        <span className={styles.startAdornment}>{adornments.prefix}</span>
      ) : null}
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
      {adornments.suffix ? (
        <span className={styles.endAdornment}>{adornments.suffix}</span>
      ) : null}
    </span>
  );

  if (!adornments.action) {
    return shell;
  }

  return (
    <span className={styles.inputRow}>
      {shell}
      {adornments.action}
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
  const className = [
    props.textareaProps?.className,
    controlClassName,
    props.autoGrow ? styles.autoGrow : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={styles.inputShell}>
      <textarea
        rows={props.autoGrow ? 1 : undefined}
        {...props.textareaProps}
        aria-describedby={describedBy || undefined}
        aria-invalid={
          props.textareaProps?.["aria-invalid"] ??
          (props.errorMessage ? "true" : undefined)
        }
        className={className || undefined}
        id={controlId}
      />
    </span>
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
