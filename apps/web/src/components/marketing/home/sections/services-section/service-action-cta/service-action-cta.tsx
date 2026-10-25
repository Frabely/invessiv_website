import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEventHandler,
  ReactNode,
} from "react";

import styles from "./service-action-cta.module.css";
import { TertiaryCta } from "@invessiv/ui";

type BaseServiceActionCtaProps = {
  children: ReactNode;
  className?: string;
};

type ServiceActionCtaLinkProps = BaseServiceActionCtaProps & {
  href: string;
  onClick?: never;
} & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "children" | "className" | "href"
  >;

type ServiceActionCtaButtonProps = BaseServiceActionCtaProps & {
  href?: never;
  onClick: MouseEventHandler<HTMLButtonElement>;
} & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "className" | "onClick" | "type"
  >;

type ServiceActionCtaProps =
  ServiceActionCtaLinkProps | ServiceActionCtaButtonProps;

function actionClassName(className?: string) {
  return className ? `${styles.cta} ${className}` : styles.cta;
}

export function ServiceActionCta({
  children,
  className,
  href,
  onClick,
  ...restProps
}: ServiceActionCtaProps) {
  if (href !== undefined) {
    return (
      <TertiaryCta
        arrow
        className={actionClassName(className)}
        href={href}
        {...(restProps as Omit<
          AnchorHTMLAttributes<HTMLAnchorElement>,
          "children" | "className" | "href"
        >)}
      >
        {children}
      </TertiaryCta>
    );
  }

  return (
    <TertiaryCta
      as="button"
      arrow
      className={actionClassName(className)}
      onClick={onClick}
      type="button"
      {...(restProps as Omit<
        ButtonHTMLAttributes<HTMLButtonElement>,
        "children" | "className" | "onClick" | "type"
      >)}
    >
      {children}
    </TertiaryCta>
  );
}
