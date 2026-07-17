import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { AcquisitionVolumeModule } from "@/components/workspace/dashboard/acquisition-volume-module/acquisition-volume-module";
import { DashboardGrid } from "@/components/workspace/dashboard/dashboard-grid/dashboard-grid";
import { MessagingConversionModule } from "@/components/workspace/dashboard/messaging-conversion-module/messaging-conversion-module";
import { DashboardDateRangeFilter } from "@/components/workspace/dashboard/dashboard-date-range-filter/dashboard-date-range-filter";
import { DashboardPageHeader } from "@/components/workspace/dashboard/dashboard-page-header/dashboard-page-header";
import { WorkspacePageShell } from "@/components/workspace/workspace-page-shell/workspace-page-shell";
import {
  getDashboardHeaderDictionary,
  getDashboardMetaDictionary,
  getDashboardRangeFilterDictionary,
} from "@/i18n/dictionaries/workspace/dashboard";
import { dashboardPathFor } from "@/lib/auth/routes";
import { serializeDashboardSearchParams } from "@/lib/workspace/dashboard/dashboard-query-string";
import { rangeResolverService } from "@/server/workspace/dashboard/services/range-resolver-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DashboardPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }
  const meta = getDashboardMetaDictionary(locale as Locale);
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function DashboardPage({
  params,
  searchParams,
}: DashboardPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const activeLocale = locale as Locale;
  const resolvedSearchParams = await searchParams;

  const headerContent = getDashboardHeaderDictionary(activeLocale);
  const rangeFilterContent = getDashboardRangeFilterDictionary(activeLocale);
  const rangeSelection =
    rangeResolverService.resolveDashboardRange(resolvedSearchParams);
  const basePath = dashboardPathFor(activeLocale);
  const currentQueryString =
    serializeDashboardSearchParams(resolvedSearchParams);

  return (
    <WorkspacePageShell pageId="dashboard">
      <DashboardPageHeader
        content={headerContent}
        rangeFilter={
          <DashboardDateRangeFilter
            basePath={basePath}
            currentQueryString={currentQueryString}
            fromValue={rangeSelection.fromInputValue}
            labels={rangeFilterContent}
            toValue={rangeSelection.toInputValue}
          />
        }
      />
      <DashboardGrid
        slots={{
          acquisitionVolume: (
            <AcquisitionVolumeModule
              locale={activeLocale}
              range={rangeSelection}
            />
          ),
          messaging: (
            <MessagingConversionModule
              locale={activeLocale}
              range={rangeSelection}
            />
          ),
        }}
      />
    </WorkspacePageShell>
  );
}
