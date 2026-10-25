import type { ComponentType, ReactNode } from "react";
import type { BreadcrumbItem } from "@invessiv/common/contracts/ui/breadcrumb-item";
import type { ButtonLinkComponentProps } from "@invessiv/common/contracts/ui/button-link-component-props";
import { TertiaryCta } from "../text-cta/text-cta";
import styles from "./breadcrumbs.module.css";

type BreadcrumbsProps = {
  className?: string;
  items: BreadcrumbItem[];
  /** Makes every entry at least 44px high, for surfaces that require full-size touch targets. */
  largeTargets?: boolean;
  linkComponent?: ComponentType<ButtonLinkComponentProps>;
  navLabel: string;
  /** Renders the last entry, e.g. as the page heading; plain text otherwise. */
  renderCurrent?: (label: string) => ReactNode;
};

/** The way from the start page to the current one; the last entry is the current page. */
export function Breadcrumbs({
  className,
  items,
  largeTargets = false,
  linkComponent: LinkComponent,
  navLabel,
  renderCurrent,
}: BreadcrumbsProps) {
  const navClassName = className ? `${styles.nav} ${className}` : styles.nav;

  return (
    <nav
      aria-label={navLabel}
      className={navClassName}
      data-large-targets={largeTargets ? "true" : undefined}
    >
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          let entry: ReactNode;

          if (isLast) {
            entry = renderCurrent ? (
              renderCurrent(item.label)
            ) : (
              <span className={styles.current}>{item.label}</span>
            );
          } else if (item.href) {
            entry = (
              <TertiaryCta
                className={styles.link}
                href={item.href}
                linkComponent={LinkComponent}
              >
                {item.label}
              </TertiaryCta>
            );
          } else {
            entry = <span className={styles.current}>{item.label}</span>;
          }

          return (
            <li
              aria-current={isLast ? "page" : undefined}
              className={styles.item}
              key={`${item.label}-${index}`}
            >
              {entry}
              {!isLast ? (
                <span aria-hidden="true" className={styles.separator} />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
