import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";
import {
  TEXT_CTA_ELEMENT,
  TEXT_CTA_VARIANT,
  type TextCtaVariant,
} from "@/common/constants/ui/text-cta";
import styles from "./text-cta.module.css";

type TextCtaBaseProps = {
  children: ReactNode;
  className?: string;
  variant?: TextCtaVariant;
  arrow?: boolean;
};

type TextCtaProps = TextCtaBaseProps &
  (
    | ({
        as?: typeof TEXT_CTA_ELEMENT.Anchor;
        href: string;
        useNextLink?: boolean;
      } & AnchorHTMLAttributes<HTMLAnchorElement>)
    | ({
        as: typeof TEXT_CTA_ELEMENT.Button;
      } & ButtonHTMLAttributes<HTMLButtonElement>)
    | ({ as: typeof TEXT_CTA_ELEMENT.Summary } & HTMLAttributes<HTMLElement>)
  );

export function TextCta({
  children,
  className,
  variant = TEXT_CTA_VARIANT.Tertiary,
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

  if (props.as === TEXT_CTA_ELEMENT.Button) {
    const { as: Element, ...buttonProps } = props;
    return (
      <Element type="button" {...buttonProps} className={rootClassName}>
        {content}
      </Element>
    );
  }
  if (props.as === TEXT_CTA_ELEMENT.Summary) {
    const { as: Element, ...summaryProps } = props;
    return (
      <Element {...summaryProps} className={rootClassName}>
        {content}
      </Element>
    );
  }
  const {
    as: element = TEXT_CTA_ELEMENT.Anchor,
    useNextLink = false,
    ...anchorProps
  } = props;
  const Element = useNextLink ? Link : element;
  return (
    <Element {...anchorProps} className={rootClassName}>
      {content}
    </Element>
  );
}
