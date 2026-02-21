import Image from "next/image";
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
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
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
          </div>

          <div className="relative hidden h-[260px] lg:block">
            <div className="motion-float-slow absolute left-3 top-3 h-28 w-28 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_12px_24px_rgba(0,0,0,0.25)]">
              <Image src="/window.svg" alt="" width={48} height={48} />
            </div>
            <div className="motion-float-medium absolute right-8 top-12 h-32 w-32 rounded-[20px] border border-[color:rgba(20,184,166,0.55)] bg-[color:rgba(20,184,166,0.12)] p-5 shadow-[0_14px_28px_rgba(20,184,166,0.18)]">
              <Image src="/globe.svg" alt="" width={56} height={56} />
            </div>
            <div className="motion-float-fast absolute bottom-4 left-20 h-24 w-24 rounded-xl border border-[color:rgba(245,158,11,0.48)] bg-[color:rgba(245,158,11,0.15)] p-3">
              <Image src="/file.svg" alt="" width={42} height={42} />
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
