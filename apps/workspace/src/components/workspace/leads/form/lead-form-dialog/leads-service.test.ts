import { afterEach, describe, expect, it, vi } from "vitest";
import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import type { CreateLeadRequestDto } from "@invessiv/common/contracts/leads/create-lead-request.dto";
import type { UpdateLeadRequestDto } from "@invessiv/common/contracts/leads/update-lead-request.dto";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { leadsService } from "./leads-service";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("leadsService.createLead", () => {
  it("creates a lead through the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        lead: {
          id: "lead-123",
        },
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    const request: CreateLeadRequestDto = {
      displayName: "Anna Meyer",
      email: "anna@example.com",
    };

    await expect(leadsService.createLead(request)).resolves.toEqual({
      lead: {
        id: "lead-123",
      },
      ok: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      WorkspaceApiEndpoint.Leads,
      expect.objectContaining({
        body: JSON.stringify(request),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );
  });

  it("maps validation errors from the API response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        details: [{ message: "Invalid", path: ["email"], code: "custom" }],
        error: LeadErrorCode.ValidationError,
      }),
      ok: false,
      status: 400,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      leadsService.createLead({
        displayName: "Anna Meyer",
        email: "anna@example.com",
      }),
    ).resolves.toEqual({
      code: LeadErrorCode.ValidationError,
      errors: [{ message: "Invalid", path: ["email"], code: "custom" }],
      ok: false,
    });
  });

  it("maps duplicate email errors from the API response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        error: LeadErrorCode.EmailExists,
      }),
      ok: false,
      status: 409,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      leadsService.createLead({
        displayName: "Anna Meyer",
        email: "anna@example.com",
      }),
    ).resolves.toEqual({
      code: LeadErrorCode.EmailExists,
      ok: false,
    });
  });

  it("maps duplicate company errors from the API response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        error: LeadErrorCode.CompanyNameExists,
      }),
      ok: false,
      status: 409,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      leadsService.createLead({
        displayName: "Anna Meyer",
        email: "anna@example.com",
      }),
    ).resolves.toEqual({
      code: LeadErrorCode.CompanyNameExists,
      ok: false,
    });
  });
});

describe("leadsService.updateLead", () => {
  const leadId = "123e4567-e89b-12d3-a456-426614174000";

  it("updates a lead through the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        lead: {
          id: leadId,
        },
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    const request: UpdateLeadRequestDto = {
      displayName: "Anna Meyer",
      first_name: "Anna",
    };

    await expect(leadsService.updateLead(leadId, request)).resolves.toEqual({
      lead: {
        id: leadId,
      },
      ok: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `${WorkspaceApiEndpoint.Leads}/${leadId}`,
      expect.objectContaining({
        body: JSON.stringify(request),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      }),
    );
  });

  it("maps validation errors from the API response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        details: [{ message: "Invalid", path: ["email"], code: "custom" }],
        error: LeadErrorCode.ValidationError,
      }),
      ok: false,
      status: 400,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      leadsService.updateLead(leadId, {
        displayName: "Anna Meyer",
        email: "anna@example.com",
      }),
    ).resolves.toEqual({
      code: LeadErrorCode.ValidationError,
      errors: [{ message: "Invalid", path: ["email"], code: "custom" }],
      ok: false,
    });
  });

  it("maps not-found errors from the API response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        error: LeadErrorCode.NotFound,
      }),
      ok: false,
      status: 404,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      leadsService.updateLead(leadId, { displayName: "Anna Meyer" }),
    ).resolves.toEqual({
      code: LeadErrorCode.NotFound,
      ok: false,
    });
  });

  it("maps duplicate email errors from the API response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        error: LeadErrorCode.EmailExists,
      }),
      ok: false,
      status: 409,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      leadsService.updateLead(leadId, {
        displayName: "Anna Meyer",
        email: "anna@example.com",
      }),
    ).resolves.toEqual({
      code: LeadErrorCode.EmailExists,
      ok: false,
    });
  });

  it("maps duplicate company errors from the API response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        error: LeadErrorCode.CompanyNameExists,
      }),
      ok: false,
      status: 409,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      leadsService.updateLead(leadId, { displayName: "Anna Meyer" }),
    ).resolves.toEqual({
      code: LeadErrorCode.CompanyNameExists,
      ok: false,
    });
  });
});

describe("leadsService.deleteLead", () => {
  const leadId = "123e4567-e89b-12d3-a456-426614174000";

  it("deletes a lead through the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        ok: true,
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(leadsService.deleteLead(leadId)).resolves.toEqual({
      ok: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `${WorkspaceApiEndpoint.Leads}/${leadId}`,
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
        },
        method: "DELETE",
      }),
    );
  });

  it("maps not-found errors from the API response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        error: LeadErrorCode.NotFound,
      }),
      ok: false,
      status: 404,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(leadsService.deleteLead(leadId)).resolves.toEqual({
      code: LeadErrorCode.NotFound,
      ok: false,
    });
  });
});
