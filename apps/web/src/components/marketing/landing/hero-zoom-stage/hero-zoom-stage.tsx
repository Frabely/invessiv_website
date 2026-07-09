"use client";

import type { ReactNode } from "react";
import { useRef } from "react";

import { HERO_ZOOM_STATE } from "@/common/constants/marketing";
import { useHeroZoom } from "@/hooks/marketing/use-hero-zoom";
import styles from "./hero-zoom-stage.module.css";

type HeroZoomStageProps = {
  heroSlot: ReactNode;
  frameSlot: ReactNode;
};

export function HeroZoomStage({ heroSlot, frameSlot }: HeroZoomStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const heroPinRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);

  useHeroZoom({ stageRef, heroPinRef, frameRef });

  return (
    <div
      className={styles.stage}
      data-zoom-state={HERO_ZOOM_STATE.Pending}
      ref={stageRef}
    >
      <div className={styles.heroPin} ref={heroPinRef}>
        {heroSlot}
      </div>
      <div aria-hidden="true" className={styles.spacer} />
      <div className={styles.frame} ref={frameRef}>
        <div aria-hidden="true" className={styles.frameBackdrop} />
        {frameSlot}
      </div>
    </div>
  );
}
