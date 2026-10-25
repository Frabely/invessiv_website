import type { ButtonHTMLAttributes, ReactNode } from "react";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { ActionIcon } from "@invessiv/ui";
import styles from "./disclosure-button.module.css";

type DisclosureButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "aria-expanded"
> & {
  children: ReactNode;
  expanded: boolean;
};

export function DisclosureButton({
  children,
  expanded,
  className,
  ...props
}: DisclosureButtonProps) {
  return (
    <button
      type="button"
      {...props}
      aria-expanded={expanded}
      className={[styles.button, className].filter(Boolean).join(" ")}
    >
      <span className={styles.label}>{children}</span>
      <span aria-hidden="true" className={styles.marker}>
        <ActionIcon icon={faChevronDown} />
      </span>
    </button>
  );
}
