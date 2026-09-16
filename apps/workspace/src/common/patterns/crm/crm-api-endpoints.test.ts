import { describe, expect, it } from "vitest";

import { crmCustomerEndpoint } from "@/common/patterns/crm/crm-api-endpoints";

describe("crmCustomerEndpoint", () => {
  it("appends the encoded customer id to the collection endpoint", () => {
    expect(crmCustomerEndpoint("abc")).toBe("/api/workspace/crm/customers/abc");
    expect(crmCustomerEndpoint("a/b")).toBe(
      "/api/workspace/crm/customers/a%2Fb",
    );
  });
});
