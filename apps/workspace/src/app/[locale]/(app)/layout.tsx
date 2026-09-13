import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { listPermittedWorkspaceAreas } from "@/common/patterns/auth/list-permitted-workspace-areas";
import { WorkspaceShell } from "@/components/workspace/workspace-shell/workspace-shell";
import { isSupportedLocale } from "@/config/i18n";
import { getWorkspacePageContent } from "@/i18n/dictionaries/workspace";
import { requireWorkspaceActor } from "@/lib/auth/permissions";

type WorkspaceLayoutProps = {
  children: ReactNode;
  params: Promise<unknown>;
};

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const routeParams = await params;
  const locale =
    typeof routeParams === "object" &&
    routeParams !== null &&
    "locale" in routeParams &&
    typeof routeParams.locale === "string"
      ? routeParams.locale
      : null;
  if (!locale || !isSupportedLocale(locale)) {
    notFound();
  }

  const activeLocale = locale;
  const actor = await requireWorkspaceActor(activeLocale);
  const content = getWorkspacePageContent(activeLocale);

  return (
    <WorkspaceShell
      content={content}
      locale={activeLocale}
      permittedAreas={listPermittedWorkspaceAreas(actor)}
    >
      {children}
    </WorkspaceShell>
  );
}
