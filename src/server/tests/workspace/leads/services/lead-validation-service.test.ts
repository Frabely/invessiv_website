import { describe, expect, it } from "vitest";
import { createLeadSchema } from "@/server/workspace/leads/services/create-lead/create-lead.schema";
import { leadFilterSchema } from "@/server/workspace/leads/services/lead-filter/lead-filter.schema";
import { updateLeadSchema } from "@/server/workspace/leads/services/update-lead/update-lead.schema";
import { updateLeadValidationService } from "@/server/workspace/leads/services/update-lead/update-lead-validation-service";

describe("createLeadSchema", () => {
  describe("valid inputs", () => {
    it("accepts email with last_name", () => {
      expect(
        createLeadSchema.safeParse({
          email: "max@example.com",
          last_name: "Mustermann",
        }).success,
      ).toBe(true);
    });

    it("accepts email with company_name and no last_name", () => {
      expect(
        createLeadSchema.safeParse({
          email: "max@example.com",
          company_name: "ACME GmbH",
        }).success,
      ).toBe(true);
    });

    it("accepts score at lower boundary 0", () => {
      expect(
        createLeadSchema.safeParse({
          email: "a@b.com",
          last_name: "X",
          score: 0,
        }).success,
      ).toBe(true);
    });

    it("accepts score at upper boundary 100", () => {
      expect(
        createLeadSchema.safeParse({
          email: "a@b.com",
          last_name: "X",
          score: 100,
        }).success,
      ).toBe(true);
    });

    it("accepts a valid UUID as category_id", () => {
      expect(
        createLeadSchema.safeParse({
          email: "a@b.com",
          last_name: "X",
          category_id: "123e4567-e89b-12d3-a456-426614174000",
        }).success,
      ).toBe(true);
    });

    it("accepts a valid linkedin social profile", () => {
      expect(
        createLeadSchema.safeParse({
          email: "a@b.com",
          last_name: "X",
          social_profiles: [
            {
              platform: "linkedin",
              profile_url: "https://linkedin.com/in/max",
            },
          ],
        }).success,
      ).toBe(true);
    });

    it("accepts all supported social platforms", () => {
      for (const platform of ["linkedin", "instagram", "youtube"] as const) {
        expect(
          createLeadSchema.safeParse({
            email: "a@b.com",
            last_name: "X",
            social_profiles: [
              { platform, profile_url: "https://example.com/profile" },
            ],
          }).success,
          `platform ${platform} should be accepted`,
        ).toBe(true);
      }
    });

    it("accepts a valid website URL", () => {
      expect(
        createLeadSchema.safeParse({
          email: "a@b.com",
          last_name: "X",
          website_url: "https://example.com",
        }).success,
      ).toBe(true);
    });

    it("accepts a valid phone number", () => {
      expect(
        createLeadSchema.safeParse({
          email: "a@b.com",
          last_name: "X",
          phone: "+49 30 1234567",
        }).success,
      ).toBe(true);
    });

    it("accepts improvements as an array of strings", () => {
      expect(
        createLeadSchema.safeParse({
          email: "a@b.com",
          last_name: "X",
          improvements: ["Bessere SEO", "Klarere Navigation"],
        }).success,
      ).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects missing email", () => {
      expect(
        createLeadSchema.safeParse({ last_name: "Mustermann" }).success,
      ).toBe(false);
    });

    it("rejects invalid email format", () => {
      expect(
        createLeadSchema.safeParse({
          email: "not-an-email",
          last_name: "Mustermann",
        }).success,
      ).toBe(false);
    });

    it("rejects when both last_name and company_name are absent", () => {
      expect(createLeadSchema.safeParse({ email: "a@b.com" }).success).toBe(
        false,
      );
    });

    it("rejects whitespace-only last_name when company_name is absent", () => {
      expect(
        createLeadSchema.safeParse({ email: "a@b.com", last_name: "   " })
          .success,
      ).toBe(false);
    });

    it("rejects whitespace-only values for both name fields", () => {
      expect(
        createLeadSchema.safeParse({
          email: "a@b.com",
          last_name: "   ",
          company_name: "   ",
        }).success,
      ).toBe(false);
    });

    it("rejects score below 0", () => {
      expect(
        createLeadSchema.safeParse({
          email: "a@b.com",
          last_name: "X",
          score: -1,
        }).success,
      ).toBe(false);
    });

    it("rejects score above 100", () => {
      expect(
        createLeadSchema.safeParse({
          email: "a@b.com",
          last_name: "X",
          score: 101,
        }).success,
      ).toBe(false);
    });

    it("rejects a non-UUID category_id", () => {
      expect(
        createLeadSchema.safeParse({
          email: "a@b.com",
          last_name: "X",
          category_id: "not-a-uuid",
        }).success,
      ).toBe(false);
    });

    it("rejects an invalid website URL", () => {
      expect(
        createLeadSchema.safeParse({
          email: "a@b.com",
          last_name: "X",
          website_url: "not-a-url",
        }).success,
      ).toBe(false);
    });

    it("rejects an invalid phone number", () => {
      expect(
        createLeadSchema.safeParse({
          email: "a@b.com",
          last_name: "X",
          phone: "abc123",
        }).success,
      ).toBe(false);
    });

    it("rejects an unsupported social platform", () => {
      expect(
        createLeadSchema.safeParse({
          email: "a@b.com",
          last_name: "X",
          social_profiles: [
            { platform: "twitter", profile_url: "https://twitter.com/max" },
          ],
        }).success,
      ).toBe(false);
    });
  });
});

