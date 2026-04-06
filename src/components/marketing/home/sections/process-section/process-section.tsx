"use client";

import { useRef } from "react";

import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
import buttonStyles from "@/components/shared/button/button.module.css";
import { useProcessStartPoint } from "@/hooks/marketing/use-process-start-point";

type ProcessStep = NonNullable<LandingSectionCopy["processSteps"]>[number];
type ProcessCta = NonNullable<LandingSectionCopy["processCta"]>;
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
    <section className="process-section" id={id}>
      <h2>{title}</h2>
      <SectionScanPoints
        fallbackClassName="process-hint"
        fallbackText={description}
        points={summaryPoints}
      />

      <div className="process-layout has-journey-cta-gate" ref={layoutRef}>
        <svg
          aria-hidden="true"
          className="process-journey-svg"
          focusable="false"
        >
          <defs>
            <linearGradient
              id="processJourneyGradient"
              x1="0%"
              x2="0%"
              y1="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{ stopColor: "var(--color-accent-warm)" }}
              />
              <stop offset="100%" style={{ stopColor: "var(--color-cta)" }} />
            </linearGradient>
          </defs>
          <path className="process-journey-progress" d="" ref={pathRef} />
        </svg>
        <span
          aria-hidden="true"
          className="process-path-point process-path-point--start"
        />
        <span
          aria-hidden="true"
          className="process-path-point process-path-point--leader"
          ref={leaderRef}
        />
        {processCta ? (
          <a
            className={`${buttonStyles.button} ${buttonStyles.primary} process-end-cta`}
            href={processCta.href}
            ref={endCtaRef}
            data-analytics-event="cta_click"
            data-analytics-location="process"
            data-analytics-variant="primary"
            data-analytics-target="form"
          >
            {processCta.label}
          </a>
        ) : null}
        <div className="process-steps" ref={stepsRef} role="list">
          {processSteps.map((step, index) => {
            const parsedOutput = parseProcessField(step.result);
            const parsedMeta = parseProcessField(step.effort);

            return (
              <article
                className="process-step"
                key={step.step}
                role="listitem"
                style={{
                  ["--process-step-delay" as string]: `${index * 80}ms`,
                }}
              >
                <div className="process-step-inner">
                  <header className="process-step-head">
                    <div className="process-step-title-row">
                      <p className="process-step-number">{step.step}</p>
                      <h3 className="process-step-title">{step.title}</h3>
                    </div>
                    {step.deliverable ? (
                      <p className="process-step-phase">{step.deliverable}</p>
                    ) : null}
                  </header>

                  {parsedOutput ? (
                    <section className="process-step-output">
                      {parsedOutput.label ? (
                        <p className="process-step-output-label">
                          {parsedOutput.label}
                        </p>
                      ) : null}
                      <p className="process-step-output-value">
                        {parsedOutput.value}
                      </p>
                    </section>
                  ) : null}

                  {parsedMeta ? (
                    <p className="process-step-meta-line">
                      {parsedMeta.label ? (
                        <span className="process-step-meta-key">
                          {parsedMeta.label}
                        </span>
                      ) : null}
                      <span className="process-step-meta-value">
                        {parsedMeta.value}
                      </span>
                    </p>
                  ) : null}

                  <p className="process-step-description">{step.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
