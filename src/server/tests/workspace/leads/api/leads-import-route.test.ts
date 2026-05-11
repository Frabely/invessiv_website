import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

import { LeadImportErrorCode } from "@/common/constants/leads/import/errors/lead-import-error-codes";
import type { LeadImportReportDto } from "@/common/contracts/leads/import/lead-import-report.dto";

vi.mock("server-only", () => ({}));

const { mockAuth, mockCurrentUser, mockImportLeads } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCurrentUser: vi.fn(),
  mockImportLeads: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

vi.mock(
  "@/server/workspace/leads/command-handler/import-leads.command-handler",
  () => ({ importLeads: mockImportLeads }),
);

const ALLOWED_EMAIL = "owner@example.com";

const STUB_REPORT: LeadImportReportDto = {
  totalRows: 3,
  importedCount: 3,
  skippedCount: 0,
  errorCount: 0,
  warningCount: 0,
  ignoredColumns: ["category"],
  rowIssues: [],
  importBatchId: "batch-uuid-1",
};

function makeFile(
  content: string,
  type = "text/csv",
  name = "leads.csv",
): File {
  return new File([content], name, { type });
}

function makeImportRequest(
  file?: File,
  extraHeaders?: Record<string, string>,
): NextRequest {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }
  return new Request("http://localhost/api/workspace/leads/import", {
    method: "POST",
    body: formData,
    headers: extraHeaders,
  }) as unknown as NextRequest;
}

function makeRequestWithContentLength(bytes: number): NextRequest {
  return new Request("http://localhost/api/workspace/leads/import", {
    method: "POST",
    body: "",
    headers: { "content-length": String(bytes) },
  }) as unknown as NextRequest;
}

function setupAuthenticatedUser(): void {
  mockAuth.mockResolvedValue({ userId: "user_123" });
  mockCurrentUser.mockResolvedValue({
    primaryEmailAddressId: "email_primary",
    emailAddresses: [{ id: "email_primary", emailAddress: ALLOWED_EMAIL }],
  });
}

