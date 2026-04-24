import Link from "next/link";
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import styles from "./button.module.css";

type ButtonVariant = "primary" | "ghost";

type ButtonBaseProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

type ButtonLinkProps = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className"> & {
    href: string;
    useNextLink?: boolean;
  };

type ButtonControlProps = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">;

function getButtonClassName(variant: ButtonVariant, className?: string) {
  return [styles.button, styles[variant], className].filter(Boolean).join(" ");
}

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  function ButtonLink(
    {
      children,
      className,
      href,
      useNextLink = false,
      variant = "primary",
      ...props
    },
    ref,
  ) {
    const buttonClassName = getButtonClassName(variant, className);

    if (useNextLink) {
      return (
        <Link
          {...props}
          className={buttonClassName}
          data-cursor-variant={variant}
          href={href}
          ref={ref}
        >
          {children}
        </Link>
      );
    }

    return (
      <a
        {...props}
        className={buttonClassName}
        data-cursor-variant={variant}
        href={href}
        ref={ref}
      >
        {children}
      </a>
    );
  },
);

export const ButtonControl = forwardRef<HTMLButtonElement, ButtonControlProps>(
  function ButtonControl(
    { children, className, variant = "primary", ...props },
    ref,
  ) {
    return (
      <button
        {...props}
        className={getButtonClassName(variant, className)}
        data-cursor-variant={variant}
        ref={ref}
      >
        {children}
      </button>
    );
  },
);

export const PrimaryCtaLink = forwardRef<
  HTMLAnchorElement,
  Omit<ButtonLinkProps, "variant">
>(function PrimaryCtaLink(props, ref) {
  return <ButtonLink {...props} ref={ref} variant="primary" />;
});

export const PrimaryCtaButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonControlProps, "variant">
>(function PrimaryCtaButton(props, ref) {
  return <ButtonControl {...props} ref={ref} variant="primary" />;
});
