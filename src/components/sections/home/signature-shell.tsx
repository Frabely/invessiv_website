import { ParallaxOrbs } from "@/components/motion/parallax-orbs";

export function SignatureShell(props: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <ParallaxOrbs />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-2 top-0 hidden h-full w-12 md:block"
      >
        <div className="absolute left-5 top-0 h-full w-px bg-[linear-gradient(180deg,rgba(20,184,166,0.05),rgba(20,184,166,0.45),rgba(245,158,11,0.42),rgba(20,184,166,0.05))]" />
        <span className="absolute left-[14px] top-[8%] h-3 w-3 rounded-full border border-[color:rgba(20,184,166,0.5)] bg-[var(--color-surface)]" />
        <span className="absolute left-[14px] top-[37%] h-3 w-3 rounded-full border border-[color:rgba(20,184,166,0.5)] bg-[var(--color-surface)]" />
        <span className="absolute left-[14px] top-[63%] h-3 w-3 rounded-full border border-[color:rgba(245,158,11,0.52)] bg-[var(--color-surface)]" />
        <span className="absolute left-[14px] top-[89%] h-3 w-3 rounded-full border border-[color:rgba(20,184,166,0.5)] bg-[var(--color-surface)]" />
      </div>
      <div className="relative z-10">{props.children}</div>
    </div>
  );
}
