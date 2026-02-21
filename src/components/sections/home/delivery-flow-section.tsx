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
      <ol className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {props.steps.map((step, index) => {
          const isActive = index === activeIndex;

          return (
            <li key={step.title}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm font-semibold transition ${
                  isActive
                    ? "border-[color:rgba(20,184,166,0.55)] bg-[color:rgba(20,184,166,0.12)] text-[var(--color-foreground)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:-translate-y-[1px]"
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

      <article className="mt-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h3 className="text-base font-black text-[var(--color-foreground)]">
          {activeStep.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
          {activeStep.detail}
        </p>
        <p className="mt-3 rounded-lg border border-[color:rgba(20,184,166,0.45)] bg-[color:rgba(20,184,166,0.1)] px-2.5 py-2 text-xs font-bold text-[color:#ccfbf1]">
          {activeStep.output}
        </p>
      </article>
    </section>
  );
}
