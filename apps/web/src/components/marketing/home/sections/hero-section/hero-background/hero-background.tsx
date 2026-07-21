"use client";

import heroVisualStyles from "@/components/marketing/hero-visual/hero-visual.module.css";
import { useTheme } from "@/components/providers/theme-provider";
import styles from "./hero-background.module.css";

type HeroBackgroundProps = {
  videoSrc?: string;
};

export function HeroBackground({ videoSrc }: HeroBackgroundProps) {
  const { theme } = useTheme();
  const showVideo = Boolean(videoSrc) && theme === "dark";

  return (
    <div aria-hidden="true" className={styles.layers}>
      {showVideo ? (
        <video
          aria-hidden="true"
          autoPlay
          className={styles.video}
          loop
          muted
          playsInline
          preload="metadata"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : (
        <>
          <div className={heroVisualStyles.vignette} />
          <div className={heroVisualStyles.gridOverlay} />
          <div className={heroVisualStyles.noise} />
        </>
      )}
    </div>
  );
}
