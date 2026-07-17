import "server-only";
import type { RangeSelection } from "@/common/contracts/range-selection";
import type { Locale } from "@/config/i18n";
import {
  getDashboardMessagingDictionary,
  getDashboardModulesDictionary,
} from "@/i18n/dictionaries/workspace/dashboard";
import { getMessagingConversion } from "@/server/workspace/dashboard/query-handler/get-messaging-conversion.query-handler";
import { MessagingConversionView } from "./messaging-conversion-view";

type MessagingConversionModuleProps = {
  locale: Locale;
  range: RangeSelection;
};

export async function MessagingConversionModule({
  locale,
  range,
}: MessagingConversionModuleProps) {
  const data = await getMessagingConversion({
    from: range.from,
    to: range.to,
  });

  const labels = getDashboardMessagingDictionary(locale);
  const modulesContent = getDashboardModulesDictionary(locale);

  return (
    <MessagingConversionView
      data={data}
      labels={labels}
      locale={locale}
      title={modulesContent.items.messaging.title}
    />
  );
}
