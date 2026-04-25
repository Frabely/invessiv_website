"use client";

import { useRef } from "react";

import type {
  ProcessCtaCopy,
  ProcessStepCopy,
} from "@/i18n/dictionaries/marketing/home";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { useProcessStartPoint } from "@/hooks/marketing/use-process-start-point";
import styles from "./process-section.module.css";

type ProcessStep = ProcessStepCopy;
type ProcessCta = ProcessCtaCopy;
type ProcessField = { label: string | null; value: string };

type ProcessSectionProps = {
  description: string;
  id: string;
  processCta?: ProcessCta;
  processSteps: ProcessStep[];
  summaryPoints?: string[];
  title: string;
};

function parseProcessField(field: string | undefined): ProcessField | null {
  if (!field) {
    return null;
  }

  const normalizedField = field.trim();
  if (!normalizedField) {
    return null;
  }

  const separatorIndex = normalizedField.indexOf(":");
  if (separatorIndex <= 0 || separatorIndex >= normalizedField.length - 1) {
    return { label: null, value: normalizedField };
  }

  const label = normalizedField.slice(0, separatorIndex).trim();
  const value = normalizedField.slice(separatorIndex + 1).trim();
  if (!value) {
    return { label: null, value: normalizedField };
  }

  return {
    label: label || null,
    value,
  };
}

export function ProcessSection({
  description,
  id,
  processCta,
  processSteps,
  summaryPoints,
  title,
}: ProcessSectionProps) {
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const endCtaRef = useRef<HTMLAnchorElement | null>(null);
  const leaderRef = useRef<HTMLSpanElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const stepsRef = useRef<HTMLDivElement | null>(null);
  useProcessStartPoint({
    layoutRef,
    endCtaRef,
    leaderRef,
    pathRef,
    stepsRef,
  });

  return (
    <section className={styles.section} data-process-section="true" id={id}>
      <h2 className={styles.title}>{title}</h2>
      <SectionScanPoints
        className={styles.scanPoints}
        fallbackClassName={styles.hint}
        fallbackText={description}
        points={summaryPoints}
      />

      <div
        className={`${styles.layout} ${styles.layoutHasJourneyCtaGate}`}
        ref={layoutRef}
      >
        <svg aria-hidden="true" className={styles.journeySvg} focusable="false">
          <defs>
            <linearGradient
              id="processJourneyGradient"
              x1="0%"
              x2="0%"
              y1="0%"
              y2="100%"
            >
              <stop offset="0%" className={styles.journeyGradientStart} />
              <stop offset="100%" className={styles.journeyGradientEnd} />
            </linearGradient>
          </defs>
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
        <div className={styles.steps} ref={stepsRef} role="list">
          {processSteps.map((step, index) => {
            const parsedOutput = parseProcessField(step.result);
            const parsedMeta = parseProcessField(step.effort);

            return (
              <article
                className={styles.step}
                data-process-step="true"
                key={step.step}
                role="listitem"
                style={{
                  ["--process-step-delay" as string]: `${index * 80}ms`,
                }}
              >
                <div className={styles.stepInner}>
                  <header className={styles.stepHead}>
                    <div className={styles.stepTitleRow}>
                      <p className={styles.stepNumber}>{step.step}</p>
                      <h3 className={styles.stepTitle}>{step.title}</h3>
                    </div>
                    {step.deliverable ? (
                      <p className={styles.stepPhase}>{step.deliverable}</p>
                    ) : null}
                  </header>

                  {parsedOutput ? (
                    <section className={styles.stepOutput}>
                      {parsedOutput.label ? (
                        <p className={styles.stepOutputLabel}>
                          {parsedOutput.label}
                        </p>
                      ) : null}
                      <p className={styles.stepOutputValue}>
                        {parsedOutput.value}
                      </p>
                    </section>
                  ) : null}

                  {parsedMeta ? (
                    <p className={styles.stepMetaLine}>
                      {parsedMeta.label ? (
                        <span className={styles.stepMetaKey}>
                          {parsedMeta.label}
                        </span>
                      ) : null}
                      <span className={styles.stepMetaValue}>
                        {parsedMeta.value}
                      </span>
                    </p>
                  ) : null}

                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
