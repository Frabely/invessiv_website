import { OnboardingFormQueryParam } from "@/common/constants/crm/onboarding/onboarding-form-query-params";
import {
  ONBOARDING_FORM_TAB_VALUES,
  OnboardingFormTab,
} from "@/common/constants/crm/onboarding/onboarding-form-tabs";

/** An unknown or missing tab is the structure, the tab the page opens with. */
export function readOnboardingFormTab(
  params: URLSearchParams,
): OnboardingFormTab {
  const requested = params.get(OnboardingFormQueryParam.Tab);
  return (
    ONBOARDING_FORM_TAB_VALUES.find((tab) => tab === requested) ??
    OnboardingFormTab.Structure
  );
}

/** Selects a tab and keeps every other param; the default tab leaves no param behind. */
export function buildOnboardingFormTabHref(
  pathname: string,
  queryString: string,
  tab: OnboardingFormTab,
): string {
  const params = new URLSearchParams(queryString);
  if (tab === OnboardingFormTab.Structure)
    params.delete(OnboardingFormQueryParam.Tab);
  else params.set(OnboardingFormQueryParam.Tab, tab);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** The id is not checked against the form here; the page opens nothing for an unknown one. */
export function readOnboardingFormBlockId(
  params: URLSearchParams,
): string | null {
  return params.get(OnboardingFormQueryParam.Block) || null;
}

/** Selects a block or clears the selection and keeps every other param of the page. */
export function buildOnboardingFormHref(
  pathname: string,
  queryString: string,
  blockId: string | null,
): string {
  const params = new URLSearchParams(queryString);
  if (blockId) params.set(OnboardingFormQueryParam.Block, blockId);
  else params.delete(OnboardingFormQueryParam.Block);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