describe("POST /api/workspace/leads/import", () => {
  beforeEach(() => {
    vi.stubEnv("WORKSPACE_ALLOWED_EMAILS", ALLOWED_EMAIL);
    mockAuth.mockReset();
    mockCurrentUser.mockReset();
    mockImportLeads.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const { POST } = await import("@/app/api/workspace/leads/import/route");
    const response = await POST(makeImportRequest());

    expect(response.status).toBe(401);
    expect(mockImportLeads).not.toHaveBeenCalled();
  });

  it("returns 404 when the user is not on the allowlist", async () => {
    mockAuth.mockResolvedValue({ userId: "user_999" });
    mockCurrentUser.mockResolvedValue({
      primaryEmailAddressId: "email_primary",
      emailAddresses: [
        { id: "email_primary", emailAddress: "notallowed@example.com" },
      ],
    });

    const { POST } = await import("@/app/api/workspace/leads/import/route");
    const response = await POST(makeImportRequest());

    expect(response.status).toBe(404);
    expect(mockImportLeads).not.toHaveBeenCalled();
  });

  it("returns 413 with FileTooLarge when content-length header exceeds 2 MB", async () => {
    setupAuthenticatedUser();

    const { POST } = await import("@/app/api/workspace/leads/import/route");
    const OVER_LIMIT = 2 * 1024 * 1024 + 1;
    const response = await POST(makeRequestWithContentLength(OVER_LIMIT));

    expect(response.status).toBe(413);
    const body = await response.json();
    expect(body.error).toBe(LeadImportErrorCode.FileTooLarge);
    expect(mockImportLeads).not.toHaveBeenCalled();
  });

  it("returns 413 with FileTooLarge when file.size exceeds 2 MB", async () => {
    setupAuthenticatedUser();
    const oversizedContent = "x".repeat(2 * 1024 * 1024 + 1);
    const file = makeFile(oversizedContent);

    const { POST } = await import("@/app/api/workspace/leads/import/route");
    const response = await POST(makeImportRequest(file));

    expect(response.status).toBe(413);
    const body = await response.json();
    expect(body.error).toBe(LeadImportErrorCode.FileTooLarge);
    expect(mockImportLeads).not.toHaveBeenCalled();
  });

  it("returns 415 with UnsupportedMediaType for non-CSV MIME type", async () => {
    setupAuthenticatedUser();
    const file = makeFile(
      "email;last_name\ntest@test.com;Test",
      "text/plain",
      "leads.txt",
    );

    const { POST } = await import("@/app/api/workspace/leads/import/route");
    const response = await POST(makeImportRequest(file));

    expect(response.status).toBe(415);
    const body = await response.json();
    expect(body.error).toBe(LeadImportErrorCode.UnsupportedMediaType);
    expect(mockImportLeads).not.toHaveBeenCalled();
  });

  it("accepts application/vnd.ms-excel MIME type", async () => {
    setupAuthenticatedUser();
    const file = makeFile(
      "email;last_name\ntest@test.com;Test",
      "application/vnd.ms-excel",
      "leads.csv",
    );
    mockImportLeads.mockResolvedValue({ ok: true, report: STUB_REPORT });

    const { POST } = await import("@/app/api/workspace/leads/import/route");
    const response = await POST(makeImportRequest(file));

    expect(response.status).toBe(200);
  });

  it("accepts files with .csv extension regardless of MIME type", async () => {
    setupAuthenticatedUser();
    const file = makeFile(
      "email;last_name\ntest@test.com;Test",
      "application/octet-stream",
      "export.csv",
    );
    mockImportLeads.mockResolvedValue({ ok: true, report: STUB_REPORT });

    const { POST } = await import("@/app/api/workspace/leads/import/route");
    const response = await POST(makeImportRequest(file));

    expect(response.status).toBe(200);
  });

  it("returns 400 with EmptyFile when no file field is present", async () => {
    setupAuthenticatedUser();

    const { POST } = await import("@/app/api/workspace/leads/import/route");
    const response = await POST(makeImportRequest());

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe(LeadImportErrorCode.EmptyFile);
    expect(mockImportLeads).not.toHaveBeenCalled();
  });

  it("returns 400 with EmptyFile for a zero-byte file", async () => {
    setupAuthenticatedUser();
    const emptyFile = new File([], "empty.csv", { type: "text/csv" });

    const { POST } = await import("@/app/api/workspace/leads/import/route");
    const response = await POST(makeImportRequest(emptyFile));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe(LeadImportErrorCode.EmptyFile);
    expect(mockImportLeads).not.toHaveBeenCalled();
  });

  it("returns 200 with report on successful import (imported_count = 3)", async () => {
    setupAuthenticatedUser();
    const file = makeFile("email;last_name\ntest@test.com;Test");
    mockImportLeads.mockResolvedValue({ ok: true, report: STUB_REPORT });

    const { POST } = await import("@/app/api/workspace/leads/import/route");
    const response = await POST(makeImportRequest(file));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.report.importedCount).toBe(3);
    expect(body.report.skippedCount).toBe(0);
  });

  it("returns 200 with report on re-import (skipped_count = 3)", async () => {
    setupAuthenticatedUser();
    const file = makeFile("email;last_name\ntest@test.com;Test");
    mockImportLeads.mockResolvedValue({
      ok: true,
      report: {
        ...STUB_REPORT,
        importedCount: 0,
        skippedCount: 3,
      },
    });

    const { POST } = await import("@/app/api/workspace/leads/import/route");
    const response = await POST(makeImportRequest(file));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.report.importedCount).toBe(0);
    expect(body.report.skippedCount).toBe(3);
  });

  it("returns 422 when command reports InvalidCsv", async () => {
    setupAuthenticatedUser();
    const file = makeFile('email;last_name\nab"c;Test');
    mockImportLeads.mockResolvedValue({
      ok: false,
      error: LeadImportErrorCode.InvalidCsv,
    });

    const { POST } = await import("@/app/api/workspace/leads/import/route");
    const response = await POST(makeImportRequest(file));

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toBe(LeadImportErrorCode.InvalidCsv);
  });

  it("importLeads receives the File object (not raw body)", async () => {
    setupAuthenticatedUser();
    const file = makeFile("email;last_name\ntest@test.com;Test");
    mockImportLeads.mockResolvedValue({ ok: true, report: STUB_REPORT });

    const { POST } = await import("@/app/api/workspace/leads/import/route");
    await POST(makeImportRequest(file));

    expect(mockImportLeads).toHaveBeenCalledOnce();
    const passedFile = mockImportLeads.mock.calls[0][0] as File;
    expect(passedFile).toBeInstanceOf(File);
    expect(passedFile.name).toBe("leads.csv");
  });
});
