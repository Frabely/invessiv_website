import Image from "next/image";
import { HomeCtaLinks } from "@/components/sections/home/home-cta-links";

export function HeroSection(props: {
  badge: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  marqueeItems: string[];
}) {
  const marqueeLoop = [...props.marqueeItems, ...props.marqueeItems];

  return (
    <section className="mx-auto w-full max-w-[1080px] px-4 pb-5 pt-11">
      <article className="mock-card-strong relative overflow-hidden rounded-[28px] px-7 py-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_240px_at_18%_20%,rgba(20,184,166,0.20),transparent_60%),radial-gradient(520px_280px_at_78%_30%,rgba(245,158,11,0.15),transparent_62%),radial-gradient(520px_280px_at_50%_84%,rgba(99,102,241,0.13),transparent_62%)]"
        />
        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mock-pill inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide">
              {props.badge}
            </p>
            <h1 className="mt-4 max-w-[20ch] text-4xl font-black leading-[1.04] tracking-[-0.6px] sm:text-5xl">
              <span className="grad-text">{props.title}</span>
            </h1>
            <p className="mt-3 max-w-[72ch] text-[15px] leading-[1.58] text-[var(--color-muted-foreground)]">
              {props.description}
            </p>
            <HomeCtaLinks
              primaryLabel={props.primaryCta}
              secondaryLabel={props.secondaryCta}
            />
            <div className="mt-4 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70">
              <div className="marquee-track py-2">
                {marqueeLoop.map((item, index) => (
                  <span
                    key={`${item}-${index}`}
                    className="marquee-item ml-2 inline-flex rounded-full px-3 py-1 text-xs font-bold text-[var(--color-foreground)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative hidden h-[280px] lg:block">
            <div className="motion-float-slow mock-card absolute left-2 top-3 h-28 w-28 rounded-2xl p-4">
              <Image src="/window.svg" alt="" width={48} height={48} />
            </div>
            <div className="motion-float-medium absolute right-8 top-12 h-36 w-36 rounded-[22px] border border-[color:rgba(20,184,166,0.45)] bg-[color:rgba(20,184,166,0.12)] p-6 shadow-[0_16px_34px_rgba(20,184,166,0.22)]">
              <Image src="/globe.svg" alt="" width={56} height={56} />
            </div>
            <div className="motion-float-fast absolute bottom-6 left-20 h-24 w-24 rounded-xl border border-[color:rgba(245,158,11,0.48)] bg-[color:rgba(245,158,11,0.16)] p-3">
              <Image src="/file.svg" alt="" width={42} height={42} />
            </div>
            <div className="motion-float-medium absolute bottom-2 right-2 h-16 w-16 rounded-full bg-[color:rgba(99,102,241,0.2)] blur-xl" />
          </div>
        </div>
      </article>
    </section>
  );
}
