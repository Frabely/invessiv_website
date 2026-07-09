import { HeroVisual } from "@/components/marketing/hero-visual/hero-visual";
import styles from "./hero-zoom-placeholder.module.css";

type HeroZoomPlaceholderProps = {
  ariaLabel: string;
};

export function HeroZoomPlaceholder({ ariaLabel }: HeroZoomPlaceholderProps) {
  return (
    <div className={styles.placeholder} data-hero-zoom-placeholder="">
      <div className={styles.fallback} data-hero-zoom-placeholder-fallback="">
        <HeroVisual ariaLabel={ariaLabel} />
      </div>
    </div>
  );
}
