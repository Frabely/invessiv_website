"use client";

import {
  type FieldsetHTMLAttributes,
  forwardRef,
  type ReactNode,
  useId,
} from "react";
import { FormFieldLabel } from "../form-field-label/form-field-label";
import { FormHint } from "../form-hint/form-hint";
import styles from "./form-fieldset.module.css";

export type FormFieldsetProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  "children"
> & {
  /** The controls of the question. */
  children: ReactNode;
  /** Why the answer is not accepted, already worded. */
  errorMessage?: string | null;
  /** Shown last, below hint and error, e.g. a way to clear the answer. */
  footer?: ReactNode;
  /** Explanation below the controls, like the hint of a text field. */
  hint?: ReactNode;
  /** The question; it names the group. */
  label: string;
  required?: boolean;
};

/**
 * A question answered by several controls: the same label, spacing, hint and error as
 * `FormField`, so text fields and grouped controls line up in one form.
 */
export const FormFieldset = forwardRef<HTMLFieldSetElement, FormFieldsetProps>(
  function FormFieldset(
    {
      children,
      className,
      errorMessage = null,
      footer,
      hint,
      label,
      required = false,
      ...fieldsetProps
    },
    ref,
  ) {
    const hintId = useId();
    const describedBy = [
      fieldsetProps["aria-describedby"],
      hint ? hintId : undefined,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <fieldset
        {...fieldsetProps}
        aria-describedby={describedBy || undefined}
        className={
          className ? `${styles.fieldset} ${className}` : styles.fieldset
        }
        ref={ref}
      >
        <legend className={styles.legend}>
          <FormFieldLabel label={label} required={required} />
        </legend>
        {/* A fieldset lays its legend out itself; the body carries the spacing of everything below. */}
        <div className={styles.body}>
          {children}
          {hint ? <FormHint id={hintId}>{hint}</FormHint> : null}
          {errorMessage ? (
            <p className={styles.error} role="alert">
              {errorMessage}
            </p>
          ) : null}
          {footer}
        </div>
      </fieldset>
    );
  },
);
