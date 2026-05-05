import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { LeadErrorCode } from "@/common/constants/leads/lead-error-codes";
import { POST } from "@/app/api/workspace/leads/bulk/route";
import {
  LeadBulkAction,
  leadBulkActionSchema,
} from "@/app/api/workspace/leads/bulk/bulk-action-schema";

vi.mock("server-only", () => ({}));

const { mockAuth, mockCurrentUser, mockBulkEditLeads } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCurrentUser: vi.fn(),
  mockBulkEditLeads: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

vi.mock(
  "@/server/workspace/leads/command-handler/bulk-edit-leads.command-handler",
  () => ({ bulkEditLeads: mockBulkEditLeads }),
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
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(
      makeRequest({
        action: LeadBulkAction.SetStatus,
        ids: ["id-1"],
        status: ContactLeadStatus.New,
      }),
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({ ok: false });
    expect(mockBulkEditLeads).not.toHaveBeenCalled();
  });

  it("set_status: returns 200 with updatedCount on success", async () => {
    setupAuthenticatedUser();
    mockBulkEditLeads.mockResolvedValue({ ok: true, updatedCount: 3 });

    const response = await POST(
      makeRequest({
        action: LeadBulkAction.SetStatus,
        ids: ["id-1", "id-2", "id-3"],
        status: ContactLeadStatus.Qualified,
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, updatedCount: 3 });
  });

  it("set_status: calls bulkEditLeads with ids and status", async () => {
    setupAuthenticatedUser();
    mockBulkEditLeads.mockResolvedValue({ ok: true, updatedCount: 2 });

    await POST(
      makeRequest({
        action: LeadBulkAction.SetStatus,
        ids: ["id-a", "id-b"],
        status: ContactLeadStatus.Contacted,
      }),
    );

    expect(mockBulkEditLeads).toHaveBeenCalledWith({
      ids: ["id-a", "id-b"],
      status: ContactLeadStatus.Contacted,
    });
  });

  it("archive: returns 200 and calls bulkEditLeads with status=archived", async () => {
    setupAuthenticatedUser();
    mockBulkEditLeads.mockResolvedValue({ ok: true, updatedCount: 2 });

    const response = await POST(
      makeRequest({ action: LeadBulkAction.Archive, ids: ["id-1", "id-2"] }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, updatedCount: 2 });
    expect(mockBulkEditLeads).toHaveBeenCalledWith({
      ids: ["id-1", "id-2"],
      status: ContactLeadStatus.Archived,
    });
  });

  it("returns 400 when ids array is empty", async () => {
    setupAuthenticatedUser();

    const response = await POST(
      makeRequest({
        action: LeadBulkAction.SetStatus,
        ids: [],
        status: ContactLeadStatus.New,
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
      makeRequest({ action: "delete_all", ids: ["id-1"] }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ error: LeadErrorCode.ValidationError });
    expect(mockBulkEditLeads).not.toHaveBeenCalled();
  });

  it("returns 400 when set_status is missing status field", async () => {
    setupAuthenticatedUser();

    const response = await POST(
      makeRequest({ action: LeadBulkAction.SetStatus, ids: ["id-1"] }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ error: LeadErrorCode.ValidationError });
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
    expect(mockBulkEditLeads).not.toHaveBeenCalled();
  });

  it("returns 500 when bulkEditLeads throws an unexpected error", async () => {
    setupAuthenticatedUser();
    mockBulkEditLeads.mockRejectedValue(new Error("database is down"));

    const response = await POST(
      makeRequest({
        action: LeadBulkAction.SetStatus,
        ids: ["id-1"],
        status: ContactLeadStatus.New,
      }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toMatchObject({ error: LeadErrorCode.Internal });
  });

  it("accepts both documented actions through the extracted schema", () => {
    expect(
      leadBulkActionSchema.safeParse({
        action: LeadBulkAction.SetStatus,
        ids: ["id-1"],
        status: ContactLeadStatus.New,
      }).success,
    ).toBe(true);
    expect(
      leadBulkActionSchema.safeParse({
        action: LeadBulkAction.Archive,
        ids: ["id-1"],
      }).success,
    ).toBe(true);
  });
});
