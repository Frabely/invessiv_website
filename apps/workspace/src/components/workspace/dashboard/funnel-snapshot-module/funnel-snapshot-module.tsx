import "server-only";
import type { RangeSelection } from "@/common/contracts/range-selection";
import type { Locale } from "@/config/i18n";
import {
  getDashboardFunnelDictionary,
  getDashboardModulesDictionary,
} from "@/i18n/dictionaries/workspace/dashboard";
import { getFunnelSnapshot } from "@/server/workspace/dashboard/query-handler/get-funnel-snapshot.query-handler";
import { FunnelSnapshotView } from "./funnel-snapshot-view";

type FunnelSnapshotModuleProps = {
  locale: Locale;
  range: RangeSelection;
};

export async function FunnelSnapshotModule({
  locale,
  range,
}: FunnelSnapshotModuleProps) {
  const data = await getFunnelSnapshot({
    from: range.from,
    to: range.to,
  });

  const labels = getDashboardFunnelDictionary(locale);
  const modulesContent = getDashboardModulesDictionary(locale);

  return (
    <FunnelSnapshotView
      data={data}
      labels={labels}
      locale={locale}
      title={modulesContent.items.funnel.title}
    />
  );
}
