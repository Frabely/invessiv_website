import { describe, expect, it, vi } from "vitest";

import { accessLookupMappingService } from "@/server/workspace/access/services/access-lookup-mapping-service";

vi.mock("server-only", () => ({}));

describe("accessLookupMappingService", () => {
  it("maps a customer row to exactly the three identifying fields", () => {
    const option = accessLookupMappingService.mapCustomerRow({
      id: "customer-1",
      customer_number: 7,
      display_name: "Nordlicht Coaching",
      // A wider row must not leak through the mapper into the response.
      ...({ notes: "internal", vat_id: "DE123" } as object),
    });

    expect(option).toEqual({
      id: "customer-1",
      customerNumber: 7,
      displayName: "Nordlicht Coaching",
    });
    expect(Object.keys(option).sort()).toEqual([
      "customerNumber",
      "displayName",
      "id",
    ]);
  });

  it("maps a project row to exactly id, customer and title", () => {
    const option = accessLookupMappingService.mapProjectRow({
      id: "project-1",
      customer_id: "customer-1",
      title: "Website relaunch",
      ...({ budget_cents: 5000 } as object),
    });

    expect(option).toEqual({
      id: "project-1",
      customerId: "customer-1",
      title: "Website relaunch",
    });
    expect(Object.keys(option).sort()).toEqual(["customerId", "id", "title"]);
  });
});
