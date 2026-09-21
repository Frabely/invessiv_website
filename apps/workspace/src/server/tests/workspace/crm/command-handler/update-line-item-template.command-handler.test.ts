import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { LineItemTemplateErrorCode } from "@invessiv/common/constants/crm/errors/line-item-template-error-codes";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { updateLineItemTemplate } from "@/server/workspace/crm/command-handler/update-line-item-template.command-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  updateVersioned: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/workspace/shared/update-versioned", () => ({
  updateVersioned: mocks.updateVersioned,
}));

const LINE_ITEM_TEMPLATE_ID = "9c8f1a10-1b1a-4a10-8e10-000000000001";

function updateInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Landingpage",
    description: "",
    priceCents: 150000,
    pricingMode: ServicePricingMode.OneTime,
    recurringInterval: null,
    status: LineItemTemplateStatus.Active,
    version: 3,
    ...overrides,
  };
}

describe("updateLineItemTemplate", () => {
  beforeEach(() => {
    mocks.getDatabase.mockReset();
    mocks.updateVersioned.mockReset();
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (tx: unknown) => unknown) => callback({}),
    });
  });

  it("returns not-found instead of a validation error for a malformed id", async () => {
    const result = await updateLineItemTemplate("not-a-uuid", updateInput());

    expect(result).toEqual({
      ok: false,
      code: LineItemTemplateErrorCode.LineItemTemplateNotFound,
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("returns validation issues without writing", async () => {
    const result = await updateLineItemTemplate(
      LINE_ITEM_TEMPLATE_ID,
      updateInput({ title: " " }),
    );

    expect(result).toMatchObject({
      ok: false,
      code: LineItemTemplateErrorCode.ValidationError,
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("maps a successful write to the DTO result", async () => {
    mocks.updateVersioned.mockResolvedValue({
      ok: true,
      value: { id: LINE_ITEM_TEMPLATE_ID, title: "Landingpage" },
    });

    const result = await updateLineItemTemplate(
      LINE_ITEM_TEMPLATE_ID,
      updateInput(),
    );

    expect(result).toEqual({
      ok: true,
      lineItemTemplate: { id: LINE_ITEM_TEMPLATE_ID, title: "Landingpage" },
    });
  });

  it("maps a missing row to LineItemTemplateNotFound", async () => {
    mocks.updateVersioned.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.NotFound,
    });

    const result = await updateLineItemTemplate(
      LINE_ITEM_TEMPLATE_ID,
      updateInput(),
    );

    expect(result).toEqual({
      ok: false,
      code: LineItemTemplateErrorCode.LineItemTemplateNotFound,
    });
  });

  it("passes a version conflict through unchanged", async () => {
    const conflict = {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 4,
      current: { id: LINE_ITEM_TEMPLATE_ID },
    };
    mocks.updateVersioned.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });

    const result = await updateLineItemTemplate(
      LINE_ITEM_TEMPLATE_ID,
      updateInput(),
    );

    expect(result).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });
  });
});
