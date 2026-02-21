import Link from "next/link";

export function PageIntroCard(props: {
  badge: string;
  title: string;
  description: string;
  hint: string;
  primaryAction: { href: string; label: string };
  secondaryAction: { href: string; label: string };
}) {
  return (
    <section className="mx-auto w-full max-w-[1080px] px-4 pb-3 pt-5">
      <article className="rounded-[22px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] px-6 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
        <p className="inline-flex rounded-full border border-[color:rgba(20,184,166,0.55)] bg-[color:rgba(20,184,166,0.12)] px-3 py-1 text-xs font-black uppercase tracking-wide text-[color:#ccfbf1]">
          {props.badge}
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--color-foreground)] sm:text-4xl">
          {props.title}
        </h1>
        <p className="mt-3 max-w-3xl text-[var(--color-muted-foreground)]">
          {props.description}
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          {props.hint}
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            href={props.primaryAction.href}
            className="rounded-xl border border-[color:rgba(20,184,166,0.55)] bg-[linear-gradient(140deg,rgba(20,184,166,0.35),rgba(15,118,110,0.42))] px-4 py-2 text-sm font-extrabold text-[var(--color-foreground)] transition hover:-translate-y-[1px]"
          >
            {props.primaryAction.label}
          </Link>
          <Link
            href={props.secondaryAction.href}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm font-extrabold text-[var(--color-foreground)] transition hover:-translate-y-[1px] hover:bg-[var(--color-surface)]"
          >
            {props.secondaryAction.label}
          </Link>
        </div>
      </article>
    </section>
  );
}
