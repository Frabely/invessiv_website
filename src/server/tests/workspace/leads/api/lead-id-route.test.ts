import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { LeadErrorCode } from "@/common/constants/leads/errors/lead-error-codes";
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";
import { DELETE, GET, PATCH } from "@/app/api/workspace/leads/[id]/route";

vi.mock("server-only", () => ({}));

const { mockAuth, mockCurrentUser, mockGetLeadById, mockUpdateLead } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockCurrentUser: vi.fn(),
    mockGetLeadById: vi.fn(),
    mockUpdateLead: vi.fn(),
  }));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

vi.mock(
  "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler",
  () => ({ getLeadById: mockGetLeadById }),
);

vi.mock(
  "@/server/workspace/leads/command-handler/update-lead.command-handler",
  () => ({ updateLead: mockUpdateLead }),
);

const ALLOWED_EMAIL = "owner@example.com";
const LEAD_ID = "lead-uuid-123";

const STUB_LEAD: LeadDetailDto = {
  id: LEAD_ID,
  firstName: "Max",
  lastName: "Mustermann",
  companyName: null,
  email: "max@example.com",
  phone: null,
  websiteUrl: null,
  score: null,
  source: "manual",
  leadStatus: "new",
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

function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options) as unknown as NextRequest;
}

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function setupAuthenticatedUser() {
  mockAuth.mockResolvedValue({ userId: "user_123" });
  mockCurrentUser.mockResolvedValue({
    primaryEmailAddressId: "email_primary",
    emailAddresses: [{ id: "email_primary", emailAddress: ALLOWED_EMAIL }],
  });
}

describe("GET /api/workspace/leads/[id]", () => {
  beforeEach(() => {
    vi.stubEnv("WORKSPACE_ALLOWED_EMAILS", ALLOWED_EMAIL);
    mockAuth.mockReset();
    mockCurrentUser.mockReset();
    mockGetLeadById.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET(
      makeRequest(`http://localhost/api/workspace/leads/${LEAD_ID}`),
      makeContext(LEAD_ID),
    );

    expect(response.status).toBe(401);
    expect(mockGetLeadById).not.toHaveBeenCalled();
  });

  it("returns 200 with the lead when it exists", async () => {
    setupAuthenticatedUser();
    mockGetLeadById.mockResolvedValue(STUB_LEAD);

    const response = await GET(
      makeRequest(`http://localhost/api/workspace/leads/${LEAD_ID}`),
      makeContext(LEAD_ID),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("lead");
    expect(body.lead).toMatchObject({ id: LEAD_ID, email: "max@example.com" });
  });

  it("calls getLeadById with the route id param", async () => {
    setupAuthenticatedUser();
    mockGetLeadById.mockResolvedValue(STUB_LEAD);

    await GET(
      makeRequest(`http://localhost/api/workspace/leads/${LEAD_ID}`),
      makeContext(LEAD_ID),
    );

    expect(mockGetLeadById).toHaveBeenCalledWith(LEAD_ID);
  });

  it("returns 404 when the lead does not exist", async () => {
    setupAuthenticatedUser();
    mockGetLeadById.mockResolvedValue(null);

    const response = await GET(
      makeRequest(`http://localhost/api/workspace/leads/nonexistent`),
      makeContext("nonexistent"),
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toMatchObject({ error: "NOT_FOUND" });
  });
});

describe("PATCH /api/workspace/leads/[id]", () => {
  beforeEach(() => {
    vi.stubEnv("WORKSPACE_ALLOWED_EMAILS", ALLOWED_EMAIL);
    mockAuth.mockReset();
    mockCurrentUser.mockReset();
    mockUpdateLead.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await PATCH(
      makeRequest(`http://localhost/api/workspace/leads/${LEAD_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "updated" }),
      }),
      makeContext(LEAD_ID),
    );

    expect(response.status).toBe(401);
    expect(mockUpdateLead).not.toHaveBeenCalled();
  });

  it("returns 200 with the updated lead on success", async () => {
    setupAuthenticatedUser();
    const updatedLead = { ...STUB_LEAD, notes: "updated notes" };
    mockUpdateLead.mockResolvedValue({ ok: true, lead: updatedLead });

    const response = await PATCH(
      makeRequest(`http://localhost/api/workspace/leads/${LEAD_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "updated notes" }),
      }),
      makeContext(LEAD_ID),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("lead");
    expect(body.lead).toMatchObject({ notes: "updated notes" });
  });

  it("calls updateLead with the route id and parsed body", async () => {
    setupAuthenticatedUser();
    mockUpdateLead.mockResolvedValue({ ok: true, lead: STUB_LEAD });

    await PATCH(
      makeRequest(`http://localhost/api/workspace/leads/${LEAD_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: 80 }),
      }),
      makeContext(LEAD_ID),
    );

    expect(mockUpdateLead).toHaveBeenCalledWith(LEAD_ID, { score: 80 });
  });

  it("forwards nullable and empty-array update payloads", async () => {
    setupAuthenticatedUser();
    mockUpdateLead.mockResolvedValue({ ok: true, lead: STUB_LEAD });

    await PATCH(
      makeRequest(`http://localhost/api/workspace/leads/${LEAD_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: null,
          improvements: [],
          notes: null,
          social_profiles: [],
        }),
      }),
      makeContext(LEAD_ID),
    );

    expect(mockUpdateLead).toHaveBeenCalledWith(LEAD_ID, {
      company_name: null,
      improvements: [],
      notes: null,
      social_profiles: [],
    });
  });

  it("returns 404 when the lead does not exist", async () => {
    setupAuthenticatedUser();
    mockUpdateLead.mockResolvedValue({
      ok: false,
      code: LeadErrorCode.NotFound,
    });

    const response = await PATCH(
      makeRequest(`http://localhost/api/workspace/leads/nonexistent`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "x" }),
      }),
      makeContext("nonexistent"),
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toMatchObject({ error: "NOT_FOUND" });
  });

  it("returns 400 when updateLead reports a validation error", async () => {
    setupAuthenticatedUser();
    mockUpdateLead.mockResolvedValue({
      ok: false,
      code: LeadErrorCode.ValidationError,
      errors: [
        { code: "too_small", message: "Score must be >= 0", path: ["score"] },
      ],
    });

    const response = await PATCH(
      makeRequest(`http://localhost/api/workspace/leads/${LEAD_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: -1 }),
      }),
      makeContext(LEAD_ID),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ error: "VALIDATION_ERROR" });
    expect(body).toHaveProperty("details");
  });

  it("returns 409 when updateLead reports an existing email", async () => {
    setupAuthenticatedUser();
    mockUpdateLead.mockResolvedValue({
      ok: false,
      code: LeadErrorCode.EmailExists,
    });

    const response = await PATCH(
      makeRequest(`http://localhost/api/workspace/leads/${LEAD_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "existing@example.com" }),
      }),
      makeContext(LEAD_ID),
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body).toMatchObject({ error: "EMAIL_EXISTS" });
  });

  it("returns 400 when the request body is not valid JSON", async () => {
    setupAuthenticatedUser();

    const response = await PATCH(
      makeRequest(`http://localhost/api/workspace/leads/${LEAD_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }),
      makeContext(LEAD_ID),
    );

    expect(response.status).toBe(400);
    expect(mockUpdateLead).not.toHaveBeenCalled();
  });

  it("returns 500 when updateLead throws an unexpected error", async () => {
    setupAuthenticatedUser();
    mockUpdateLead.mockRejectedValue(new Error("db is down"));

    const response = await PATCH(
      makeRequest(`http://localhost/api/workspace/leads/${LEAD_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "x" }),
      }),
      makeContext(LEAD_ID),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toMatchObject({ error: "INTERNAL" });
  });
});

