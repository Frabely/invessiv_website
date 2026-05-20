import { beforeEach, describe, expect, it, vi } from "vitest";

import { LeadImportErrorCode } from "@invessiv/common/constants/leads/import/errors/lead-import-error-codes";
import { LeadImportRowIssueCode } from "@invessiv/common/constants/leads/import/issues/lead-import-row-issue-codes";
import { LeadImportRowIssueSeverity } from "@invessiv/common/constants/leads/import/issues/lead-import-row-issue-severities";
import type { LeadImportReportDto } from "@invessiv/common/contracts/leads/import/lead-import-report.dto";
import { PostgresErrorCode } from "@/server/db/core";

// ── Mocks (hoisted so vi.mock can reference them) ─────────────────────────────

const {
  getDrizzleDatabaseClientMock,
  loadExistingKeysMock,
  getLeadCategoriesMock,
  createLeadCoreInTransactionMock,
} = vi.hoisted(() => ({
  getDrizzleDatabaseClientMock: vi.fn(),
  loadExistingKeysMock: vi.fn(),
  getLeadCategoriesMock: vi.fn(),
  createLeadCoreInTransactionMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/server/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/db/core")>()),
  getDrizzleDatabaseClient: getDrizzleDatabaseClientMock,
}));

vi.mock(
  "@/server/workspace/leads/services/import/lead-import-existing-keys-loader-service",
  () => ({
    leadImportExistingKeysLoaderService: {
      loadExistingKeys: loadExistingKeysMock,
    },
    loadExistingKeys: loadExistingKeysMock,
  }),
);

vi.mock(
  "@/server/workspace/leads/query-handler/list-lead-categories.query-handler",
  () => ({ getLeadCategories: getLeadCategoriesMock }),
);

vi.mock("@/server/workspace/leads/shared/create-lead-core", () => ({
  createLeadCoreInTransaction: createLeadCoreInTransactionMock,
}));

// ── Shared helpers ─────────────────────────────────────────────────────────────

const EXAMPLE_CSV = [
  "external_guid;email;first_name;last_name;company_name;phone;website_url;category_id;category;score;linkedin_url;instagram_url;youtube_url;status;owner;notes;improvements",
  "linkedin-001;anna.schmidt@example.com;Anna;Schmidt;Schmidt Consulting;+49 30 1234567;https://schmidt-consulting.example;;consulting;82;https://www.linkedin.com/in/anna-schmidt;https://www.instagram.com/schmidtconsulting;https://www.youtube.com/@schmidtconsulting;new;Moritz;Outbound source;Clarify hero positioning | Make CTA more visible",
  ";max.mustermann@example.com;Max;Mustermann;;;;;;45;;;;Neu;;Minimal person lead;",
  "company-003;kontakt@beispiel-gmbh.example;;;Beispiel GmbH;;https://beispiel-gmbh.example;;;67;https://www.linkedin.com/company/beispiel-gmbh;;;qualified;Moritz;;Sharpen service offer | Add proof section",
].join("\n");

function makeFile(content: string, name = "leads.csv"): File {
  return new File([content], name, { type: "text/csv" });
}

const STUB_LEAD_DTO = {
  id: "lead-uuid",
  firstName: "Anna",
  lastName: "Schmidt",
  companyName: null,
  email: "anna@example.com",
  phone: null,
  websiteUrl: null,
  score: null,
  source: "import" as const,
  leadStatus: "new" as const,
  owner: null,
  notes: null,
  improvements: null,
  externalGuid: null,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
  category: null,
  socialProfiles: [],
  activities: [],
  submissions: [],
};

