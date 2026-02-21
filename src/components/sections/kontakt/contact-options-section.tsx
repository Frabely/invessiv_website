import Link from "next/link";

export function ContactOptionsSection(props: {
  heading: string;
  description: string;
  primaryCta: string;
  emailLabel: string;
}) {
  return (
    <section className="mx-auto w-full max-w-[1080px] px-4 pt-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[var(--color-foreground)]">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
          {props.heading}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted-foreground)]">
          {props.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="https://calendly.com/"
            className="rounded-xl border border-[color:rgba(20,184,166,0.55)] bg-[linear-gradient(140deg,rgba(20,184,166,0.35),rgba(15,118,110,0.42))] px-4 py-2 text-sm font-extrabold text-[var(--color-foreground)]"
          >
            {props.primaryCta}
          </Link>
          <Link
            href="mailto:kontakt@invessiv.de"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm font-extrabold text-[var(--color-foreground)]"
          >
            {props.emailLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
