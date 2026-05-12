import { describe, expect, it, vi } from "vitest";
import { LeadErrorCode } from "@/common/constants/leads/errors/lead-error-codes";
import type { CreateLeadRequestDto } from "@/common/contracts/leads/create-lead-request.dto";
import { PostgresErrorCode } from "@/server/db/core";

const { getDrizzleDatabaseClientMock, createLeadActivityMock } = vi.hoisted(
  () => ({
    getDrizzleDatabaseClientMock: vi.fn(),
    createLeadActivityMock: vi.fn().mockResolvedValue(undefined),
  }),
);

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/db/core")>()),
  getDrizzleDatabaseClient: getDrizzleDatabaseClientMock,
}));
vi.mock("@/server/workspace/leads/services/lead-activity-service", () => ({
  createLeadActivity: createLeadActivityMock,
}));

const NOW = new Date("2024-03-01T12:00:00Z");

const mockLeadDto = {
  id: "lead-new-uuid",
  firstName: "Max",
  lastName: "Mustermann",
  companyName: null,
  email: "max@example.com",
  phone: null,
  websiteUrl: null,
  score: null,
  source: "manual" as const,
  leadStatus: "new" as const,
  owner: null,
  notes: null,
  improvements: null,
  externalGuid: null,
  createdAt: NOW.toISOString(),
  updatedAt: NOW.toISOString(),
  category: null,
  socialProfiles: [],
  activities: [],
  submissions: [],
};

type InsertCapture = { tableArg: unknown; valuesArg: unknown };

function setupSuccessfulDb(): { capturedInserts: InsertCapture[] } {
  const capturedInserts: InsertCapture[] = [];
  const leadRow = {
    id: mockLeadDto.id,
    first_name: mockLeadDto.firstName,
    last_name: mockLeadDto.lastName,
    company_name: mockLeadDto.companyName,
    email: mockLeadDto.email,
    phone: mockLeadDto.phone,
    website_url: mockLeadDto.websiteUrl,
    score: mockLeadDto.score,
    source: mockLeadDto.source,
    lead_status: mockLeadDto.leadStatus,
    owner: mockLeadDto.owner,
    notes: mockLeadDto.notes,
    improvements: mockLeadDto.improvements,
    external_guid: mockLeadDto.externalGuid,
    created_at: NOW,
    updated_at: NOW,
    category_id: null,
    category_slug: null,
    category_label_key: null,
  };

  let selectCallIndex = 0;
  const selectMock = vi.fn().mockImplementation(() => {
    const callIndex = selectCallIndex;
    selectCallIndex += 1;

    if (callIndex === 0) {
      return {
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([leadRow]),
            }),
          }),
        }),
      };
    }

    if (callIndex === 1) {
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      };
    }

    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    };
  });

  const txMock = {
    select: selectMock,
    insert: vi.fn().mockImplementation((tableArg: unknown) => ({
      values: vi.fn().mockImplementation((valuesArg: unknown) => {
        capturedInserts.push({ tableArg, valuesArg });
        return Promise.resolve();
      }),
    })),
  };

  getDrizzleDatabaseClientMock.mockReturnValue({
    transaction: vi
      .fn()
      .mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
        return cb(txMock);
      }),
  });

  return { capturedInserts };
}

