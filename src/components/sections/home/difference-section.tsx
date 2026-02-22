export function DifferenceSection(props: {
  heading: string;
  hint: string;
  items: Array<{ title: string; description: string }>;
  kpis: Array<{ value: string; suffix: string; label: string }>;
}) {
  return (
    <section className="mx-auto w-full max-w-[1080px] px-4 py-4">
      <h2 className="text-2xl font-black tracking-tight text-[var(--color-foreground)] sm:text-3xl">
        {props.heading}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{props.hint}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {props.kpis.map((kpi) => (
          <article key={kpi.label} className="mock-card rounded-3xl px-4 py-3">
            <p className="text-2xl font-black tracking-tight text-[var(--color-foreground)]">
              {kpi.value}
              <span className="ml-1 text-base font-bold text-[var(--color-muted-foreground)]">
                {kpi.suffix}
              </span>
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {kpi.label}
            </p>
          </article>
        ))}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-12">
        {props.items.map((item, index) => (
          <article
            key={item.title}
            className={`mock-card rounded-3xl p-4 md:col-span-4 ${
              index === 1 ? "md:translate-y-2" : ""
            }`}
          >
            <h3 className="text-base font-black text-[var(--color-foreground)]">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
