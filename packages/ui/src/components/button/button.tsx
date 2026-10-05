import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ComponentType,
  forwardRef,
  type ReactNode,
  type Ref,
} from "react";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import styles from "./button.module.css";

type ButtonVariant = "primary" | "ghost" | "quiet";

type ButtonBaseProps = {
  children: ReactNode;
  className?: string;
  /** `control` inside forms, next to inputs; `icon` for a button that shows only an icon. */
  size?: ButtonSize;
  variant?: ButtonVariant;
};

type ButtonLinkComponentProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "children" | "className"
> & {
  children: ReactNode;
  className?: string;
  href: string;
  ref?: Ref<HTMLAnchorElement>;
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
          {children}
        </LinkComponentWithExtraProps>
      );
    }

    return (
      <a {...props} className={buttonClassName} href={href} ref={ref}>
        {children}
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

/** The second action next to a primary one, or a lone action that must not compete with it. */
export const SecondaryCtaButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonControlProps, "variant">
>(function SecondaryCtaButton(props, ref) {
  return <ButtonControl {...props} ref={ref} variant="ghost" />;
});
