export function PortalSection(props: {
  heading: string;
  hint: string;
  loginLabel: string;
  registerLabel: string;
  mockNote: string;
}) {
  return (
    <section className="mx-auto w-full max-w-[1080px] px-4 pb-8 pt-4">
      <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="text-2xl font-black tracking-tight text-[var(--color-foreground)] sm:text-3xl">
          {props.heading}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{props.hint}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3.5 py-2 text-sm font-extrabold text-[var(--color-foreground)]"
          >
            {props.loginLabel}
          </button>
          <button
            type="button"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3.5 py-2 text-sm font-extrabold text-[var(--color-foreground)]"
          >
            {props.registerLabel}
          </button>
        </div>
        <p className="mt-3 rounded-lg border border-dashed border-[color:rgba(245,158,11,0.45)] bg-[color:rgba(245,158,11,0.08)] px-2.5 py-2 text-xs text-[color:#fde68a]">
          {props.mockNote}
        </p>
      </article>
    </section>
  );
}
