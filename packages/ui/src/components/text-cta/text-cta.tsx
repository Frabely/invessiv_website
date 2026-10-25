import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ComponentType,
  HTMLAttributes,
  ReactNode,
} from "react";
import { TextCtaElement } from "@invessiv/common/constants/ui/text-cta-elements";
import { TextCtaVariant } from "@invessiv/common/constants/ui/text-cta-variants";
import type { ButtonLinkComponentProps } from "@invessiv/common/contracts/ui/button-link-component-props";
import styles from "./text-cta.module.css";

type TextCtaLevelBaseProps = {
  children: ReactNode;
  className?: string;
  arrow?: boolean;
};

type TextCtaElementProps =
  | ({
      as?: typeof TextCtaElement.Anchor;
      href: string;
      linkComponent?: ComponentType<ButtonLinkComponentProps>;
      /** Additional props for an injected framework-specific link component. */
      linkComponentProps?: Record<string, unknown>;
    } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children">)
  | ({
      as: typeof TextCtaElement.Button;
    } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">)
  | ({ as: typeof TextCtaElement.Summary } & Omit<
      HTMLAttributes<HTMLElement>,
      "children"
    >);

type TextCtaLevelProps = TextCtaLevelBaseProps & TextCtaElementProps;

type TextCtaProps = TextCtaLevelProps & { variant?: TextCtaVariant };

/** Text link of the third or fourth action level; the caller sets only its font size and layout. */
export function TextCta({
  children,
  className,
  variant = TextCtaVariant.Tertiary,
  arrow = false,
  ...props
}: TextCtaProps) {
  const rootClassName = [styles.root, styles[variant], className]
    .filter(Boolean)
    .join(" ");
  const content = (
    <>
      <span className={styles.label}>{children}</span>
      {arrow ? (
        <span aria-hidden="true" className={styles.arrow}>
          &rsaquo;
        </span>
      ) : null}
    </>
  );

  if (props.as === TextCtaElement.Button) {
    const { as: Element, ...buttonProps } = props;
    return (
      <Element type="button" {...buttonProps} className={rootClassName}>
        {content}
      </Element>
    );
  }
  if (props.as === TextCtaElement.Summary) {
    const { as: Element, ...summaryProps } = props;
    return (
      <Element {...summaryProps} className={rootClassName}>
        {content}
      </Element>
    );
  }
  const {
    as: Anchor = TextCtaElement.Anchor,
    href,
    linkComponent: LinkComponent,
    linkComponentProps,
    ...anchorProps
  } = props;

  if (LinkComponent) {
    const LinkComponentWithExtraProps = LinkComponent as ComponentType<
      ButtonLinkComponentProps & Record<string, unknown>
    >;

    return (
      <LinkComponentWithExtraProps
        {...anchorProps}
        {...linkComponentProps}
        className={rootClassName}
        href={href}
      >
        {content}
      </LinkComponentWithExtraProps>
    );
  }

  return (
    <Anchor {...anchorProps} className={rootClassName} href={href}>
      {content}
    </Anchor>
  );
}

/** Third action level: text and underline in the action gradient. */
export function TertiaryCta(props: TextCtaLevelProps) {
  return <TextCta {...props} variant={TextCtaVariant.Tertiary} />;
}

/** Fourth action level: action-colored text with a gradient underline. */
export function QuaternaryCta(props: TextCtaLevelProps) {
  return <TextCta {...props} variant={TextCtaVariant.Quaternary} />;
}
