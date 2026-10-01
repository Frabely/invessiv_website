import { OnboardingFormQueryParam } from "@/common/constants/crm/onboarding/onboarding-form-query-params";

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
