export function PortalSection(props: {
  heading: string;
  hint: string;
  loginLabel: string;
  registerLabel: string;
  contactHeading: string;
  contactHint: string;
  goalPlaceholder: string;
  audiencePlaceholder: string;
  deadlinePlaceholder: string;
  messagePlaceholder: string;
  mockNote: string;
}) {
  return (
    <section className="mx-auto w-full max-w-[1080px] px-4 pb-8 pt-4">
      <div className="grid gap-3 md:grid-cols-2">
        <article className="mock-card rounded-3xl p-5">
          <h2 className="text-2xl font-black tracking-tight text-[var(--color-foreground)] sm:text-3xl">
            {props.heading}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{props.hint}</p>
          <div className="mt-4 space-y-2">
            <input
              disabled
              aria-label={props.goalPlaceholder}
              placeholder={props.goalPlaceholder}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            />
            <input
              disabled
              aria-label={props.audiencePlaceholder}
              placeholder={props.audiencePlaceholder}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            />
            <input
              disabled
              aria-label={props.deadlinePlaceholder}
              placeholder={props.deadlinePlaceholder}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            />
          </div>
          <p className="mt-3 rounded-lg border border-dashed border-[color:rgba(245,158,11,0.45)] bg-[color:rgba(245,158,11,0.08)] px-2.5 py-2 text-xs text-[color:#fde68a]">
            {props.mockNote}
          </p>
        </article>
        <article className="mock-card rounded-3xl p-5">
          <h3 className="text-lg font-black text-[var(--color-foreground)]">{props.contactHeading}</h3>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            {props.contactHint}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" className="mock-btn-primary rounded-full px-3.5 py-2 text-sm font-extrabold">
              {props.loginLabel}
            </button>
            <button type="button" className="mock-btn-soft rounded-full px-3.5 py-2 text-sm font-extrabold">
              {props.registerLabel}
            </button>
          </div>
          <textarea
            disabled
            aria-label={props.messagePlaceholder}
            placeholder={props.messagePlaceholder}
            className="mt-3 h-[110px] w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-foreground)]"
          />
          <p className="mt-3 rounded-lg border border-dashed border-[color:rgba(245,158,11,0.45)] bg-[color:rgba(245,158,11,0.08)] px-2.5 py-2 text-xs text-[color:#fde68a]">
            {props.mockNote}
          </p>
        </article>
      </div>
    </section>
  );
}
