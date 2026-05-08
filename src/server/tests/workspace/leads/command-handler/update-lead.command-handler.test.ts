import { describe, expect, it, vi } from "vitest";
import { LeadErrorCode } from "@/common/constants/leads/lead-error-codes";
import { PostgresErrorCode } from "@/server/db/core";

const {
  getDrizzleDatabaseClientMock,
  getLeadByIdMock,
  createLeadActivityMock,
} = vi.hoisted(() => ({
  getDrizzleDatabaseClientMock: vi.fn(),
  getLeadByIdMock: vi.fn(),
  createLeadActivityMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/db/core")>()),
  getDrizzleDatabaseClient: getDrizzleDatabaseClientMock,
}));
vi.mock(
  "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler",
  () => ({ getLeadById: getLeadByIdMock }),
);
vi.mock("@/server/workspace/leads/services/lead-activity-service", () => ({
  createLeadActivity: createLeadActivityMock,
}));

const NOW = new Date("2024-03-01T12:00:00Z");

const mockLeadDto = {
  id: "lead-existing-uuid",
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

type SetArgs = Record<string, unknown>;

function setupSuccessfulDb() {
  const updateCaptures: SetArgs[] = [];
  let deleteCount = 0;
  const insertCaptures: unknown[] = [];

  const txMock = {
    update: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation((setArgs: SetArgs) => ({
        where: vi.fn().mockImplementation(() => {
          updateCaptures.push(setArgs);
          return Promise.resolve();
        }),
      })),
    })),
    delete: vi.fn().mockImplementation(() => ({
      where: vi.fn().mockImplementation(() => {
        deleteCount++;
        return Promise.resolve();
      }),
    })),
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation((valuesArg: unknown) => {
        insertCaptures.push(valuesArg);
        return Promise.resolve();
      }),
    })),
  };

  getDrizzleDatabaseClientMock.mockReturnValue({
    transaction: vi
      .fn()
      .mockImplementation(async (cb: (tx: typeof txMock) => Promise<void>) => {
        await cb(txMock);
      }),
  });

  return {
    updateCaptures,
    getDeleteCount: () => deleteCount,
    insertCaptures,
  };
}

