import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HourPurchaseSource } from "@invessiv/common/constants/crm/hour-purchase-sources";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { POST as POST_ALLOCATION } from "@/app/api/workspace/crm/customers/[id]/hour-allocations/route";
import { POST as POST_PURCHASE } from "@/app/api/workspace/crm/customers/[id]/hour-purchases/route";
import {
  authorizedWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
} from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const KEY = "77777777-7777-4777-8777-777777777777";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  createHourPurchase: vi.fn(),
  createHourAllocation: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/crm/command-handler/create-hour-purchase.command-handler",
  () => ({ createHourPurchase: mocks.createHourPurchase }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/create-hour-allocation.command-handler",
  () => ({ createHourAllocation: mocks.createHourAllocation }),
);

const context = { params: Promise.resolve({ id: CUSTOMER_ID }) };
const PURCHASES_URL = `http://localhost/api/workspace/crm/customers/${CUSTOMER_ID}/hour-purchases`;
const ALLOCATIONS_URL = `http://localhost/api/workspace/crm/customers/${CUSTOMER_ID}/hour-allocations`;

function jsonRequest(url: string, body: string): NextRequest {
  return new Request(url, {
    method: HttpMethod.Post,
    body,
    headers: { [HttpHeaderName.ContentType]: MediaType.Json },
  }) as unknown as NextRequest;
}

const balance = {
  purchasedMinutes: 600,
  allocatedMinutes: 300,
  freeMinutes: 300,
  usedMinutes: 0,
  goodwillMinutes: 0,
  remainingMinutes: 600,
};
const project = {
  projectId: PROJECT_ID,
  allocatedMinutes: 300,
  usedMinutes: 0,
  goodwillMinutes: 0,
  remainingMinutes: 300,
  releasableMinutes: 300,
};
const purchase = {
  id: "88888888-8888-4888-8888-888888888888",
  kind: HourPurchaseKind.Purchase,
  source: HourPurchaseSource.Manual,
  minutes: 600,
  purchasedOn: "2026-10-08",
  note: "Betreuungspaket",
  createdByMemberId: "member-actor-uuid",
  createdAt: "2026-10-08T10:00:00.000Z",
};
const allocation = {
  id: "99999999-9999-4999-8999-999999999999",
  projectId: PROJECT_ID,
  minutes: 300,
  note: "",
  createdByMemberId: "member-actor-uuid",
  createdAt: "2026-10-08T10:00:00.000Z",
};

const purchaseBody = JSON.stringify({
  idempotencyKey: KEY,
  kind: HourPurchaseKind.Purchase,
  minutes: 600,
  purchasedOn: "2026-10-08",
  note: "Betreuungspaket",
});
const allocationBody = JSON.stringify({
  idempotencyKey: KEY,
  projectId: PROJECT_ID,
  minutes: 300,
  note: "",
});

