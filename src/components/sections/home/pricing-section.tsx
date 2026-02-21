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
      <div className="mt-3 grid gap-3 md:grid-cols-12">
        {props.plans.map((plan, index) => (
          <article
            key={plan.title}
            className={`mock-card rounded-3xl p-5 md:col-span-4 ${
              index === 1 ? "md:scale-[1.01]" : ""
            }`}
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
              className="mock-btn-primary mt-4 inline-flex rounded-full px-3.5 py-2 text-sm font-extrabold transition hover:-translate-y-[1px]"
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
