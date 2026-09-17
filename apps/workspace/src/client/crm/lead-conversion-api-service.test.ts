import { afterEach, describe, expect, it, vi } from "vitest";

import { LeadConversionErrorCode } from "@invessiv/common/constants/crm/errors/lead-conversion-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { leadConversionApiService } from "@/client/crm/lead-conversion-api-service";
import {
  createCustomerRequestFixture,
  TEST_CUSTOMER_ID,
} from "@/server/tests/workspace/crm/support/crm-fixtures";

const LEAD_ID = "1563eb70-d02d-4d9b-8694-d9b4e94f872c";

function respondWith(status: number, body: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("leadConversionApiService", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns only the converted customer id", async () => {
    const fetchMock = respondWith(HttpResponseCode.Created, {
      customerId: TEST_CUSTOMER_ID,
    });

    await expect(
      leadConversionApiService.convertLead(
        LEAD_ID,
        createCustomerRequestFixture(),
      ),
    ).resolves.toEqual({ ok: true, customerId: TEST_CUSTOMER_ID });
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/workspace/crm/leads/${LEAD_ID}/convert`,
      expect.objectContaining({ method: HttpMethod.Post }),
    );
  });

  it("maps known errors and rejects malformed success payloads", async () => {
    respondWith(HttpResponseCode.NotFound, {
      error: LeadConversionErrorCode.LeadNotFound,
    });
    await expect(
      leadConversionApiService.convertLead(
        LEAD_ID,
        createCustomerRequestFixture(),
      ),
    ).resolves.toEqual({
      ok: false,
      code: LeadConversionErrorCode.LeadNotFound,
    });

    respondWith(HttpResponseCode.Created, {
      customer: { id: TEST_CUSTOMER_ID },
    });
    await expect(
      leadConversionApiService.convertLead(
        LEAD_ID,
        createCustomerRequestFixture(),
      ),
    ).resolves.toEqual({
      ok: false,
      code: LeadConversionErrorCode.Internal,
    });
  });
});
