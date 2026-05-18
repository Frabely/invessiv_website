import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import { LeadSource } from "@/common/constants/leads/sources/lead-sources";
import { PostgresErrorCode } from "@/server/db/core";
import { DuplicateEmailError } from "@/server/workspace/leads/shared/duplicate-email-error.class";

const createLeadActivityMock = vi.fn().mockResolvedValue(undefined);

vi.mock("server-only", () => ({}));
vi.mock("@/server/workspace/leads/services/lead-activity-service", () => ({
  leadActivityService: {
    createLeadActivity: createLeadActivityMock,
  },
}));

const NOW = new Date("2024-03-01T12:00:00Z");

const mockLeadDto = {
  id: "lead-new-uuid",
  displayName: "Max Mustermann",
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

beforeEach(() => {
  createLeadActivityMock.mockClear();
});

function createTxMock(options?: { duplicateEmailError?: unknown }) {
  const capturedInserts: Array<{ tableArg: unknown; valuesArg: unknown }> = [];
  const leadRow = {
    id: mockLeadDto.id,
    first_name: mockLeadDto.firstName,
    display_name: mockLeadDto.displayName,
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
  let insertCallIndex = 0;

  const txMock = {
    select: vi.fn().mockImplementation(() => {
      const currentCall = selectCallIndex;
      selectCallIndex += 1;

      if (currentCall === 0) {
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

      if (currentCall === 1) {
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
    }),
    insert: vi.fn().mockImplementation((tableArg: unknown) => ({
      values: vi.fn().mockImplementation((valuesArg: unknown) => {
        capturedInserts.push({ tableArg, valuesArg });

        if (insertCallIndex === 0 && options?.duplicateEmailError) {
          insertCallIndex += 1;
          return Promise.reject(options.duplicateEmailError);
        }

        insertCallIndex += 1;
        return Promise.resolve();
      }),
    })),
  };

  return { txMock, capturedInserts };
}

describe("createLeadCoreInTransaction", () => {
  it("creates a manual lead with manual defaults", async () => {
    const { txMock, capturedInserts } = createTxMock();
    const { createLeadCoreInTransaction } =
      await import("@/server/workspace/leads/shared/create-lead-core");

    const result = await createLeadCoreInTransaction(
      txMock as never,
      {
        displayName: "Max Mustermann",
        last_name: "Mustermann",
        email: "max@example.com",
      },
      {
        source: LeadSource.Manual,
        activityType: LeadActivityType.Note,
      },
    );

    expect(result).toEqual(mockLeadDto);
    const leadValues = capturedInserts[0].valuesArg as Record<string, unknown>;
    expect(leadValues.source).toBe(LeadSource.Manual);
    expect(leadValues.lead_status).toBe(ContactLeadStatus.New);
    expect(leadValues.owner).toBeNull();
  });

  it("applies import overrides for source, status, owner, external_guid and activity metadata", async () => {
    const { txMock, capturedInserts } = createTxMock();
    const { createLeadCoreInTransaction } =
      await import("@/server/workspace/leads/shared/create-lead-core");

    const result = await createLeadCoreInTransaction(
      txMock as never,
      {
        displayName: "Max Mustermann",
        last_name: "Mustermann",
        email: "import@example.com",
        owner: "jane.doe",
      },
      {
        source: LeadSource.Import,
        activityType: LeadActivityType.Import,
        activityMetadata: {
          import_batch_id: "batch-2024-03",
          row_index: 7,
        },
        externalGuid: "ext-123",
        statusOverride: ContactLeadStatus.Qualified,
        ownerOverride: "import.owner",
      },
    );

    expect(result).toEqual(mockLeadDto);

    const leadValues = capturedInserts[0].valuesArg as Record<string, unknown>;
    expect(leadValues.source).toBe(LeadSource.Import);
    expect(leadValues.external_guid).toBe("ext-123");
    expect(leadValues.owner).toBe("import.owner");
    expect(leadValues.lead_status).toBe(ContactLeadStatus.Qualified);

    expect(createLeadActivityMock).toHaveBeenCalledWith(
      txMock,
      expect.objectContaining({
        type: LeadActivityType.Import,
        metadata: {
          import_batch_id: "batch-2024-03",
          row_index: 7,
        },
      }),
    );
  });

  it("wraps duplicate email errors in DuplicateEmailError", async () => {
    const duplicateError = Object.assign(new Error("duplicate key value"), {
      cause: {
        code: PostgresErrorCode.UniqueViolation,
      },
    });
    const { txMock } = createTxMock({
      duplicateEmailError: duplicateError,
    });
    const { createLeadCoreInTransaction } =
      await import("@/server/workspace/leads/shared/create-lead-core");

    await expect(
      createLeadCoreInTransaction(
        txMock as never,
        {
          displayName: "Max Mustermann",
          last_name: "Mustermann",
          email: "duplicate@example.com",
        },
        {
          source: LeadSource.Manual,
          activityType: LeadActivityType.Note,
        },
      ),
    ).rejects.toBeInstanceOf(DuplicateEmailError);
  });
});
