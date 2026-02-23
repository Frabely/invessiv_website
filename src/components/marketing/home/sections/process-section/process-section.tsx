import type { RefObject } from "react";

import type { LandingSectionCopy } from "@/content/landing/home";

type ProcessStep = NonNullable<LandingSectionCopy["processSteps"]>[number];
type ProcessRole = NonNullable<LandingSectionCopy["processRoles"]>[number];
type ProcessCta = NonNullable<LandingSectionCopy["processCta"]>;

type ProcessSectionProps = {
  description: string;
  id: string;
  processCta?: ProcessCta;
  processDotRef: RefObject<SVGCircleElement | null>;
  processPathRef: RefObject<SVGPathElement | null>;
  processRoles: ProcessRole[];
  processSectionRef: RefObject<HTMLElement | null>;
  processSteps: ProcessStep[];
  processStepsRef: RefObject<HTMLDivElement | null>;
  summary?: string;
  title: string;
};

export function ProcessSection({
  description,
  id,
  processCta,
  processDotRef,
  processPathRef,
  processRoles,
  processSectionRef,
  processSteps,
  processStepsRef,
  summary,
  title,
}: ProcessSectionProps) {
  return (
    <section className="process-section" id={id} ref={processSectionRef}>
      <h2>{title}</h2>
      <p className="process-hint">{description}</p>
      {summary ? (
        <p className="process-summary" role="status">
          {summary}
        </p>
      ) : null}

      <div className="process-intro">
        {processRoles.length ? (
          <div className="process-roles-inline" role="list">
            {processRoles.map((role) => (
              <p className="process-role-line" key={role.label} role="listitem">
                <strong>{role.label}:</strong> {role.items.join(" | ")}
              </p>
            ))}
          </div>
        ) : null}

        {processCta ? (
          <aside className="process-intro-cta">
            <a className="btn btn--primary" href={processCta.href}>
              {processCta.label}
            </a>
            <p>{processCta.hint}</p>
          </aside>
        ) : null}
      </div>

      <div className="process-layout">
        <svg
          aria-label="Process journey path"
          className="process-journey-svg process-journey-svg--overlay"
          role="img"
          viewBox="0 0 1200 900"
        >
          <defs>
            <linearGradient
              id="processJourneyStroke"
              x1="0%"
              x2="0%"
              y1="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#52e0c2" />
              <stop offset="50%" stopColor="#7da3ff" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          <path
            className="process-journey-path"
            d="M80 40 C 80 220, 1120 220, 1120 360 C 1120 520, 80 520, 80 680 C 80 760, 1120 760, 1120 860"
            fill="none"
            ref={processPathRef}
            stroke="url(#processJourneyStroke)"
            strokeLinecap="round"
            strokeWidth="10"
          />
          <circle
            className="process-journey-dot"
            cx="80"
            cy="40"
            r="12"
            ref={processDotRef}
          />
        </svg>

        <div className="process-steps" ref={processStepsRef} role="list">
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
