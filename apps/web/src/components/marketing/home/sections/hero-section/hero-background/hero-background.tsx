"use client";

import heroVisualStyles from "@/components/marketing/hero-visual/hero-visual.module.css";
import { useTheme } from "@/components/providers/theme-provider";
import { useMediaQuery } from "@/hooks/marketing/use-media-query";
import styles from "./hero-background.module.css";

/** Mirrors the breakpoint the hero video is art-directed for. */
const VIDEO_MEDIA_QUERY = "(min-width: 901px)";

type HeroBackgroundProps = {
  videoSrc?: string;
};

/**
 * Gecko never re-runs resource selection on a `<source media>` once a video has
 * loaded, so the breakpoint is decided in React instead of by the media
 * attribute — a resize past it then swaps the element rather than leaving an
 * empty video box behind.
 */
export function HeroBackground({ videoSrc }: HeroBackgroundProps) {
  const { theme } = useTheme();
  const isWideViewport = useMediaQuery(VIDEO_MEDIA_QUERY);
  const usesVideo = Boolean(videoSrc) && theme === "dark";

  if (usesVideo) {
    return (
      <div aria-hidden="true" className={styles.layers}>
        {isWideViewport ? (
          <video
            aria-hidden="true"
            autoPlay
            className={styles.video}
            loop
            muted
            playsInline
            preload="metadata"
            src={videoSrc}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={styles.layers}>
      <div className={heroVisualStyles.vignette} />
      <div className={heroVisualStyles.gridOverlay} />
      <div className={heroVisualStyles.noise} />
    </div>
  );
}
