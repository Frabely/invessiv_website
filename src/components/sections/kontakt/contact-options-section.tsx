import Link from "next/link";

export function ContactOptionsSection(props: {
  heading: string;
  description: string;
  primaryCta: string;
  emailLabel: string;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-10">
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-[var(--color-foreground)]">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
          {props.heading}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted-foreground)]">
          {props.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="https://calendly.com/"
            className="rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-background)]"
          >
            {props.primaryCta}
          </Link>
          <Link
            href="mailto:kontakt@invessiv.de"
            className="rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-foreground)]"
          >
            {props.emailLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
