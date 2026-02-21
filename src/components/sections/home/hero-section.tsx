import { HomeCtaLinks } from "@/components/sections/home/home-cta-links";

export function HeroSection(props: {
  badge: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
}) {
  return (
    <section className="mx-auto w-full max-w-[1080px] px-4 pb-5 pt-11">
      <article className="rounded-[22px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] px-7 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <p className="inline-flex rounded-full border border-[color:rgba(20,184,166,0.55)] bg-[color:rgba(20,184,166,0.12)] px-3 py-1 text-xs font-black uppercase tracking-wide text-[color:#ccfbf1]">
          {props.badge}
        </p>
        <h1 className="mt-4 max-w-[18ch] text-4xl font-black leading-[1.05] tracking-[-0.5px] text-[var(--color-foreground)] sm:text-5xl">
          {props.title}
        </h1>
        <p className="mt-3 max-w-[72ch] text-[15px] leading-[1.58] text-[var(--color-muted-foreground)]">
          {props.description}
        </p>
        <HomeCtaLinks
          primaryLabel={props.primaryCta}
          secondaryLabel={props.secondaryCta}
        />
      </article>
    </section>
  );
}
