import type { LeadSocialPlatform } from "@/common/constants/leads/lead-social-platforms";
import type { LeadImportRowDto } from "./lead-import-row.dto";

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

export type _EmailIsRequired = Expect<Equal<LeadImportRowDto["email"], string>>;
export type _FirstNameIsOptional = Expect<
  Equal<LeadImportRowDto["firstName"], string | undefined>
>;
export type _SocialProfilePlatformIsStable = Expect<
  Equal<
    NonNullable<LeadImportRowDto["socialProfiles"]>[number]["platform"],
    LeadSocialPlatform
  >
>;
