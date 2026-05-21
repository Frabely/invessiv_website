import "server-only";
import type { RangeSelection } from "@/common/contracts/range-selection";
import type { Locale } from "@/config/i18n";
import {
  getDashboardAcquisitionVolumeDictionary,
  getDashboardModulesDictionary,
} from "@/i18n/dictionaries/workspace/dashboard";
import { getAcquisitionVolume } from "@/server/workspace/dashboard/query-handler/get-acquisition-volume.query-handler";
import { AcquisitionVolumeView } from "./acquisition-volume-view";

type AcquisitionVolumeModuleProps = {
  locale: Locale;
  range: RangeSelection;
};

export async function AcquisitionVolumeModule({
  locale,
  range,
}: AcquisitionVolumeModuleProps) {
  const data = await getAcquisitionVolume({
    from: range.from,
    to: range.to,
    previousFrom: range.previousFrom,
    previousTo: range.previousTo,
  });

  const labels = getDashboardAcquisitionVolumeDictionary(locale);
  const modulesContent = getDashboardModulesDictionary(locale);

  return (
    <AcquisitionVolumeView
      data={data}
      labels={labels}
      locale={locale}
      title={modulesContent.items.acquisitionVolume.title}
    />
  );
}
