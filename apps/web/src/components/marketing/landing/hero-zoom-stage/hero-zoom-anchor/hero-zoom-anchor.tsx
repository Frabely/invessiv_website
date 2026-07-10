import styles from "./hero-zoom-anchor.module.css";

export function HeroZoomAnchor() {
  return (
    <span
      aria-hidden="true"
      className={styles.anchor}
      data-hero-zoom-placeholder=""
    />
  );
}