function setupEmptyDb(): void {
  getDrizzleDatabaseClientMock.mockReturnValue({
    transaction: vi
      .fn()
      .mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({}),
      ),
  });
  loadExistingKeysMock.mockResolvedValue({
    emailToLeadId: new Map(),
    guidToLeadId: new Map(),
  });
  getLeadCategoriesMock.mockResolvedValue([]);
  createLeadCoreInTransactionMock.mockResolvedValue(STUB_LEAD_DTO);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("importLeads", () => {
  it("returns ok:false with InvalidCsv when CSV has unclosed quotes", async () => {
    setupEmptyDb();
    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    // mid-field quote triggers InvalidCsv in the parser
    const result = await importLeads(makeFile('email;last_name\nab"c;Test'));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(LeadImportErrorCode.InvalidCsv);
    }
  });

  it("returns ok:false with TooManyRows for 501 data rows", async () => {
    setupEmptyDb();
    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const lines = ["email;last_name"];
    for (let i = 0; i < 501; i += 1) {
      lines.push(`row${i}@example.com;User${i}`);
    }
    const result = await importLeads(makeFile(lines.join("\n")));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(LeadImportErrorCode.TooManyRows);
    }
  });

  it("imports 3 leads from example CSV, category column is recognized (not ignored)", async () => {
    vi.resetModules();
    setupEmptyDb();
    getLeadCategoriesMock.mockResolvedValue([
      { id: "cat-consulting", slug: "consulting", labelKey: "consulting" },
    ]);
    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const result = await importLeads(makeFile(EXAMPLE_CSV));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const report = result.report as LeadImportReportDto;
    expect(report.totalRows).toBe(3);
    expect(report.importedCount).toBe(3);
    expect(report.skippedCount).toBe(0);
    expect(report.errorCount).toBe(0);
    expect(report.ignoredColumns).not.toContain("category");
    expect(createLeadCoreInTransactionMock).toHaveBeenCalledTimes(3);
  });

  it("imports a row with pending_review status and preserves the status override", async () => {
    vi.resetModules();
    setupEmptyDb();
    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const csv = [
      "email;last_name;status",
      "review@example.com;Review;pending_review",
    ].join("\n");

    const result = await importLeads(makeFile(csv));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.report.importedCount).toBe(1);
    expect(createLeadCoreInTransactionMock).toHaveBeenCalledTimes(1);
    const options = createLeadCoreInTransactionMock.mock.calls[0][2] as {
      statusOverride?: string;
    };
    expect(options.statusOverride).toBe("pending_review");
  });

  it("imports display_name-only rows without email", async () => {
    vi.resetModules();
    setupEmptyDb();
    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const result = await importLeads(
      makeFile(["display_name", "Display Only"].join("\n")),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.report.importedCount).toBe(1);
    expect(result.report.skippedCount).toBe(0);
    expect(loadExistingKeysMock).toHaveBeenCalledWith([], []);
    expect(createLeadCoreInTransactionMock).toHaveBeenCalledTimes(1);
    expect(createLeadCoreInTransactionMock.mock.calls[0][1]).toMatchObject({
      displayName: "Display Only",
      email: undefined,
    });
  });

  it("skips all 3 rows on re-import (DuplicateEmail)", async () => {
    vi.resetModules();
    setupEmptyDb();
    getLeadCategoriesMock.mockResolvedValue([
      { id: "cat-consulting", slug: "consulting", labelKey: "consulting" },
    ]);
    loadExistingKeysMock.mockResolvedValue({
      emailToLeadId: new Map([
        ["anna.schmidt@example.com", "lead-1"],
        ["max.mustermann@example.com", "lead-2"],
        ["kontakt@beispiel-gmbh.example", "lead-3"],
      ]),
      guidToLeadId: new Map(),
    });
    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const result = await importLeads(makeFile(EXAMPLE_CSV));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const report = result.report;
    expect(report.importedCount).toBe(0);
    expect(report.skippedCount).toBe(3);
    expect(
      report.rowIssues.every(
        (i) => i.code === LeadImportRowIssueCode.DuplicateEmail,
      ),
    ).toBe(true);
    expect(createLeadCoreInTransactionMock).not.toHaveBeenCalled();
  });

  it("skips duplicate emails within the same file and only imports the first row", async () => {
    vi.resetModules();
    setupEmptyDb();
    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const csv = [
      "email;last_name",
      "same@example.com;First",
      "same@example.com;Second",
    ].join("\n");

    const result = await importLeads(makeFile(csv));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.report.importedCount).toBe(1);
    expect(result.report.skippedCount).toBe(1);
    expect(
      result.report.rowIssues.some(
        (i) => i.code === LeadImportRowIssueCode.DuplicateEmailInFile,
      ),
    ).toBe(true);
    expect(createLeadCoreInTransactionMock).toHaveBeenCalledTimes(1);
  });

  it("skips duplicate external guids within the same file and only imports the first row", async () => {
    vi.resetModules();
    setupEmptyDb();
    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const csv = [
      "email;last_name;external_guid",
      "one@example.com;First;guid-001",
      "two@example.com;Second;guid-001",
    ].join("\n");

    const result = await importLeads(makeFile(csv));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.report.importedCount).toBe(1);
    expect(result.report.skippedCount).toBe(1);
    expect(
      result.report.rowIssues.some(
        (i) => i.code === LeadImportRowIssueCode.DuplicateExternalGuidInFile,
      ),
    ).toBe(true);
    expect(createLeadCoreInTransactionMock).toHaveBeenCalledTimes(1);
  });

  it("records ConflictEmailGuidMismatch when email → Lead A but guid → Lead B", async () => {
    vi.resetModules();
    setupEmptyDb();
    getLeadCategoriesMock.mockResolvedValue([
      { id: "cat-consulting", slug: "consulting", labelKey: "consulting" },
    ]);
    loadExistingKeysMock.mockResolvedValue({
      emailToLeadId: new Map([["anna.schmidt@example.com", "lead-A"]]),
      guidToLeadId: new Map([["linkedin-001", "lead-B"]]),
    });
    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const result = await importLeads(makeFile(EXAMPLE_CSV));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const conflictIssues = result.report.rowIssues.filter(
      (i) => i.code === LeadImportRowIssueCode.ConflictEmailGuidMismatch,
    );
    expect(conflictIssues.length).toBeGreaterThanOrEqual(1);
    expect(conflictIssues[0].severity).toBe(LeadImportRowIssueSeverity.Skip);
  });

  it("records error for row with invalid score, imports remaining rows", async () => {
    vi.resetModules();
    setupEmptyDb();
    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const csv = [
      "email;last_name;score",
      "valid@example.com;Valid;50",
      "invalid@example.com;Invalid;150",
      "another@example.com;Another;30",
    ].join("\n");

    const result = await importLeads(makeFile(csv));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.report.errorCount).toBe(1);
    expect(result.report.importedCount).toBe(2);
    expect(createLeadCoreInTransactionMock).toHaveBeenCalledTimes(2);
  });

  it("records UnknownCategoryId error for row with unrecognised category_id", async () => {
    vi.resetModules();
    setupEmptyDb();
    getLeadCategoriesMock.mockResolvedValue([
      { id: "known-cat-id", slug: "coaches", labelKey: "coaches" },
    ]);
    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const csv = [
      "email;last_name;category_id",
      "test@example.com;Test;00000000-0000-0000-0000-000000000099",
    ].join("\n");

    const result = await importLeads(makeFile(csv));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.report.errorCount).toBe(1);
    expect(result.report.importedCount).toBe(0);
    const catIssue = result.report.rowIssues.find(
      (i) => i.code === LeadImportRowIssueCode.UnknownCategoryId,
    );
    expect(catIssue).toBeDefined();
    expect(catIssue?.severity).toBe(LeadImportRowIssueSeverity.Error);
  });

  it("records UnknownCategoryId error for row with unrecognised category slug", async () => {
    vi.resetModules();
    setupEmptyDb();
    getLeadCategoriesMock.mockResolvedValue([
      { id: "known-cat-id", slug: "coaches", labelKey: "coaches" },
    ]);
    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const csv = [
      "email;last_name;category",
      "test@example.com;Test;missing-category",
    ].join("\n");

    const result = await importLeads(makeFile(csv));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.report.errorCount).toBe(1);
    expect(result.report.importedCount).toBe(0);
    const catIssue = result.report.rowIssues.find(
      (i) => i.code === LeadImportRowIssueCode.UnknownCategoryId,
    );
    expect(catIssue).toBeDefined();
    expect(catIssue?.severity).toBe(LeadImportRowIssueSeverity.Error);
    expect(createLeadCoreInTransactionMock).not.toHaveBeenCalled();
  });

  it("handles race condition: loader returns empty, core throws DuplicateEmailError → Skip", async () => {
    vi.resetModules();
    setupEmptyDb();
    const { DuplicateEmailError } =
      await import("@/server/workspace/leads/shared/duplicate-email-error.class");
    createLeadCoreInTransactionMock.mockRejectedValue(
      new DuplicateEmailError(),
    );

    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const csv = ["email;last_name", "race@example.com;User"].join("\n");

    const result = await importLeads(makeFile(csv));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.report.skippedCount).toBe(1);
    expect(result.report.importedCount).toBe(0);
    const dupIssue = result.report.rowIssues.find(
      (i) => i.code === LeadImportRowIssueCode.DuplicateEmail,
    );
    expect(dupIssue?.severity).toBe(LeadImportRowIssueSeverity.Skip);
  });

  it("handles race condition: core throws DuplicateCompanyNameError and skips the row", async () => {
    vi.resetModules();
    setupEmptyDb();
    const { DuplicateCompanyNameError } =
      await import("@/server/workspace/leads/shared/duplicate-company-name-error.class");
    createLeadCoreInTransactionMock.mockRejectedValue(
      new DuplicateCompanyNameError(),
    );

    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const csv = ["company_name", "Existing GmbH"].join("\n");

    const result = await importLeads(makeFile(csv));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.report.skippedCount).toBe(1);
    expect(result.report.importedCount).toBe(0);
    const dupIssue = result.report.rowIssues.find(
      (i) => i.code === LeadImportRowIssueCode.DuplicateCompanyName,
    );
    expect(dupIssue?.severity).toBe(LeadImportRowIssueSeverity.Skip);
  });

  it("activity inserts contain no PII — only import_batch_id and row_index in metadata", async () => {
    vi.resetModules();
    setupEmptyDb();
    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const csv = ["email;last_name", "pii-secret@example.com;PiiUser"].join(
      "\n",
    );

    await importLeads(makeFile(csv));

    expect(createLeadCoreInTransactionMock).toHaveBeenCalledOnce();
    const options = createLeadCoreInTransactionMock.mock.calls[0][2] as Record<
      string,
      unknown
    >;
    const metadata = options.activityMetadata as Record<string, unknown>;
    const serialized = JSON.stringify(metadata);
    expect(serialized).not.toContain("pii-secret@example.com");
    expect(metadata).toHaveProperty("import_batch_id");
    expect(metadata).toHaveProperty("row_index");
  });

  it("returns ok:false Internal when loadExistingKeys throws", async () => {
    vi.resetModules();
    setupEmptyDb();
    loadExistingKeysMock.mockRejectedValue(new Error("DB connection lost"));

    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const csv = ["email;last_name", "test@example.com;Test"].join("\n");
    const result = await importLeads(makeFile(csv));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(LeadImportErrorCode.Internal);
    }
  });

  it("skips row with DuplicateExternalGuid when guid already exists but email is new", async () => {
    vi.resetModules();
    setupEmptyDb();
    loadExistingKeysMock.mockResolvedValue({
      emailToLeadId: new Map(),
      guidToLeadId: new Map([["linkedin-001", "lead-existing"]]),
    });
    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const csv = [
      "email;last_name;external_guid",
      "new@example.com;NewUser;linkedin-001",
    ].join("\n");

    const result = await importLeads(makeFile(csv));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.report.skippedCount).toBe(1);
    const dupGuidIssue = result.report.rowIssues.find(
      (i) => i.code === LeadImportRowIssueCode.DuplicateExternalGuid,
    );
    expect(dupGuidIssue?.severity).toBe(LeadImportRowIssueSeverity.Skip);
  });

  it("skips row when createLeadCore hits an external_guid unique violation", async () => {
    vi.resetModules();
    setupEmptyDb();
    createLeadCoreInTransactionMock.mockRejectedValueOnce(
      Object.assign(new Error("duplicate key value"), {
        cause: {
          code: PostgresErrorCode.UniqueViolation,
          constraint: "leads_external_guid_uidx",
        },
      }),
    );
    const { importLeads } =
      await import("@/server/workspace/leads/command-handler/import-leads.command-handler");

    const csv = [
      "email;last_name;external_guid",
      "new@example.com;NewUser;guid-unique",
    ].join("\n");

    const result = await importLeads(makeFile(csv));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.report.importedCount).toBe(0);
    expect(result.report.skippedCount).toBe(1);
    const dupGuidIssue = result.report.rowIssues.find(
      (i) => i.code === LeadImportRowIssueCode.DuplicateExternalGuid,
    );
    expect(dupGuidIssue?.severity).toBe(LeadImportRowIssueSeverity.Skip);
  });
});
