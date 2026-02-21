export function DeliveryFlowSection(props: {
  heading: string;
  steps: string[];
}) {
  return (
    <section className="mx-auto w-full max-w-[1080px] px-4 pb-8 pt-4">
      <h2 className="text-2xl font-black tracking-tight text-[var(--color-foreground)] sm:text-3xl">
        {props.heading}
      </h2>
      <ol className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {props.steps.map((step, index) => (
          <li
            key={step}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm font-semibold text-[var(--color-foreground)]"
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
