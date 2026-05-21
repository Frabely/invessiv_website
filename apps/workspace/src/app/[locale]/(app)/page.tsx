import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { getWorkspaceMetaContent } from "@/i18n/dictionaries/workspace";
import { dashboardPathFor } from "@/lib/auth/routes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type WorkspacePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: WorkspacePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const content = getWorkspaceMetaContent(locale as Locale);
  return {
    title: content.title,
    description: content.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  redirect(dashboardPathFor(locale));
}
