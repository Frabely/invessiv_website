import Image from "next/image";
import Link from "next/link";
import logoMark from "@/references/klarkompass-coaching/assets/klarkompass-logo-mark.png";
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
  homeHref: string;
  navItems: KlarkompassNavItem[];
  tagline: string;
};

export function KlarkompassFooter({
  backHref,
  backLinkLabel,
  brand,
  conceptNote,
  homeHref,
  navItems,
  tagline,
}: KlarkompassFooterProps) {
  return (
    <footer className={styles.footer}>
      <span aria-hidden="true" className={styles.bearingLine} />
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brandBlock}>
            <a className={styles.brand} href={homeHref}>
              <span aria-hidden="true" className={styles.brandMark}>
                <Image
                  alt=""
                  className={styles.brandMarkImg}
                  height={32}
                  src={logoMark}
                  width={32}
                />
              </span>
              {brand}
            </a>
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

        <div className={styles.bottom}>
          <Link className={styles.backLink} href={backHref}>
            <span aria-hidden="true" className={styles.backArrow}>
              &larr;
            </span>
            {backLinkLabel}
          </Link>

          <span aria-hidden="true" className={styles.coordinate}>
            <span className={styles.coordinateMark} />
            <span className={styles.coordinateValue}>000&deg;</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