describe("updateLeadSchema", () => {
  it("accepts an empty object because all fields are optional", () => {
    expect(updateLeadSchema.safeParse({}).success).toBe(true);
  });

  it("accepts null for nullable scalar fields", () => {
    expect(
      updateLeadSchema.safeParse({
        first_name: null,
        last_name: null,
        notes: null,
        owner: null,
        phone: null,
        score: null,
        website_url: null,
        company_name: "ACME GmbH",
      }).success,
    ).toBe(true);
  });

  it("accepts a partial update with only email", () => {
    expect(
      updateLeadSchema.safeParse({ email: "new@example.com" }).success,
    ).toBe(true);
  });

  it("accepts updating only last_name without touching company_name", () => {
    expect(updateLeadSchema.safeParse({ last_name: "Schmidt" }).success).toBe(
      true,
    );
  });

  it("accepts updating only score", () => {
    expect(updateLeadSchema.safeParse({ score: 75 }).success).toBe(true);
  });

  it("rejects invalid email in a partial update", () => {
    expect(updateLeadSchema.safeParse({ email: "not-an-email" }).success).toBe(
      false,
    );
  });

  it("rejects null email in a partial update", () => {
    expect(updateLeadSchema.safeParse({ email: null }).success).toBe(false);
  });

  it("rejects score out of range in a partial update", () => {
    expect(updateLeadSchema.safeParse({ score: 101 }).success).toBe(false);
  });

  it("rejects explicitly clearing both last_name and company_name", () => {
    expect(
      updateLeadSchema.safeParse({
        last_name: null,
        company_name: null,
      }).success,
    ).toBe(false);
  });

  it("rejects whitespace-only values for both name fields when both are present", () => {
    expect(
      updateLeadSchema.safeParse({
        last_name: "   ",
        company_name: "   ",
      }).success,
    ).toBe(false);
  });
});

describe("updateLeadValidationService", () => {
  const existingLead = {
    companyName: null,
    email: "max@example.com",
    lastName: "Mustermann",
  };

  it("rejects a patch that would clear the only remaining name field", () => {
    const result = updateLeadValidationService.validate(
      { last_name: null },
      existingLead,
    );

    expect(result.success).toBe(false);
  });

  it("accepts clearing last_name when company_name remains present", () => {
    const result = updateLeadValidationService.validate(
      { last_name: null },
      {
        companyName: "ACME GmbH",
        email: "max@example.com",
        lastName: "Mustermann",
      },
    );

    expect(result.success).toBe(true);
  });

  it("removes email from parsed data when the patch keeps the same email", () => {
    const result = updateLeadValidationService.validate(
      { email: " MAX@example.com " },
      existingLead,
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("email");
    }
  });
});

describe("leadFilterSchema", () => {
  it("accepts an empty object", () => {
    expect(leadFilterSchema.safeParse({}).success).toBe(true);
  });

  it("accepts status 'all'", () => {
    expect(leadFilterSchema.safeParse({ status: "all" }).success).toBe(true);
  });

  it("accepts each valid lead status", () => {
    for (const status of [
      "new",
      "contacted",
      "qualified",
      "proposal",
      "on_hold",
      "won",
      "lost",
      "archived",
    ]) {
      expect(
        leadFilterSchema.safeParse({ status }).success,
        `status ${status} should be accepted`,
      ).toBe(true);
    }
  });

  it("rejects an unknown status value", () => {
    expect(leadFilterSchema.safeParse({ status: "pending" }).success).toBe(
      false,
    );
  });

  it("accepts each valid lead source", () => {
    for (const source of ["webform", "manual", "import"]) {
      expect(
        leadFilterSchema.safeParse({ source }).success,
        `source ${source} should be accepted`,
      ).toBe(true);
    }
  });

  it("rejects an unknown source value", () => {
    expect(leadFilterSchema.safeParse({ source: "fax" }).success).toBe(false);
  });

  it("accepts page >= 1", () => {
    expect(leadFilterSchema.safeParse({ page: 1 }).success).toBe(true);
    expect(leadFilterSchema.safeParse({ page: 10 }).success).toBe(true);
  });

  it("rejects page = 0", () => {
    expect(leadFilterSchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it("rejects negative page", () => {
    expect(leadFilterSchema.safeParse({ page: -1 }).success).toBe(false);
  });

  it("accepts score_min at boundaries 0 and 100", () => {
    expect(leadFilterSchema.safeParse({ score_min: 0 }).success).toBe(true);
    expect(leadFilterSchema.safeParse({ score_min: 100 }).success).toBe(true);
  });

  it("rejects score_min above 100", () => {
    expect(leadFilterSchema.safeParse({ score_min: 101 }).success).toBe(false);
  });

  it("rejects score_min below 0", () => {
    expect(leadFilterSchema.safeParse({ score_min: -1 }).success).toBe(false);
  });

  it("accepts a valid UUID as category filter", () => {
    expect(
      leadFilterSchema.safeParse({
        category: "123e4567-e89b-12d3-a456-426614174000",
      }).success,
    ).toBe(true);
  });

  it("rejects a non-UUID category filter", () => {
    expect(leadFilterSchema.safeParse({ category: "not-a-uuid" }).success).toBe(
      false,
    );
  });

  it("accepts each valid sort value", () => {
    for (const sort of [
      "created_asc",
      "created_desc",
      "score_asc",
      "score_desc",
      "name_asc",
      "name_desc",
    ]) {
      expect(
        leadFilterSchema.safeParse({ sort }).success,
        `sort ${sort} should be accepted`,
      ).toBe(true);
    }
  });

  it("rejects an unknown sort value", () => {
    expect(leadFilterSchema.safeParse({ sort: "q" }).success).toBe(false);
    expect(leadFilterSchema.safeParse({ sort: "random" }).success).toBe(false);
  });
});
