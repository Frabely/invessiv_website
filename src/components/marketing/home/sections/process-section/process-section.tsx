"use client";

import { useRef } from "react";

import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
import { useProcessStartPoint } from "@/hooks/marketing/use-process-start-point";

type ProcessStep = NonNullable<LandingSectionCopy["processSteps"]>[number];
type ProcessCta = NonNullable<LandingSectionCopy["processCta"]>;

type ProcessSectionProps = {
  description: string;
  id: string;
  processCta?: ProcessCta;
  processSteps: ProcessStep[];
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
  const endCtaRef = useRef<HTMLAnchorElement | null>(null);
  const leaderRef = useRef<HTMLSpanElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const stepsRef = useRef<HTMLDivElement | null>(null);
  useProcessStartPoint({ layoutRef, endCtaRef, leaderRef, pathRef, stepsRef });

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
            className="menu-cta process-end-cta"
            href={processCta.href}
            ref={endCtaRef}
          >
            {processCta.label}
          </a>
        ) : null}
        <div className="process-steps" ref={stepsRef} role="list">
          {processSteps.map((step, index) => (
            <article
              className="process-step"
              key={step.step}
              role="listitem"
              style={{ ["--process-step-delay" as string]: `${index * 80}ms` }}
            >
              <div className="process-step-inner">
                <p className="process-step-index">{step.step}</p>
                <h3>{step.title}</h3>
                {step.deliverable ? (
                  <p className="process-deliverable">{step.deliverable}</p>
                ) : null}
                {(step.effort || step.result) && (
                  <div className="process-step-meta" role="list">
                    {step.effort ? (
                      <span role="listitem">{step.effort}</span>
                    ) : null}
                    {step.result ? (
                      <span role="listitem">{step.result}</span>
                    ) : null}
                  </div>
                )}
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
