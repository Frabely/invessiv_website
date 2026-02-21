import { cookies } from "next/headers";
import { localeCookieName } from "@/config/i18n";
import { getDictionary } from "@/lib/i18n/dictionary";
import { resolveLocale } from "@/lib/i18n/locale";

export async function getRequestI18n() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(localeCookieName)?.value);

  return {
    locale,
    dictionary: getDictionary(locale),
  };
}
