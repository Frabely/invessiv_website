import Link from "next/link";
import { legalNavigation, mainNavigation, siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-slate-900">
          {siteConfig.name}
        </Link>
        <nav aria-label="Hauptnavigation" className="hidden gap-5 text-sm font-semibold text-slate-700 md:flex">
          {mainNavigation.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-slate-950">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-slate-600">
        <p>© {new Date().getFullYear()} invessiv</p>
        <nav aria-label="Rechtliche Navigation" className="flex gap-4">
          {legalNavigation.map((item) => (
            <Link key={item.href} href={item.href} className="underline-offset-4 hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
