import Link from "next/link";
import styles from "./klarkompass-footer.module.css";

type KlarkompassNavItem = {
  href: string;
  label: string;
};

type KlarkompassFooterProps = {
  backHref: string;
  backLinkLabel: string;
  brand: string;
  conceptNote: string;
  navItems: KlarkompassNavItem[];
  tagline: string;
};

export function KlarkompassFooter({
  backHref,
  backLinkLabel,
  brand,
  conceptNote,
  navItems,
  tagline,
}: KlarkompassFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brandBlock}>
            <span className={styles.brand}>
              <span className={styles.brandMark} aria-hidden="true" />
              {brand}
            </span>
            <p className={styles.tagline}>{tagline}</p>
          </div>

          <nav aria-label={brand} className={styles.nav}>
            {navItems.map((item) => (
              <a
                className={styles.navLink}
                href={`#${item.href}`}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <p className={styles.conceptNote}>{conceptNote}</p>

        <Link className={styles.backLink} href={backHref}>
          {backLinkLabel}
        </Link>
      </div>
    </footer>
  );
}
