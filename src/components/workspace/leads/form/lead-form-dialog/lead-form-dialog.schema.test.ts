import { describe, expect, it } from "vitest";
import { LeadValidationMessageCode } from "@/common/constants/leads/forms/lead-form-validation";
import { leadFormSchema } from "./lead-form-dialog.schema";

import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";

const baseFormValues = {
  category_id: "",
  company_name: "",
  email: "anna@example.com",
  first_name: "",
  improvements: [],
  last_name: "Meyer",
  lead_status: ContactLeadStatus.New,
  notes: "",
  owner: "",
  phone: "",
  score: "",
  social_profiles: [],
  website_url: "",
};

describe("leadFormSchema", () => {
  it("rejects an invalid social platform with the dedicated validation code", () => {
    const result = leadFormSchema.safeParse({
      ...baseFormValues,
      social_profiles: [
        {
          platform: "twitter",
          profile_url: "https://twitter.com/anna",
        },
      ],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: LeadValidationMessageCode.SocialProfileInvalid,
          path: ["social_profiles", 0, "platform"],
        }),
      ]),
    );
  });

  it("accepts supported social platforms", () => {
    expect(
      leadFormSchema.safeParse({
        ...baseFormValues,
        social_profiles: [
          {
            platform: "linkedin",
            profile_url: "https://linkedin.com/in/anna",
          },
        ],
      }).success,
    ).toBe(true);
  });
});
