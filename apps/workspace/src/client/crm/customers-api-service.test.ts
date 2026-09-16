import { afterEach, describe, expect, it, vi } from "vitest";

import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { customersApiService } from "@/client/crm/customers-api-service";
import {
  createCustomerRequestFixture,
  customerDetailFixture,
  TEST_CUSTOMER_ID,
  updateCustomerRequestFixture,
} from "@/server/tests/workspace/crm/support/crm-fixtures";

function respondWith(status: number, body: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("customersApiService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts a new customer and returns it", async () => {
    const fetchMock = respondWith(HttpResponseCode.Created, {
      customer: customerDetailFixture(),
    });

    await expect(
      customersApiService.createCustomer(createCustomerRequestFixture()),
    ).resolves.toEqual({ ok: true, customer: customerDetailFixture() });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/workspace/crm/customers",
      expect.objectContaining({ method: HttpMethod.Post }),
    );
  });

  it("maps a known error code", async () => {
    respondWith(HttpResponseCode.Conflict, {
      error: CustomerErrorCode.DisplayNameTaken,
    });

    await expect(
      customersApiService.createCustomer(createCustomerRequestFixture()),
    ).resolves.toEqual({
      ok: false,
      code: CustomerErrorCode.DisplayNameTaken,
    });
  });

  it("returns the fresh state of a version conflict", async () => {
    const current = customerDetailFixture({ version: 4 });
    const fetchMock = respondWith(HttpResponseCode.Conflict, {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 4,
      current,
    });
    await expect(
      customersApiService.updateCustomer(
        TEST_CUSTOMER_ID,
        updateCustomerRequestFixture({ version: 3 }),
      ),
    ).resolves.toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/workspace/crm/customers/${TEST_CUSTOMER_ID}`,
      expect.objectContaining({ method: HttpMethod.Patch }),
    );
  });

  it("falls back to internal for unknown payloads and network failures", async () => {
    respondWith(HttpResponseCode.InternalServerError, { error: "SOMETHING" });
    await expect(
      customersApiService.createCustomer(createCustomerRequestFixture()),
    ).resolves.toEqual({ ok: false, code: CustomerErrorCode.Internal });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(
      customersApiService.createCustomer(createCustomerRequestFixture()),
    ).resolves.toEqual({ ok: false, code: CustomerErrorCode.Internal });
  });
});
