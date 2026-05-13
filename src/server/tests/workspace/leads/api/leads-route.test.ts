import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { LeadErrorCode } from "@/common/constants/leads/errors/lead-error-codes";
import type { CreateLeadRequestDto } from "@/common/contracts/leads/create-lead-request.dto";
import type { ListLeadsResult } from "@/common/contracts/leads/results/list-leads-result";
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";
import { GET, POST } from "@/app/api/workspace/leads/route";

vi.mock("server-only", () => ({}));

const { mockAuth, mockCurrentUser, mockListLeads, mockCreateLead } = vi.hoisted(
  () => ({
    mockAuth: vi.fn(),
    mockCurrentUser: vi.fn(),
    mockListLeads: vi.fn(),
    mockCreateLead: vi.fn(),
  }),
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

vi.mock(
  "@/server/workspace/leads/query-handler/list-leads.query-handler",
  () => ({ listLeads: mockListLeads }),
);

vi.mock(
  "@/server/workspace/leads/command-handler/create-lead.command-handler",
  () => ({ createLead: mockCreateLead }),
);

const ALLOWED_EMAIL = "owner@example.com";

const STUB_LEAD: LeadDetailDto = {
  id: "lead-uuid-1",
  displayName: "Max Mustermann",
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

const STUB_LIST_RESULT: ListLeadsResult = {
  rows: [],
  total: 0,
  page: 1,
  perPage: 25,
};

function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options) as unknown as NextRequest;
}

function setupAuthenticatedUser() {
  mockAuth.mockResolvedValue({ userId: "user_123" });
  mockCurrentUser.mockResolvedValue({
    primaryEmailAddressId: "email_primary",
    emailAddresses: [{ id: "email_primary", emailAddress: ALLOWED_EMAIL }],
  });
}

describe("GET /api/workspace/leads", () => {
  beforeEach(() => {
    vi.stubEnv("WORKSPACE_ALLOWED_EMAILS", ALLOWED_EMAIL);
    mockAuth.mockReset();
    mockCurrentUser.mockReset();
    mockListLeads.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET(
      makeRequest("http://localhost/api/workspace/leads"),
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({ ok: false });
    expect(mockListLeads).not.toHaveBeenCalled();
  });

  it("returns 200 with list result on a successful query", async () => {
    setupAuthenticatedUser();
    mockListLeads.mockResolvedValue(STUB_LIST_RESULT);

    const response = await GET(
      makeRequest("http://localhost/api/workspace/leads"),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ rows: [], total: 0, page: 1, perPage: 25 });
  });

  it("forwards search query param to listLeads", async () => {
    setupAuthenticatedUser();
    mockListLeads.mockResolvedValue(STUB_LIST_RESULT);

    await GET(makeRequest("http://localhost/api/workspace/leads?search=acme"));

    expect(mockListLeads).toHaveBeenCalledWith(
      expect.objectContaining({ search: "acme" }),
    );
  });

  it("forwards page query param to listLeads as a number", async () => {
    setupAuthenticatedUser();
    mockListLeads.mockResolvedValue(STUB_LIST_RESULT);

    await GET(makeRequest("http://localhost/api/workspace/leads?page=3"));

    expect(mockListLeads).toHaveBeenCalledWith(
      expect.objectContaining({ page: 3 }),
    );
  });

  it("forwards score_min query param to listLeads as a number", async () => {
    setupAuthenticatedUser();
    mockListLeads.mockResolvedValue(STUB_LIST_RESULT);

    await GET(makeRequest("http://localhost/api/workspace/leads?score_min=70"));

    expect(mockListLeads).toHaveBeenCalledWith(
      expect.objectContaining({ score_min: 70 }),
    );
  });

  it("returns 400 when a filter query param has an invalid value", async () => {
    setupAuthenticatedUser();

    const response = await GET(
      makeRequest(
        "http://localhost/api/workspace/leads?status=not_a_valid_status",
      ),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ error: "VALIDATION_ERROR" });
    expect(mockListLeads).not.toHaveBeenCalled();
  });
});

describe("POST /api/workspace/leads", () => {
  beforeEach(() => {
    vi.stubEnv("WORKSPACE_ALLOWED_EMAILS", ALLOWED_EMAIL);
    mockAuth.mockReset();
    mockCurrentUser.mockReset();
    mockCreateLead.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(
      makeRequest("http://localhost/api/workspace/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "X Example",
          email: "x@example.com",
          last_name: "X",
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(mockCreateLead).not.toHaveBeenCalled();
  });

  it("returns 201 with the created lead on success", async () => {
    setupAuthenticatedUser();
    mockCreateLead.mockResolvedValue({ ok: true, lead: STUB_LEAD });

    const requestBody: CreateLeadRequestDto = {
      displayName: "Max Mustermann",
      email: "max@example.com",
      last_name: "Mustermann",
    };

    const response = await POST(
      makeRequest("http://localhost/api/workspace/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }),
    );

    expect(response.status).toBe(201);
    expect(mockCreateLead).toHaveBeenCalledWith(requestBody);
    const body = await response.json();
    expect(body).toHaveProperty("lead");
    expect(body.lead).toMatchObject({
      id: STUB_LEAD.id,
      email: STUB_LEAD.email,
    });
  });

  it("returns 400 when the request body fails DTO validation", async () => {
    setupAuthenticatedUser();

    const response = await POST(
      makeRequest("http://localhost/api/workspace/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ last_name: "X" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ error: "VALIDATION_ERROR" });
    expect(body).toHaveProperty("details");
    expect(mockCreateLead).not.toHaveBeenCalled();
  });

  it("returns 409 when the email already exists", async () => {
    setupAuthenticatedUser();
    mockCreateLead.mockResolvedValue({
      ok: false,
      code: LeadErrorCode.EmailExists,
    });

    const response = await POST(
      makeRequest("http://localhost/api/workspace/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "X Example",
          email: "existing@example.com",
          last_name: "X",
        }),
      }),
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body).toMatchObject({ error: "EMAIL_EXISTS" });
  });

  it("returns 409 when the company name already exists", async () => {
    setupAuthenticatedUser();
    mockCreateLead.mockResolvedValue({
      ok: false,
      code: LeadErrorCode.CompanyNameExists,
    });

    const response = await POST(
      makeRequest("http://localhost/api/workspace/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "ACME GmbH",
          company_name: "ACME GmbH",
        }),
      }),
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body).toMatchObject({ error: "COMPANY_NAME_EXISTS" });
  });

  it("returns 400 when the request body is not valid JSON", async () => {
    setupAuthenticatedUser();

    const response = await POST(
      makeRequest("http://localhost/api/workspace/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ error: "VALIDATION_ERROR" });
    expect(mockCreateLead).not.toHaveBeenCalled();
  });

  it("returns 400 when the request body contains an invalid phone number", async () => {
    setupAuthenticatedUser();

    const response = await POST(
      makeRequest("http://localhost/api/workspace/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "valid@example.com",
          last_name: "X",
          phone: "abc123",
        }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ error: "VALIDATION_ERROR" });
    expect(mockCreateLead).not.toHaveBeenCalled();
  });

  it("returns 500 when createLead throws an unexpected error", async () => {
    setupAuthenticatedUser();
    mockCreateLead.mockRejectedValue(new Error("database is down"));

    const response = await POST(
      makeRequest("http://localhost/api/workspace/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "X Example",
          email: "x@example.com",
          last_name: "X",
        }),
      }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toMatchObject({ error: "INTERNAL" });
  });
});
