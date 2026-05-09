import { describe, expect, it } from "vitest";
import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import type { LeadFormValues } from "@/common/contracts/leads/forms/lead-form-values";
import { leadMapperService } from "./lead-mapper-service";

describe("leadMapperService.mapAddLeadFormValuesToCreateLeadRequestDto", () => {
  it("maps UI form state into the API request DTO", () => {
    const values: LeadFormValues = {
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
      lead_status: ContactLeadStatus.Qualified,
      improvements: [{ value: "  Klarere CTA  " }, { value: "   " }],
      social_profiles: [
        {
          platform: "linkedin",
          profile_url: " https://linkedin.com/in/anna-meyer ",
        },
      ],
    };

    expect(
      leadMapperService.mapAddLeadFormValuesToCreateLeadRequestDto(values),
    ).toEqual({
      first_name: "Anna",
      last_name: "Meyer",
      email: "anna@example.com",
      phone: "+49 123 456 789",
      website_url: "https://example.com",
      category_id: "123e4567-e89b-12d3-a456-426614174000",
      score: 84,
      owner: "Sandra",
      notes: "Erste Notiz",
      lead_status: ContactLeadStatus.Qualified,
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
    const values: LeadFormValues = {
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
      lead_status: ContactLeadStatus.New,
      improvements: [],
      social_profiles: [],
    };

    expect(
      leadMapperService.mapAddLeadFormValuesToCreateLeadRequestDto(values),
    ).toEqual({
      email: "anna@example.com",
      last_name: "Meyer",
      lead_status: ContactLeadStatus.New,
    });
  });
});

describe("leadMapperService.mapLeadFormValuesToUpdateLeadRequestDto", () => {
  it("maps all filled fields into the update DTO", () => {
    const values: LeadFormValues = {
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
      lead_status: ContactLeadStatus.Qualified,
      improvements: [{ value: "  Klarere CTA  " }, { value: "   " }],
      social_profiles: [
        {
          platform: "linkedin",
          profile_url: " https://linkedin.com/in/anna-meyer ",
        },
      ],
    };

    expect(
      leadMapperService.mapLeadFormValuesToUpdateLeadRequestDto(values),
    ).toEqual({
      email: "anna@example.com",
      first_name: "Anna",
      last_name: "Meyer",
      phone: "+49 123 456 789",
      website_url: "https://example.com",
      category_id: "123e4567-e89b-12d3-a456-426614174000",
      score: 84,
      owner: "Sandra",
      notes: "Erste Notiz",
      lead_status: ContactLeadStatus.Qualified,
      improvements: ["Klarere CTA"],
      social_profiles: [
        {
          platform: "linkedin",
          profile_url: "https://linkedin.com/in/anna-meyer",
        },
      ],
    });
  });

  it("omits email and other empty optional fields", () => {
    const values: LeadFormValues = {
      first_name: "",
      last_name: "Meyer",
      company_name: "",
      email: "   ",
      phone: "",
      website_url: "",
      category_id: "",
      score: "",
      owner: "",
      notes: "",
      lead_status: ContactLeadStatus.New,
      improvements: [],
      social_profiles: [],
    };

    expect(
      leadMapperService.mapLeadFormValuesToUpdateLeadRequestDto(values),
    ).toEqual({
      last_name: "Meyer",
      lead_status: ContactLeadStatus.New,
    });
  });
});
