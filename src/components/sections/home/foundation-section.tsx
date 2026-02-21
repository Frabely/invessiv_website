export function FoundationSection(props: {
  heading: string;
  items: Array<{ title: string; description: string }>;
}) {
  return (
    <section className="mx-auto w-full max-w-[1080px] px-4 py-4">
      <h2 className="text-2xl font-black tracking-tight text-[var(--color-foreground)] sm:text-3xl">
        {props.heading}
      </h2>
      <div className="mt-3 grid gap-3 md:grid-cols-12">
        {props.items.map((item, index) => (
          <article
            key={item.title}
            className={`mock-card rounded-3xl p-5 md:col-span-4 ${
              index === 0 ? "md:col-span-5" : ""
            } ${index === 2 ? "md:col-span-7" : ""}`}
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
