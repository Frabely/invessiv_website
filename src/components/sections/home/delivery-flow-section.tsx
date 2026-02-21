"use client";

import { useState } from "react";

export function DeliveryFlowSection(props: {
  heading: string;
  hint: string;
  steps: Array<{
    title: string;
    detail: string;
    output: string;
  }>;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = props.steps[activeIndex];

  return (
    <section className="mx-auto w-full max-w-[1080px] px-4 pb-8 pt-4">
      <h2 className="text-2xl font-black tracking-tight text-[var(--color-foreground)] sm:text-3xl">
        {props.heading}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{props.hint}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-[0.95fr_1.05fr]">
        <ol className="mock-card rounded-3xl p-3">
          {props.steps.map((step, index) => {
            const isActive = index === activeIndex;

            return (
              <li key={step.title}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                    isActive
                      ? "border-[color:rgba(20,184,166,0.55)] bg-[color:rgba(20,184,166,0.12)] text-[var(--color-foreground)]"
                      : "border-transparent text-[var(--color-foreground)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
                  }`}
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-[var(--color-background)]">
                    {index + 1}
                  </span>
                  <span>{step.title}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <article className="mock-card rounded-3xl p-5">
          <h3 className="text-lg font-black text-[var(--color-foreground)]">
            {activeStep.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
            {activeStep.detail}
          </p>
          <p className="mt-3 rounded-xl border border-[color:rgba(20,184,166,0.45)] bg-[color:rgba(20,184,166,0.1)] px-3 py-2 text-xs font-bold text-[var(--color-foreground)]">
            {activeStep.output}
          </p>
        </article>
      </div>
    </section>
  );
}
