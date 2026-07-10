import styles from "./hero-zoom-chrome.module.css";

const CHROME_URL_LABEL = "invessiv.com";

export function HeroZoomChrome() {
  return (
    <div aria-hidden="true" className={styles.chrome} data-hero-zoom-chrome="">
      <div className={styles.bar}>
        <span className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
        <span className={styles.urlPill}>{CHROME_URL_LABEL}</span>
        <span className={styles.barSpacer} />
      </div>
    </div>
  );
}
