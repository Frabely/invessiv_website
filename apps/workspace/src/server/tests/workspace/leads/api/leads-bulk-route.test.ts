import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadBulkAction } from "@invessiv/common/constants/leads/bulk/lead-bulk-actions";
import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import { POST } from "@/app/api/workspace/leads/bulk/route";
import { leadBulkActionSchema } from "@/server/workspace/leads/services/bulk-action.schema";

vi.mock("server-only", () => ({}));

const VALID_UUID_A = "00000000-0000-4000-8000-000000000001";
const VALID_UUID_B = "00000000-0000-4000-8000-000000000002";
const VALID_UUID_C = "00000000-0000-4000-8000-000000000003";

const {
  mockAuth,
  mockCurrentUser,
  mockBulkEditLeads,
  mockBulkArchiveLeads,
  mockBulkDeleteLeads,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCurrentUser: vi.fn(),
  mockBulkEditLeads: vi.fn(),
  mockBulkArchiveLeads: vi.fn(),
  mockBulkDeleteLeads: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

vi.mock(
  "@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler",
  () => ({ bulkEditLeads: mockBulkEditLeads }),
);
vi.mock(
  "@/server/workspace/leads/command-handler/bulk-archive-leads.command-handler",
  () => ({ bulkArchiveLeads: mockBulkArchiveLeads }),
);
vi.mock(
  "@/server/workspace/leads/command-handler/bulk-delete-leads.command-handler",
  () => ({ bulkDeleteLeads: mockBulkDeleteLeads }),
);

const ALLOWED_EMAIL = "owner@example.com";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/workspace/leads/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function setupAuthenticatedUser() {
  mockAuth.mockResolvedValue({ userId: "user_123" });
  mockCurrentUser.mockResolvedValue({
    primaryEmailAddressId: "email_primary",
    emailAddresses: [{ id: "email_primary", emailAddress: ALLOWED_EMAIL }],
  });
}

describe("POST /api/workspace/leads/bulk", () => {
  beforeEach(() => {
    vi.stubEnv("WORKSPACE_ALLOWED_EMAILS", ALLOWED_EMAIL);
    mockAuth.mockReset();
    mockCurrentUser.mockReset();
    mockBulkEditLeads.mockReset();
    mockBulkArchiveLeads.mockReset();
    mockBulkDeleteLeads.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(
      makeRequest({
        action: LeadBulkAction.BulkEdit,
        ids: [VALID_UUID_A],
        patch: { status: ContactLeadStatus.New },
      }),
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({ ok: false });
    expect(mockBulkEditLeads).not.toHaveBeenCalled();
  });

  it("bulk_edit: returns 200 with updatedCount and failedLeads", async () => {
    setupAuthenticatedUser();
    mockBulkEditLeads.mockResolvedValue({
      ok: true,
      updatedCount: 3,
      failedLeads: [],
    });

    const response = await POST(
      makeRequest({
        action: LeadBulkAction.BulkEdit,
        ids: [VALID_UUID_A, VALID_UUID_B, VALID_UUID_C],
        patch: { status: ContactLeadStatus.Qualified },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: true,
      updatedCount: 3,
      failedLeads: [],
    });
    expect(mockBulkEditLeads).toHaveBeenCalledWith({
      ids: [VALID_UUID_A, VALID_UUID_B, VALID_UUID_C],
      patch: { status: ContactLeadStatus.Qualified },
    });
  });

  it("archive: returns 200 with updatedCount", async () => {
    setupAuthenticatedUser();
    mockBulkArchiveLeads.mockResolvedValue({ ok: true, updatedCount: 2 });

    const response = await POST(
      makeRequest({
        action: LeadBulkAction.Archive,
        ids: [VALID_UUID_A, VALID_UUID_B],
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, updatedCount: 2 });
    expect(mockBulkArchiveLeads).toHaveBeenCalledWith({
      ids: [VALID_UUID_A, VALID_UUID_B],
    });
  });

  it("delete: returns 200 with deletedCount", async () => {
    setupAuthenticatedUser();
    mockBulkDeleteLeads.mockResolvedValue({ ok: true, deletedCount: 1 });

    const response = await POST(
      makeRequest({
        action: LeadBulkAction.Delete,
        ids: [VALID_UUID_A],
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, deletedCount: 1 });
    expect(mockBulkDeleteLeads).toHaveBeenCalledWith({ ids: [VALID_UUID_A] });
  });

  it("returns 400 when ids array is empty", async () => {
    setupAuthenticatedUser();

    const response = await POST(
      makeRequest({
        action: LeadBulkAction.BulkEdit,
        ids: [],
        patch: { status: ContactLeadStatus.New },
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ error: LeadErrorCode.ValidationError });
    expect(mockBulkEditLeads).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown action", async () => {
    setupAuthenticatedUser();

    const response = await POST(
      makeRequest({ action: "delete_all", ids: [VALID_UUID_A] }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ error: LeadErrorCode.ValidationError });
  });

  it("returns 400 when bulk_edit patch is empty", async () => {
    setupAuthenticatedUser();

    const response = await POST(
      makeRequest({
        action: LeadBulkAction.BulkEdit,
        ids: [VALID_UUID_A],
        patch: {},
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ error: LeadErrorCode.ValidationError });
    expect(mockBulkEditLeads).not.toHaveBeenCalled();
  });

  it("returns 400 when bulk_edit tries to archive a lead", async () => {
    setupAuthenticatedUser();

    const response = await POST(
      makeRequest({
        action: LeadBulkAction.BulkEdit,
        ids: [VALID_UUID_A],
        patch: { status: ContactLeadStatus.Archived },
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ error: LeadErrorCode.ValidationError });
    expect(body.details?.[0]?.message).toBe(
      "bulk_edit_status_archive_disallowed",
    );
    expect(mockBulkEditLeads).not.toHaveBeenCalled();
  });

  it("returns 400 when the request body is not valid JSON", async () => {
    setupAuthenticatedUser();

    const response = await POST(
      new Request("http://localhost/api/workspace/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }) as unknown as NextRequest,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ error: LeadErrorCode.ValidationError });
  });

  it("returns 500 when bulkEditLeads throws an unexpected error", async () => {
    setupAuthenticatedUser();
    mockBulkEditLeads.mockRejectedValue(new Error("database is down"));

    const response = await POST(
      makeRequest({
        action: LeadBulkAction.BulkEdit,
        ids: [VALID_UUID_A],
        patch: { status: ContactLeadStatus.New },
      }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toMatchObject({ error: LeadErrorCode.Internal });
  });

  it("accepts all documented actions through the schema", () => {
    expect(
      leadBulkActionSchema.safeParse({
        action: LeadBulkAction.BulkEdit,
        ids: [VALID_UUID_A],
        patch: { status: ContactLeadStatus.New },
      }).success,
    ).toBe(true);
    expect(
      leadBulkActionSchema.safeParse({
        action: LeadBulkAction.Archive,
        ids: [VALID_UUID_A],
      }).success,
    ).toBe(true);
    expect(
      leadBulkActionSchema.safeParse({
        action: LeadBulkAction.Delete,
        ids: [VALID_UUID_A],
      }).success,
    ).toBe(true);
  });
});
