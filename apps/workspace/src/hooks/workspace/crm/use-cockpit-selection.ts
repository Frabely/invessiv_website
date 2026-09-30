"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CockpitSelection } from "@/common/contracts/crm/cockpit-selection";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";

/**
 * Project tab and feedback round live in the URL, so a reload or a shared link opens the same view.
 * Selecting replaces the entry and lets the page load the data of the new selection.
 */
export function useCockpitSelection(customerId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefFor(selection: CockpitSelection): string {
    return buildCustomerCockpitHref(
      pathname,
      customerId,
      searchParams.toString(),
      selection,
    );
  }

  function select(selection: CockpitSelection) {
    router.replace(hrefFor(selection), { scroll: false });
  }

  return { hrefFor, select };
}
