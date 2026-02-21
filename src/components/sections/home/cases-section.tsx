export function CasesSection(props: {
  heading: string;
  hint: string;
  labels: {
    problem: string;
    action: string;
    result: string;
  };
  cases: Array<{
    title: string;
    problem: string;
    action: string;
    result: string;
    metrics: string[];
  }>;
}) {
  return (
    <section className="mx-auto w-full max-w-[1080px] px-4 py-4">
      <h2 className="text-2xl font-black tracking-tight text-[var(--color-foreground)] sm:text-3xl">
        {props.heading}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{props.hint}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-12">
        {props.cases.map((item, index) => (
          <article
            key={item.title}
            className={`mock-card rounded-3xl p-4 ${
              index === 0 ? "md:col-span-7" : "md:col-span-5"
            }`}
          >
            <h3 className="text-base font-black text-[var(--color-foreground)]">
              {item.title}
            </h3>

            <div className="mt-3 space-y-2 text-sm">
              <p className="text-[var(--color-muted-foreground)]">
                <span className="font-black text-[var(--color-foreground)]">
                  {props.labels.problem}:
                </span>{" "}
                {item.problem}
              </p>
              <p className="text-[var(--color-muted-foreground)]">
                <span className="font-black text-[var(--color-foreground)]">
                  {props.labels.action}:
                </span>{" "}
                {item.action}
              </p>
              <p className="text-[var(--color-muted-foreground)]">
                <span className="font-black text-[var(--color-foreground)]">
                  {props.labels.result}:
                </span>{" "}
                {item.result}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {item.metrics.map((metric) => (
                <span
                  key={metric}
                  className="rounded-full border border-[color:rgba(20,184,166,0.45)] bg-[color:rgba(20,184,166,0.1)] px-2.5 py-1 text-xs font-bold text-[var(--color-foreground)]"
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
