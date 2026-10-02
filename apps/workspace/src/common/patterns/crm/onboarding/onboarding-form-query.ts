import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { OnboardingFormQueryParam } from "@/common/constants/crm/onboarding/onboarding-form-query-params";
import {
  ONBOARDING_FORM_TAB_VALUES,
  OnboardingFormTab,
} from "@/common/constants/crm/onboarding/onboarding-form-tabs";

/**
 * The tab a form opens with: its structure while the team still builds or reviews it, its answers
 * once it is completed and only read.
 */
export function defaultOnboardingFormTab(
  status: OnboardingFormStatus,
): OnboardingFormTab {
  return status === OnboardingFormStatus.Completed
    ? OnboardingFormTab.Answers
    : OnboardingFormTab.Structure;
}

/** An unknown or missing tab is the default one, the tab the page opens with. */
export function readOnboardingFormTab(
  params: URLSearchParams,
  defaultTab: OnboardingFormTab = OnboardingFormTab.Structure,
): OnboardingFormTab {
  const requested = params.get(OnboardingFormQueryParam.Tab);
  return (
    ONBOARDING_FORM_TAB_VALUES.find((tab) => tab === requested) ?? defaultTab
  );
}

/** Selects a tab and keeps every other param; the default tab leaves no param behind. */
export function buildOnboardingFormTabHref(
  pathname: string,
  queryString: string,
  tab: OnboardingFormTab,
  defaultTab: OnboardingFormTab = OnboardingFormTab.Structure,
): string {
  const params = new URLSearchParams(queryString);
  if (tab === defaultTab) params.delete(OnboardingFormQueryParam.Tab);
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
