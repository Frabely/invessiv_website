import Link from "next/link";

export function TemplateProductsSection(props: {
  heading: string;
  ctaLabel: string;
  products: Array<{
    title: string;
    price: string;
    format: string;
  }>;
}) {
  return (
    <section className="mx-auto w-full max-w-[1080px] px-4 pb-8 pt-4">
      <h2 className="text-2xl font-black tracking-tight text-[var(--color-foreground)] sm:text-3xl">
        {props.heading}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {props.products.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {item.format}
            </p>
            <h3 className="mt-2 text-lg font-black text-[var(--color-foreground)]">
              {item.title}
            </h3>
            <p className="mt-4 text-sm font-semibold text-[var(--color-foreground)]">
              {item.price}
            </p>
            <Link
              href="/kontakt"
              className="mt-4 inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3.5 py-2 text-sm font-extrabold text-[var(--color-foreground)] transition hover:-translate-y-[1px] hover:bg-[var(--color-surface)]"
            >
              {props.ctaLabel}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
