export function FoundationSection(props: {
  heading: string;
  items: Array<{ title: string; description: string }>;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12">
      <h2 className="text-2xl font-black tracking-tight text-[var(--color-foreground)] sm:text-3xl">
        {props.heading}
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {props.items.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <h3 className="text-base font-bold text-[var(--color-foreground)]">
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
