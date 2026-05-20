import { z } from "zod";
import { LEAD_SOCIAL_PLATFORMS_VALUES } from "@invessiv/common/constants/leads/social/lead-social-platforms";

export const socialProfileSchema = z.object({
  platform: z.enum(LEAD_SOCIAL_PLATFORMS_VALUES),
  profile_url: z.string().trim().pipe(z.url()),
});
