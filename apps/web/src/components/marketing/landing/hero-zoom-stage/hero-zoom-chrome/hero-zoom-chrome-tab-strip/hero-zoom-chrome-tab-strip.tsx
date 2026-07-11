import Image from "next/image";

import styles from "./hero-zoom-chrome-tab-strip.module.css";

const TAB_TITLE_LABEL = "Invessiv";

export function HeroZoomChromeTabStrip() {
  return (
    <div className={styles.tabStrip}>
      <span className={styles.dots}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </span>
      <span className={styles.tab}>
        <Image
          alt=""
          className={styles.tabFavicon}
          height={42}
          src="/brand/icon.png"
          width={42}
        />
        <span className={styles.tabLabel}>{TAB_TITLE_LABEL}</span>
        <span className={styles.tabClose}>
          <svg
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth={1.5}
            viewBox="0 0 16 16"
          >
            <path d="m4.5 4.5 7 7m0-7-7 7" />
          </svg>
        </span>
      </span>
      <span className={styles.newTab}>
        <svg
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth={1.5}
          viewBox="0 0 16 16"
        >
          <path d="M8 3.5v9M3.5 8h9" />
        </svg>
      </span>
    </div>
  );
}
