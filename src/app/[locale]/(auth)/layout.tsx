import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AuthFrame } from "@/components/auth/auth-frame/auth-frame";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { getAuthContent } from "@/i18n/dictionaries/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AuthLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AuthLayout({
  children,
  params,
}: AuthLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const activeLocale = locale as Locale;
  const content = getAuthContent(activeLocale);

  return (
    <AuthFrame content={content.frame} locale={activeLocale}>
      {children}
    </AuthFrame>
  );
}
