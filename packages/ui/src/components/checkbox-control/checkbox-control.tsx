"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import styles from "./checkbox-control.module.css";

type CheckboxControlProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const CheckboxControl = forwardRef<
  HTMLInputElement,
  CheckboxControlProps
>(function CheckboxControl({ className, disabled, ...inputProps }, ref) {
  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  return (
    <span className={rootClassName} data-disabled={disabled ? "true" : "false"}>
      <input
        {...inputProps}
        className={styles.input}
        disabled={disabled}
        ref={ref}
        type="checkbox"
      />
      <span aria-hidden="true" className={styles.box} />
    </span>
  );
});
