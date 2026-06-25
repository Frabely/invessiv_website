"use client";

import { useRef } from "react";

import type {
  ProcessCtaCopy,
  ProcessStepCopy,
} from "@/i18n/dictionaries/marketing/home";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { useProcessStartPoint } from "@/hooks/marketing/use-process-start-point";
import { ProcessStepCard } from "./process-step-card/process-step-card";
import styles from "./process-section.module.css";

type ProcessSectionProps = {
  description: string;
  id: string;
  processCta?: ProcessCtaCopy;
  processSteps: ProcessStepCopy[];
  summaryPoints?: string[];
  title: string;
};

export function ProcessSection({
  description,
  id,
  processCta,
  processSteps,
  summaryPoints,
  title,
}: ProcessSectionProps) {
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const endCtaRef = useRef<HTMLAnchorElement | null>(null);
  const leaderRef = useRef<HTMLSpanElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const stepsRef = useRef<HTMLOListElement | null>(null);
  useProcessStartPoint({
    layoutRef,
    headerRef,
    endCtaRef,
    leaderRef,
    pathRef,
    stepsRef,
  });

  return (
    <section className={styles.section} data-process-section="true" id={id}>
      <div className={styles.layout} ref={layoutRef}>
        <div className={styles.header} ref={headerRef}>
          <h2 className={styles.title}>{title}</h2>
          <SectionScanPoints
            className={styles.scanPoints}
            fallbackClassName={styles.hint}
            fallbackText={description}
            points={summaryPoints}
          />
        </div>

        <svg aria-hidden="true" className={styles.journeySvg} focusable="false">
          <path className={styles.journeyProgress} d="" ref={pathRef} />
        </svg>
        <span
          aria-hidden="true"
          className={`${styles.pathPoint} ${styles.pathPointStart}`}
        />
        <span
          aria-hidden="true"
          className={`${styles.pathPoint} ${styles.pathPointLeader}`}
          data-finished="false"
          ref={leaderRef}
        />

        {processCta ? (
          <PrimaryCtaLink
            className={styles.endCta}
            data-journey-active="false"
            data-journey-visible="false"
            href={processCta.href}
            ref={endCtaRef}
            data-analytics-event="cta_click"
            data-analytics-location="process"
            data-analytics-variant="primary"
            data-analytics-target="form"
          >
            {processCta.label}
          </PrimaryCtaLink>
        ) : null}

        <ol className={styles.steps} ref={stepsRef} role="list">
          {processSteps.map((step, index) => (
            <li className={styles.cell} key={step.step} role="listitem">
              <ProcessStepCard index={index} step={step} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
