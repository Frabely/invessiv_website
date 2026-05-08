import { afterEach, describe, expect, it, vi } from "vitest";
import { LeadErrorCode } from "@/common/constants/leads/lead-error-codes";
import type { CreateLeadRequestDto } from "@/common/contracts/leads/create-lead-request.dto";
import { leadsService } from "./leads-service";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("leadsService.createLeade", () => {
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
      email: "anna@example.com",
    };

    await expect(leadsService.createLead(request)).resolves.toEqual({
      lead: {
        id: "lead-123",
      },
      ok: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/workspace/leads",
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
      leadsService.createLead({ email: "anna@example.com" }),
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
      leadsService.createLead({ email: "anna@example.com" }),
    ).resolves.toEqual({
      code: LeadErrorCode.EmailExists,
      ok: false,
    });
  });
});