describe("updateLead", () => {
  it("returns ok:true with updated LeadDetailDto on valid update", async () => {
    setupSuccessfulDb();
    getLeadByIdMock.mockResolvedValueOnce(mockLeadDto);
    getLeadByIdMock.mockResolvedValueOnce(mockLeadDto);
    const { updateLead } =
      await import("@/server/workspace/leads/command-handler/update-lead.command-handler");

    const result = await updateLead("lead-existing-uuid", {
      last_name: "Mustermann",
    });

    expect(result).toEqual({ ok: true, lead: mockLeadDto });
  });

  it("includes category_id, notes, and improvements in the update set payload", async () => {
    vi.resetModules();
    const { updateCaptures } = setupSuccessfulDb();
    getLeadByIdMock.mockResolvedValueOnce(mockLeadDto);
    getLeadByIdMock.mockResolvedValueOnce(mockLeadDto);
    const { updateLead } =
      await import("@/server/workspace/leads/command-handler/update-lead.command-handler");

    const categoryId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    await updateLead("lead-existing-uuid", {
      last_name: "Mustermann",
      category_id: categoryId,
      notes: "Guter Prospect",
      improvements: ["Mehr Social Proof"],
    });

    expect(updateCaptures).toHaveLength(1);
    expect(updateCaptures[0].category_id).toBe(categoryId);
    expect(updateCaptures[0].notes).toBe("Guter Prospect");
    expect(updateCaptures[0].improvements).toEqual(["Mehr Social Proof"]);
  });

  it("sets updated_at explicitly in the update payload", async () => {
    vi.resetModules();
    const { updateCaptures } = setupSuccessfulDb();
    getLeadByIdMock.mockResolvedValueOnce(mockLeadDto);
    getLeadByIdMock.mockResolvedValueOnce(mockLeadDto);
    const { updateLead } =
      await import("@/server/workspace/leads/command-handler/update-lead.command-handler");

    await updateLead("lead-existing-uuid", { last_name: "Mustermann" });

    expect(updateCaptures[0].updated_at).toBeInstanceOf(Date);
  });

  it("replaces social profiles: deletes existing and inserts new ones", async () => {
    vi.resetModules();
    const { getDeleteCount, insertCaptures } = setupSuccessfulDb();
    getLeadByIdMock.mockResolvedValueOnce(mockLeadDto);
    getLeadByIdMock.mockResolvedValueOnce(mockLeadDto);
    const { updateLead } =
      await import("@/server/workspace/leads/command-handler/update-lead.command-handler");

    await updateLead("lead-existing-uuid", {
      last_name: "Mustermann",
      social_profiles: [
        {
          platform: "linkedin",
          profile_url: "https://linkedin.com/in/max-mustermann",
        },
      ],
    });

    expect(getDeleteCount()).toBe(1);
    expect(insertCaptures).toHaveLength(1);
    const inserted = insertCaptures[0] as Array<Record<string, unknown>>;
    expect(inserted[0].platform).toBe("linkedin");
    expect(typeof inserted[0].normalized_url).toBe("string");
    expect(inserted[0].lead_id).toBe("lead-existing-uuid");
  });

  it("deletes social profiles but skips insert when empty array provided", async () => {
    vi.resetModules();
    const { getDeleteCount, insertCaptures } = setupSuccessfulDb();
    getLeadByIdMock.mockResolvedValueOnce(mockLeadDto);
    getLeadByIdMock.mockResolvedValueOnce(mockLeadDto);
    const { updateLead } =
      await import("@/server/workspace/leads/command-handler/update-lead.command-handler");

    await updateLead("lead-existing-uuid", {
      last_name: "Mustermann",
      social_profiles: [],
    });

    expect(getDeleteCount()).toBe(1);
    expect(insertCaptures).toHaveLength(0);
  });

  it("returns NOT_FOUND when lead does not exist", async () => {
    vi.resetModules();
    getLeadByIdMock.mockResolvedValueOnce(null);
    const { updateLead } =
      await import("@/server/workspace/leads/command-handler/update-lead.command-handler");

    const result = await updateLead("nonexistent-uuid", {
      last_name: "Mustermann",
    });

    expect(result).toEqual({ ok: false, code: LeadErrorCode.NotFound });
  });

  it("returns VALIDATION_ERROR when both last_name and company_name are empty strings", async () => {
    vi.resetModules();
    getLeadByIdMock.mockResolvedValueOnce(mockLeadDto);
    const { updateLead } =
      await import("@/server/workspace/leads/command-handler/update-lead.command-handler");

    const result = await updateLead("lead-existing-uuid", {
      last_name: "",
      company_name: "",
    });

    expect(result).toMatchObject({
      ok: false,
      code: LeadErrorCode.ValidationError,
    });
  });

  it("returns VALIDATION_ERROR when clearing last_name would leave the lead without a name", async () => {
    vi.resetModules();
    getLeadByIdMock.mockResolvedValueOnce({
      ...mockLeadDto,
      lastName: "Mustermann",
      companyName: null,
    });
    const { updateLead } =
      await import("@/server/workspace/leads/command-handler/update-lead.command-handler");
    getDrizzleDatabaseClientMock.mockClear();

    const result = await updateLead("lead-existing-uuid", {
      last_name: "",
    });

    expect(result).toMatchObject({
      ok: false,
      code: LeadErrorCode.ValidationError,
    });
    expect(getDrizzleDatabaseClientMock).not.toHaveBeenCalled();
  });

  it("returns EMAIL_EXISTS when the updated email already exists", async () => {
    vi.resetModules();
    const duplicateError = Object.assign(new Error("duplicate key value"), {
      cause: {
        code: PostgresErrorCode.UniqueViolation,
      },
    });
    getLeadByIdMock.mockResolvedValueOnce(mockLeadDto);
    getDrizzleDatabaseClientMock.mockReturnValue({
      transaction: vi.fn().mockRejectedValue(duplicateError),
    });
    const { updateLead } =
      await import("@/server/workspace/leads/command-handler/update-lead.command-handler");

    const result = await updateLead("lead-existing-uuid", {
      email: "existing@example.com",
    });

    expect(result).toEqual({ ok: false, code: LeadErrorCode.EmailExists });
  });

  it("logs status_change activity with body '<old> -> <new>' when lead_status changes", async () => {
    vi.resetModules();
    createLeadActivityMock.mockClear();
    createLeadActivityMock.mockResolvedValue(undefined);
    setupSuccessfulDb();
    getLeadByIdMock.mockResolvedValueOnce({
      ...mockLeadDto,
      leadStatus: "new",
    });
    getLeadByIdMock.mockResolvedValueOnce({
      ...mockLeadDto,
      leadStatus: "qualified",
    });
    const { updateLead } =
      await import("@/server/workspace/leads/command-handler/update-lead.command-handler");

    await updateLead("lead-existing-uuid", {
      last_name: "Mustermann",
      lead_status: "qualified",
    });

    expect(createLeadActivityMock).toHaveBeenCalledOnce();
    expect(createLeadActivityMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: "status_change",
        body: "new -> qualified",
      }),
    );
  });

  it("does not log activity when lead_status equals the existing status", async () => {
    vi.resetModules();
    createLeadActivityMock.mockClear();
    createLeadActivityMock.mockResolvedValue(undefined);
    setupSuccessfulDb();
    getLeadByIdMock.mockResolvedValueOnce({
      ...mockLeadDto,
      leadStatus: "new",
    });
    getLeadByIdMock.mockResolvedValueOnce({
      ...mockLeadDto,
      leadStatus: "new",
    });
    const { updateLead } =
      await import("@/server/workspace/leads/command-handler/update-lead.command-handler");

    await updateLead("lead-existing-uuid", {
      last_name: "Mustermann",
      lead_status: "new",
    });

    expect(createLeadActivityMock).not.toHaveBeenCalled();
  });

  it("does not log activity when lead_status is not in the input", async () => {
    vi.resetModules();
    createLeadActivityMock.mockClear();
    createLeadActivityMock.mockResolvedValue(undefined);
    setupSuccessfulDb();
    getLeadByIdMock.mockResolvedValueOnce(mockLeadDto);
    getLeadByIdMock.mockResolvedValueOnce(mockLeadDto);
    const { updateLead } =
      await import("@/server/workspace/leads/command-handler/update-lead.command-handler");

    await updateLead("lead-existing-uuid", { last_name: "Mustermann" });

    expect(createLeadActivityMock).not.toHaveBeenCalled();
  });
});
