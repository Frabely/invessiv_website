import { describe, expect, it } from "vitest";
import type { AddLeadFormValues } from "@/common/contracts/leads/forms/add-lead-form-values";
import { mapAddLeadFormValuesToCreateLeadRequestDto } from "./map-add-lead-form-to-create-lead-request-dto";

describe("mapAddLeadFormValuesToCreateLeadRequestDto", () => {
  it("maps UI form state into the API request DTO", () => {
    const values: AddLeadFormValues = {
      first_name: " Anna ",
      last_name: " Meyer ",
      company_name: "",
      email: " anna@example.com ",
      phone: "  +49 123 456 789  ",
      website_url: " https://example.com ",
      category_id: " 123e4567-e89b-12d3-a456-426614174000 ",
      score: " 84 ",
      owner: "  Sandra  ",
      notes: "  Erste Notiz  ",
      improvements: [{ value: "  Klarere CTA  " }, { value: "   " }],
      social_profiles: [
        {
          platform: "linkedin",
          profile_url: " https://linkedin.com/in/anna-meyer ",
        },
      ],
    };

    expect(mapAddLeadFormValuesToCreateLeadRequestDto(values)).toEqual({
      first_name: "Anna",
      last_name: "Meyer",
      email: "anna@example.com",
      phone: "+49 123 456 789",
      website_url: "https://example.com",
      category_id: "123e4567-e89b-12d3-a456-426614174000",
      score: 84,
      owner: "Sandra",
      notes: "Erste Notiz",
      improvements: ["Klarere CTA"],
      social_profiles: [
        {
          platform: "linkedin",
          profile_url: "https://linkedin.com/in/anna-meyer",
        },
      ],
    });
  });

  it("omits empty optional fields and leaves email trimmed", () => {
    const values: AddLeadFormValues = {
      first_name: "",
      last_name: "Meyer",
      company_name: "",
      email: " anna@example.com ",
      phone: "",
      website_url: "",
      category_id: "",
      score: "",
      owner: "",
      notes: "",
      improvements: [],
      social_profiles: [],
    };

    expect(mapAddLeadFormValuesToCreateLeadRequestDto(values)).toEqual({
      email: "anna@example.com",
      last_name: "Meyer",
    });
  });
});