describe("CRM hours routes", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticate.mockResolvedValue(authorizedWorkspaceRequest());
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /crm/customers/[id]/hour-purchases", () => {
    it("answers 401 without a session", async () => {
      mocks.authenticate.mockResolvedValue(unauthenticatedWorkspaceRequest());

      const response = await POST_PURCHASE(
        jsonRequest(PURCHASES_URL, purchaseBody),
        context,
      );

      expect(response.status).toBe(HttpResponseCode.Unauthorized);
      expect(mocks.createHourPurchase).not.toHaveBeenCalled();
    });

    it("answers 403 without hours.manage anywhere", async () => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([
          Permission.HoursRead,
          Permission.HoursWrite,
        ]),
      );

      const response = await POST_PURCHASE(
        jsonRequest(PURCHASES_URL, purchaseBody),
        context,
      );

      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks.createHourPurchase).not.toHaveBeenCalled();
    });

    it("creates the purchase and returns the new balance", async () => {
      mocks.createHourPurchase.mockResolvedValue({
        ok: true,
        purchase,
        balance,
      });

      const response = await POST_PURCHASE(
        jsonRequest(PURCHASES_URL, purchaseBody),
        context,
      );

      expect(response.status).toBe(HttpResponseCode.Created);
      expect(await response.json()).toEqual({ purchase, balance });
      expect(mocks.createHourPurchase).toHaveBeenCalledWith(
        CUSTOMER_ID,
        JSON.parse(purchaseBody),
        expect.anything(),
      );
    });

    it("answers 409 with the balance when a correction falls below the allocation", async () => {
      mocks.createHourPurchase.mockResolvedValue({
        ok: false,
        code: HoursErrorCode.BelowAllocatedHours,
        balance,
      });

      const response = await POST_PURCHASE(
        jsonRequest(PURCHASES_URL, purchaseBody),
        context,
      );

      expect(response.status).toBe(HttpResponseCode.Conflict);
      expect(await response.json()).toMatchObject({
        error: HoursErrorCode.BelowAllocatedHours,
        details: { balance },
      });
    });

    it("answers 404 for a customer outside the access scope", async () => {
      mocks.createHourPurchase.mockResolvedValue({
        ok: false,
        code: HoursErrorCode.CustomerNotFound,
      });

      const response = await POST_PURCHASE(
        jsonRequest(PURCHASES_URL, purchaseBody),
        context,
      );

      expect(response.status).toBe(HttpResponseCode.NotFound);
    });

    it("answers 422 with the issues for an invalid body and 400 for no JSON", async () => {
      mocks.createHourPurchase.mockResolvedValue({
        ok: false,
        code: HoursErrorCode.ValidationError,
        errors: [{ path: ["minutes"] }],
      });

      const invalid = await POST_PURCHASE(
        jsonRequest(PURCHASES_URL, purchaseBody),
        context,
      );
      expect(invalid.status).toBe(HttpResponseCode.UnprocessableContent);
      expect(await invalid.json()).toMatchObject({
        details: [{ path: ["minutes"] }],
      });

      const broken = await POST_PURCHASE(
        jsonRequest(PURCHASES_URL, "{"),
        context,
      );
      expect(broken.status).toBe(HttpResponseCode.BadRequest);
    });

    it("answers 500 without leaking the failure", async () => {
      mocks.createHourPurchase.mockRejectedValue(new Error("boom"));

      const response = await POST_PURCHASE(
        jsonRequest(PURCHASES_URL, purchaseBody),
        context,
      );

      expect(response.status).toBe(HttpResponseCode.InternalServerError);
      expect(JSON.stringify(await response.json())).not.toContain("boom");
    });
  });

  describe("POST /crm/customers/[id]/hour-allocations", () => {
    it("answers 403 without hours.manage anywhere", async () => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.HoursRead]),
      );

      const response = await POST_ALLOCATION(
        jsonRequest(ALLOCATIONS_URL, allocationBody),
        context,
      );

      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks.createHourAllocation).not.toHaveBeenCalled();
    });

    it("creates the allocation and returns both balances", async () => {
      mocks.createHourAllocation.mockResolvedValue({
        ok: true,
        allocation,
        balance,
        project,
      });

      const response = await POST_ALLOCATION(
        jsonRequest(ALLOCATIONS_URL, allocationBody),
        context,
      );

      expect(response.status).toBe(HttpResponseCode.Created);
      expect(await response.json()).toEqual({ allocation, balance, project });
    });

    it.each([
      HoursErrorCode.InsufficientFreeHours,
      HoursErrorCode.InsufficientReleasableHours,
    ])("answers 409 with the current figures for %s", async (code) => {
      mocks.createHourAllocation.mockResolvedValue({
        ok: false,
        code,
        balance,
        project,
      });

      const response = await POST_ALLOCATION(
        jsonRequest(ALLOCATIONS_URL, allocationBody),
        context,
      );

      expect(response.status).toBe(HttpResponseCode.Conflict);
      expect(await response.json()).toMatchObject({
        error: code,
        details: { balance, project },
      });
    });

    it("answers 409 for a closed project and 404 for a foreign one", async () => {
      mocks.createHourAllocation.mockResolvedValueOnce({
        ok: false,
        code: HoursErrorCode.ProjectClosed,
      });
      mocks.createHourAllocation.mockResolvedValueOnce({
        ok: false,
        code: HoursErrorCode.ProjectNotFound,
      });

      const closed = await POST_ALLOCATION(
        jsonRequest(ALLOCATIONS_URL, allocationBody),
        context,
      );
      const foreign = await POST_ALLOCATION(
        jsonRequest(ALLOCATIONS_URL, allocationBody),
        context,
      );

      expect(closed.status).toBe(HttpResponseCode.Conflict);
      expect(foreign.status).toBe(HttpResponseCode.NotFound);
    });
  });
});
