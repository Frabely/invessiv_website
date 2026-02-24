"use client";

import { useRef } from "react";

import type { LandingSectionCopy } from "@/content/landing/home";
import { useProcessStartPoint } from "@/hooks/marketing/use-process-start-point";

type ProcessStep = NonNullable<LandingSectionCopy["processSteps"]>[number];
type ProcessRole = NonNullable<LandingSectionCopy["processRoles"]>[number];
type ProcessCta = NonNullable<LandingSectionCopy["processCta"]>;

type ProcessSectionProps = {
  description: string;
  id: string;
  processCta?: ProcessCta;
  processRoles: ProcessRole[];
  processSteps: ProcessStep[];
  summary?: string;
  title: string;
};

export function ProcessSection({
  description,
  id,
  processCta,
  processRoles,
  processSteps,
  summary,
  title,
}: ProcessSectionProps) {
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const stepsRef = useRef<HTMLDivElement | null>(null);
  useProcessStartPoint({ layoutRef, stepsRef });

  return (
    <section className="process-section" id={id}>
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

      <div className="process-layout" ref={layoutRef}>
        <span aria-hidden="true" className="process-start-point" />
        <span aria-hidden="true" className="process-end-point" />
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
