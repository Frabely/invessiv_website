"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import styles from "./radio-control.module.css";

type RadioControlProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/** The radio in the house style; the native input stays underneath and keeps keyboard and form behaviour. */
export const RadioControl = forwardRef<HTMLInputElement, RadioControlProps>(
  function RadioControl({ className, disabled, ...inputProps }, ref) {
    const rootClassName = className
      ? `${styles.root} ${className}`
      : styles.root;

    return (
      <span
        className={rootClassName}
        data-disabled={disabled ? "true" : "false"}
      >
        <input
          {...inputProps}
          className={styles.input}
          disabled={disabled}
          ref={ref}
          type="radio"
        />
        <span aria-hidden="true" className={styles.dot} />
      </span>
    );
  },
);
