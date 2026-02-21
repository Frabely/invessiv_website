export function DeliveryFlowSection(props: {
  heading: string;
  steps: string[];
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10">
      <h2 className="text-2xl font-black tracking-tight text-[var(--color-foreground)] sm:text-3xl">
        {props.heading}
      </h2>
      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        {props.steps.map((step, index) => (
          <li
            key={step}
            className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm font-semibold text-[var(--color-foreground)]"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-[var(--color-background)]">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