describe("createLead", () => {
  it("returns ok:true with a LeadDetailDto on valid create", async () => {
    setupSuccessfulDb();
    const { createLead } =
      await import("@/server/workspace/leads/command-handler/create-lead.command-handler");

    const result = await createLead({
      last_name: "Mustermann",
      email: "max@example.com",
    });

    expect(result).toEqual({ ok: true, lead: mockLeadDto });
  });

  it("sets source to manual and lead_status to new", async () => {
    vi.resetModules();
    createLeadActivityMock.mockResolvedValue(undefined);
    const { capturedInserts } = setupSuccessfulDb();
    const { createLead } =
      await import("@/server/workspace/leads/command-handler/create-lead.command-handler");

    await createLead({ last_name: "Mustermann", email: "max@example.com" });

    const leadValues = capturedInserts[0].valuesArg as Record<string, unknown>;
    expect(leadValues.source).toBe("manual");
    expect(leadValues.lead_status).toBe("new");
  });

  it("persists an explicitly provided lead_status", async () => {
    vi.resetModules();
    createLeadActivityMock.mockResolvedValue(undefined);
    const { capturedInserts } = setupSuccessfulDb();
    const { createLead } =
      await import("@/server/workspace/leads/command-handler/create-lead.command-handler");

    await createLead({
      last_name: "Mustermann",
      email: "max@example.com",
      lead_status: "qualified",
    });

    const leadValues = capturedInserts[0].valuesArg as Record<string, unknown>;
    expect(leadValues.lead_status).toBe("qualified");
  });

  it("inserts social profiles with normalized_url stripped of tracking params", async () => {
    vi.resetModules();
    createLeadActivityMock.mockResolvedValue(undefined);
    const { capturedInserts } = setupSuccessfulDb();
    const { createLead } =
      await import("@/server/workspace/leads/command-handler/create-lead.command-handler");

    await createLead({
      last_name: "Mustermann",
      email: "max@example.com",
      social_profiles: [
        {
          platform: "linkedin",
          profile_url: "https://linkedin.com/in/max-mustermann?utm_source=test",
        },
      ],
    });

    // capturedInserts[0] = leads, capturedInserts[1] = social profiles
    const socialValues = capturedInserts[1].valuesArg as Array<
      Record<string, unknown>
    >;
    expect(Array.isArray(socialValues)).toBe(true);
    expect(socialValues[0].platform).toBe("linkedin");
    expect(socialValues[0].profile_url).toBe(
      "https://linkedin.com/in/max-mustermann?utm_source=test",
    );
    expect(socialValues[0].normalized_url).toBe(
      "https://linkedin.com/in/max-mustermann",
    );
    expect(typeof socialValues[0].lead_id).toBe("string");
  });

  it("inserts category_id when provided", async () => {
    vi.resetModules();
    createLeadActivityMock.mockResolvedValue(undefined);
    const { capturedInserts } = setupSuccessfulDb();
    const { createLead } =
      await import("@/server/workspace/leads/command-handler/create-lead.command-handler");

    const categoryId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    await createLead({
      last_name: "Mustermann",
      email: "max@example.com",
      category_id: categoryId,
    });

    const leadValues = capturedInserts[0].valuesArg as Record<string, unknown>;
    expect(leadValues.category_id).toBe(categoryId);
  });

  it("inserts improvements array when provided", async () => {
    vi.resetModules();
    createLeadActivityMock.mockResolvedValue(undefined);
    const { capturedInserts } = setupSuccessfulDb();
    const { createLead } =
      await import("@/server/workspace/leads/command-handler/create-lead.command-handler");

    await createLead({
      last_name: "Mustermann",
      email: "max@example.com",
      improvements: ["Mehr Social Proof", "Klarere CTA"],
    });

    const leadValues = capturedInserts[0].valuesArg as Record<string, unknown>;
    expect(leadValues.improvements).toEqual([
      "Mehr Social Proof",
      "Klarere CTA",
    ]);
  });

  it("returns EMAIL_EXISTS when the email already exists", async () => {
    vi.resetModules();
    const duplicateError = Object.assign(new Error("duplicate key value"), {
      cause: {
        code: PostgresErrorCode.UniqueViolation,
      },
    });
    getDrizzleDatabaseClientMock.mockReturnValue({
      transaction: vi.fn().mockRejectedValue(duplicateError),
    });
    const { createLead } =
      await import("@/server/workspace/leads/command-handler/create-lead.command-handler");

    const result = await createLead({
      last_name: "Mustermann",
      email: "existing@example.com",
    });

    expect(result).toEqual({ ok: false, code: LeadErrorCode.EmailExists });
  });

  it("returns VALIDATION_ERROR when neither last_name nor company_name is provided", async () => {
    vi.resetModules();
    const { createLead } =
      await import("@/server/workspace/leads/command-handler/create-lead.command-handler");

    const result = await createLead({ email: "max@example.com" });

    expect(result).toMatchObject({
      ok: false,
      code: LeadErrorCode.ValidationError,
    });
  });

  it("returns VALIDATION_ERROR when email is missing", async () => {
    vi.resetModules();
    const { createLead } =
      await import("@/server/workspace/leads/command-handler/create-lead.command-handler");

    const result = await createLead({
      last_name: "Mustermann",
    } as CreateLeadRequestDto);

    expect(result).toMatchObject({
      ok: false,
      code: LeadErrorCode.ValidationError,
    });
  });

  it("calls createLeadActivity with type note and the creation message", async () => {
    vi.resetModules();
    createLeadActivityMock.mockClear();
    createLeadActivityMock.mockResolvedValue(undefined);
    setupSuccessfulDb();
    const { createLead } =
      await import("@/server/workspace/leads/command-handler/create-lead.command-handler");

    await createLead({ last_name: "Mustermann", email: "max@example.com" });

    expect(createLeadActivityMock).toHaveBeenCalledOnce();
    expect(createLeadActivityMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: "note",
      }),
    );
  });

  it("activity metadata and actor fields contain no email PII", async () => {
    vi.resetModules();
    createLeadActivityMock.mockClear();
    createLeadActivityMock.mockResolvedValue(undefined);
    setupSuccessfulDb();
    const { createLead } =
      await import("@/server/workspace/leads/command-handler/create-lead.command-handler");

    await createLead({ last_name: "Mustermann", email: "pii@secret.com" });

    const activityInput = createLeadActivityMock.mock.calls[0][1] as Record<
      string,
      unknown
    >;
    const serialized = JSON.stringify(activityInput);
    expect(serialized).not.toContain("pii@secret.com");
    expect(
      activityInput.metadata === null || activityInput.metadata === undefined,
    ).toBe(true);
  });
});