describe("DELETE /api/workspace/leads/[id]", () => {
  beforeEach(() => {
    vi.stubEnv("WORKSPACE_ALLOWED_EMAILS", ALLOWED_EMAIL);
    mockAuth.mockReset();
    mockCurrentUser.mockReset();
    mockUpdateLead.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await DELETE(
      makeRequest(`http://localhost/api/workspace/leads/${LEAD_ID}`, {
        method: "DELETE",
      }),
      makeContext(LEAD_ID),
    );

    expect(response.status).toBe(401);
    expect(mockUpdateLead).not.toHaveBeenCalled();
  });

  it("returns 200 with archived status on successful soft-delete", async () => {
    setupAuthenticatedUser();
    mockUpdateLead.mockResolvedValue({
      ok: true,
      lead: { ...STUB_LEAD, leadStatus: "archived" },
    });

    const response = await DELETE(
      makeRequest(`http://localhost/api/workspace/leads/${LEAD_ID}`, {
        method: "DELETE",
      }),
      makeContext(LEAD_ID),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, status: "archived" });
  });

  it("calls updateLead with lead_status=archived", async () => {
    setupAuthenticatedUser();
    mockUpdateLead.mockResolvedValue({
      ok: true,
      lead: { ...STUB_LEAD, leadStatus: "archived" },
    });

    await DELETE(
      makeRequest(`http://localhost/api/workspace/leads/${LEAD_ID}`, {
        method: "DELETE",
      }),
      makeContext(LEAD_ID),
    );

    expect(mockUpdateLead).toHaveBeenCalledWith(LEAD_ID, {
      lead_status: "archived",
    });
  });

  it("returns 404 when the lead does not exist", async () => {
    setupAuthenticatedUser();
    mockUpdateLead.mockResolvedValue({
      ok: false,
      code: LeadErrorCode.NotFound,
    });

    const response = await DELETE(
      makeRequest(`http://localhost/api/workspace/leads/nonexistent`, {
        method: "DELETE",
      }),
      makeContext("nonexistent"),
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toMatchObject({ error: "NOT_FOUND" });
  });
});
