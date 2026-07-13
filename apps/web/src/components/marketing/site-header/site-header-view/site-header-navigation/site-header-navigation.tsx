import type { SiteHeaderNavigationItem } from "@/common/contracts/marketing/site-header-navigation-item";
import styles from "./site-header-navigation.module.css";

type SiteHeaderNavigationProps = {
  ariaLabel: string;
  items: readonly SiteHeaderNavigationItem[];
};

export function SiteHeaderNavigation({
  ariaLabel,
  items,
}: SiteHeaderNavigationProps) {
  return (
    <nav aria-label={ariaLabel} className={styles.navigation}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.href}>
            <a className={styles.link} href={item.href}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
