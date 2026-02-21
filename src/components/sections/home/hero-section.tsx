import { HomeCtaLinks } from "@/components/sections/home/home-cta-links";

export function HeroSection(props: {
  badge: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-20">
      <p className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {props.badge}
      </p>
      <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-[var(--color-foreground)] sm:text-5xl">
        {props.title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--color-muted-foreground)]">
        {props.description}
      </p>
      <HomeCtaLinks
        primaryLabel={props.primaryCta}
        secondaryLabel={props.secondaryCta}
      />
    </section>
  );
}
