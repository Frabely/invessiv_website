import { CONTACT_OFFER_KEY } from "@invessiv/common/constants/contact/contact-offer-keys";
import {
  CONTACT_PROJECT_SCOPE,
  type ContactProjectScope,
} from "@invessiv/common/constants/contact/contact-project-scopes";
import type { PrimaryServiceKey } from "@/common/contracts/marketing/primary-service-key";

export const SERVICE_KEY_PROJECT_SCOPE: Record<
  PrimaryServiceKey,
  ContactProjectScope
> = {
  [CONTACT_OFFER_KEY.Landing]: CONTACT_PROJECT_SCOPE.LandingPage,
  [CONTACT_OFFER_KEY.Upgrade]: CONTACT_PROJECT_SCOPE.CompactWebsite,
  [CONTACT_OFFER_KEY.Web]: CONTACT_PROJECT_SCOPE.BusinessWebsite,
};

export function toContactProjectScope(
  offerKey: string | undefined,
): ContactProjectScope | null {
  if (!offerKey) {
    return null;
  }

  return SERVICE_KEY_PROJECT_SCOPE[offerKey as PrimaryServiceKey] ?? null;
}
