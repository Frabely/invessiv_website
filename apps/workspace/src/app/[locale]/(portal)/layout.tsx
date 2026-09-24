import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { FeatureFlag, isFeatureEnabled } from "@/config/feature-flags";
import { isSupportedLocale } from "@/config/i18n";

type PortalRouteLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * The single flag check for every portal route: off, every descendant answers 404 before any
 * auth or DB lookup runs. Individual pages still fail closed on their own, but this is the first
 * line, matching the architecture's "Flag aus: notFound()" order.
 */
export default async function PortalRouteLayout({
  children,
  params,
}: PortalRouteLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale) || !isFeatureEnabled(FeatureFlag.Portal)) {
    notFound();
  }

  return children;
}
