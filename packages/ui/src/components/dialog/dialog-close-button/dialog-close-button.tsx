import { forwardRef, type ButtonHTMLAttributes } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { ActionIcon } from "../../action-icon/action-icon";
import { SecondaryCtaButton } from "../../button/button";
import styles from "./dialog-close-button.module.css";

export type DialogCloseButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "aria-label"
> & {
  label: string;
};

/** Shared dismissal control for standard dialogs, lightboxes and sheets. */
export const DialogCloseButton = forwardRef<
  HTMLButtonElement,
  DialogCloseButtonProps
>(function DialogCloseButton({ className, label, ...props }, ref) {
  return (
    <SecondaryCtaButton
      {...props}
      aria-label={label}
      className={[styles.closeButton, className].filter(Boolean).join(" ")}
      ref={ref}
      size="icon"
      title={label}
      type="button"
    >
      <ActionIcon icon={faXmark} />
    </SecondaryCtaButton>
  );
});
