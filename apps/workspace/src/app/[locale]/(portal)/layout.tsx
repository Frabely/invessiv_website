import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isSupportedLocale } from "@/config/i18n";

type PortalRouteLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PortalRouteLayout({
  children,
  params,
}: PortalRouteLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return children;
}
