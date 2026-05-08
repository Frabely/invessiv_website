import { describe, expect, it } from "vitest";
import { LeadValidationMessageCode } from "@/common/constants/leads/lead-form-validation";
import { addLeadFormSchema } from "./add-lead-dialog.schema";

const baseFormValues = {
  category_id: "",
  company_name: "",
  email: "anna@example.com",
  first_name: "",
  improvements: [],
  last_name: "Meyer",
  notes: "",
  owner: "",
  phone: "",
  score: "",
  social_profiles: [],
  website_url: "",
};

describe("addLeadFormSchema", () => {
  it("rejects an invalid social platform with the dedicated validation code", () => {
    const result = addLeadFormSchema.safeParse({
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
      addLeadFormSchema.safeParse({
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
