import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20">
      <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-800">
        Next.js Foundation
      </p>
      <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
        Mehrseitige Website-Struktur fuer skalierbare Landing- und Produktseiten.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Diese Basis trennt Marketingseiten, Legal-Seiten und Shared Komponenten klar voneinander.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/kontakt" className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700">
          {siteConfig.primaryCta}
        </Link>
        <Link href="/vorlagen" className="rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-100">
          {siteConfig.secondaryCta}
        </Link>
      </div>
    </section>
  );
}
