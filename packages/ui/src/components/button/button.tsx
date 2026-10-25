import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ComponentType,
  forwardRef,
  type ReactNode,
} from "react";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import type { ButtonLinkComponentProps } from "@invessiv/common/contracts/ui/button-link-component-props";
import styles from "./button.module.css";

type ButtonBaseProps = {
  children: ReactNode;
  className?: string;
  /** `control` inside forms, next to inputs; `icon` for a button that shows only an icon. */
  size?: ButtonSize;
  variant?: ButtonVariant;
};

type ButtonLinkProps = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className"> & {
    href: string;
    linkComponent?: ComponentType<ButtonLinkComponentProps>;
    /** Additional props for an injected framework-specific link component. */
    linkComponentProps?: Record<string, unknown>;
  };

type ButtonControlProps = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">;

function getButtonClassName(
  variant: ButtonVariant,
  className?: string,
  size: ButtonSize = ButtonSize.Default,
) {
  return [
    styles.button,
    styles[variant],
    size === ButtonSize.Default ? undefined : styles[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/** The ghost label carries the gradient hover text without recoloring the button surface. */
function renderButtonContent(variant: ButtonVariant, children: ReactNode) {
  return variant === ButtonVariant.Ghost ? (
    <span className={styles.ghostLabel}>{children}</span>
  ) : (
    children
  );
}

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  function ButtonLink(
    {
      children,
      className,
      href,
      linkComponent: LinkComponent,
      linkComponentProps,
      size,
      variant = "primary",
      ...props
    },
    ref,
  ) {
    const buttonClassName = getButtonClassName(variant, className, size);

    if (LinkComponent) {
      const LinkComponentWithExtraProps = LinkComponent as ComponentType<
        ButtonLinkComponentProps & Record<string, unknown>
      >;

      return (
        <LinkComponentWithExtraProps
          {...props}
          {...linkComponentProps}
          className={buttonClassName}
          href={href}
          ref={ref}
        >
          {renderButtonContent(variant, children)}
        </LinkComponentWithExtraProps>
      );
    }

    return (
      <a {...props} className={buttonClassName} href={href} ref={ref}>
        {renderButtonContent(variant, children)}
      </a>
    );
  },
);

export const ButtonControl = forwardRef<HTMLButtonElement, ButtonControlProps>(
  function ButtonControl(
    { children, className, size, variant = "primary", ...props },
    ref,
  ) {
    return (
      <button
        {...props}
        className={getButtonClassName(variant, className, size)}
        ref={ref}
      >
        {renderButtonContent(variant, children)}
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

/** Link form of the second action level. */
export const SecondaryCtaLink = forwardRef<
  HTMLAnchorElement,
  Omit<ButtonLinkProps, "variant">
>(function SecondaryCtaLink(props, ref) {
  return <ButtonLink {...props} ref={ref} variant="ghost" />;
});

/** The second action next to a primary one, or a lone action that must not compete with it. */
export const SecondaryCtaButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonControlProps, "variant">
>(function SecondaryCtaButton(props, ref) {
  return <ButtonControl {...props} ref={ref} variant="ghost" />;
});
