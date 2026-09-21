import { beforeEach, describe, expect, it, vi } from "vitest";

import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { LineItemTemplateErrorCode } from "@invessiv/common/constants/crm/errors/line-item-template-error-codes";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { lineItemTemplates } from "@invessiv/db/record-configuration";
import { createLineItemTemplate } from "@/server/workspace/crm/command-handler/create-line-item-template.command-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  returning: vi.fn(),
  values: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));

function createInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Landingpage",
    description: "Einseitige Website.",
    priceCents: 150000,
    pricingMode: ServicePricingMode.OneTime,
    recurringInterval: null,
    ...overrides,
  };
}

describe("createLineItemTemplate", () => {
  beforeEach(() => {
    mocks.getDatabase.mockReset();
    mocks.values.mockReset();
    mocks.returning.mockReset();
    mocks.values.mockReturnValue({ returning: mocks.returning });
    mocks.getDatabase.mockReturnValue({
      insert: vi.fn(() => ({ values: mocks.values })),
    });
  });

  it("inserts an active template starting at version 1", async () => {
    mocks.returning.mockResolvedValue([
      {
        id: "9c8f1a10-1b1a-4a10-8e10-000000000001",
        title: "Landingpage",
        description: "Einseitige Website.",
        price_cents: 150000,
        pricing_mode: ServicePricingMode.OneTime,
        recurring_interval: null,
        status: LineItemTemplateStatus.Active,
        version: 1,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
        updated_at: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);

    const result = await createLineItemTemplate(createInput());

    expect(result).toEqual({
      ok: true,
      lineItemTemplate: expect.objectContaining({
        title: "Landingpage",
        priceCents: 150000,
        status: LineItemTemplateStatus.Active,
        version: 1,
      }),
    });
    const inserted =
      mocks.getDatabase.mock.results[0]?.value.insert.mock.calls[0][0];
    expect(inserted).toBe(lineItemTemplates);
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        status: LineItemTemplateStatus.Active,
        version: 1,
        recurring_interval: null,
      }),
    );
  });

  it("returns validation issues without touching the database", async () => {
    const result = await createLineItemTemplate(createInput({ title: " " }));

    expect(result).toMatchObject({
      ok: false,
      code: LineItemTemplateErrorCode.ValidationError,
      errors: [expect.objectContaining({ path: ["title"] })],
    });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("rejects recurring pricing without an interval before writing", async () => {
    const result = await createLineItemTemplate(
      createInput({ pricingMode: ServicePricingMode.Recurring }),
    );

    expect(result.ok).toBe(false);
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("passes a recurring interval through to the insert", async () => {
    mocks.returning.mockResolvedValue([
      {
        id: "9c8f1a10-1b1a-4a10-8e10-000000000004",
        title: "Wartung",
        description: "",
        price_cents: 4900,
        pricing_mode: ServicePricingMode.Recurring,
        recurring_interval: BillingInterval.Monthly,
        status: LineItemTemplateStatus.Active,
        version: 1,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
        updated_at: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);

    await createLineItemTemplate(
      createInput({
        title: "Wartung",
        priceCents: 4900,
        pricingMode: ServicePricingMode.Recurring,
        recurringInterval: BillingInterval.Monthly,
      }),
    );

    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({ recurring_interval: BillingInterval.Monthly }),
    );
  });
});
