import { HeroZoomChromeTabStrip } from "./hero-zoom-chrome-tab-strip/hero-zoom-chrome-tab-strip";
import { HeroZoomChromeToolbar } from "./hero-zoom-chrome-toolbar/hero-zoom-chrome-toolbar";
import styles from "./hero-zoom-chrome.module.css";

export function HeroZoomChrome() {
  return (
    <div aria-hidden="true" className={styles.chrome} data-hero-zoom-chrome="">
      <div className={styles.bar}>
        <HeroZoomChromeTabStrip />
        <HeroZoomChromeToolbar />
      </div>
      <div className={styles.windowFrame}>
        <span className={styles.scrollbar}>
          <span className={styles.scrollbarThumb} />
        </span>
      </div>
    </div>
  );
}
