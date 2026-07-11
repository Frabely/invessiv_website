import styles from "./hero-zoom-chrome-toolbar.module.css";

const CHROME_URL_LABEL = "invessiv.com";

export function HeroZoomChromeToolbar() {
  return (
    <div className={styles.toolbar}>
      <span className={styles.navGroup}>
        <svg
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.6}
          viewBox="0 0 16 16"
        >
          <path d="M10.5 3.5 6 8l4.5 4.5" />
        </svg>
        <svg
          className={styles.navForward}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.6}
          viewBox="0 0 16 16"
        >
          <path d="M5.5 3.5 10 8l-4.5 4.5" />
        </svg>
        <svg
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.6}
          viewBox="0 0 16 16"
        >
          <path d="M13.2 8A5.2 5.2 0 1 1 11.6 4.24" />
          <path d="M13.4 3.2v3.2h-3.2" />
        </svg>
      </span>
      <span className={styles.urlPill}>
        <span className={styles.urlLock}>
          <svg
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth={1.5}
            viewBox="0 0 16 16"
          >
            <rect height="6.5" rx="1.8" width="9" x="3.5" y="7" />
            <path d="M5.5 7V5.4a2.5 2.5 0 0 1 5 0V7" />
          </svg>
        </span>
        <span className={styles.urlLabel}>{CHROME_URL_LABEL}</span>
      </span>
      <span className={styles.menu}>
        <svg fill="currentColor" viewBox="0 0 16 16">
          <circle cx="8" cy="3.4" r="1.3" />
          <circle cx="8" cy="8" r="1.3" />
          <circle cx="8" cy="12.6" r="1.3" />
        </svg>
      </span>
    </div>
  );
}
