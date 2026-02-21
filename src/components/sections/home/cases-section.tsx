export function CasesSection(props: {
  heading: string;
  hint: string;
  cases: Array<{ title: string; description: string; metrics: string[] }>;
}) {
  return (
    <section className="mx-auto w-full max-w-[1080px] px-4 py-4">
      <h2 className="text-2xl font-black tracking-tight text-[var(--color-foreground)] sm:text-3xl">
        {props.heading}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{props.hint}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {props.cases.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <h3 className="text-base font-bold text-[var(--color-foreground)]">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
              {item.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.metrics.map((metric) => (
                <span
                  key={metric}
                  className="rounded-full border border-[color:rgba(20,184,166,0.45)] bg-[color:rgba(20,184,166,0.1)] px-2.5 py-1 text-xs font-bold text-[color:#ccfbf1]"
                >
                  {metric}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
