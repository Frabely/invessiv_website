import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { requireDashboardAccess } from "@/lib/auth/permissions";

type DashboardLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const activeLocale = locale as Locale;
  await requireDashboardAccess(activeLocale);

  return <main id="main-content">{children}</main>;
}
