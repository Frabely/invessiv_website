import Link from "next/link";

export function PricingSection(props: {
  heading: string;
  hint: string;
  plans: Array<{ title: string; price: string; features: string[] }>;
  mockNote: string;
  buttonLabel: string;
}) {
  return (
    <section className="mx-auto w-full max-w-[1080px] px-4 py-4">
      <h2 className="text-2xl font-black tracking-tight text-[var(--color-foreground)] sm:text-3xl">
        {props.heading}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{props.hint}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {props.plans.map((plan) => (
          <article
            key={plan.title}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <h3 className="text-base font-black text-[var(--color-foreground)]">
              {plan.title}
            </h3>
            <p className="mt-2 text-3xl font-black leading-none text-[var(--color-foreground)]">
              {plan.price}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-[var(--color-muted-foreground)]">
              {plan.features.map((feature) => (
                <li key={feature}>- {feature}</li>
              ))}
            </ul>
            <Link
              href="/kontakt"
              className="mt-4 inline-flex rounded-xl border border-[color:rgba(245,158,11,0.48)] bg-[linear-gradient(140deg,rgba(245,158,11,0.2),rgba(180,83,9,0.25))] px-3.5 py-2 text-sm font-extrabold text-[var(--color-foreground)] transition hover:-translate-y-[1px]"
            >
              {props.buttonLabel}
            </Link>
            <p className="mt-3 rounded-lg border border-dashed border-[color:rgba(245,158,11,0.45)] bg-[color:rgba(245,158,11,0.08)] px-2.5 py-2 text-xs text-[color:#fde68a]">
              {props.mockNote}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
