import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { ServiceTemplateErrorCode } from "@invessiv/common/constants/crm/errors/service-template-error-codes";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { ServiceTemplateStatus } from "@invessiv/common/constants/crm/service-template-statuses";
import { updateServiceTemplate } from "@/server/workspace/crm/command-handler/update-service-template.command-handler";

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

const SERVICE_TEMPLATE_ID = "9c8f1a10-1b1a-4a10-8e10-000000000001";

function updateInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Landingpage",
    description: "",
    priceCents: 150000,
    pricingMode: ServicePricingMode.OneTime,
    recurringInterval: null,
    status: ServiceTemplateStatus.Active,
    version: 3,
    ...overrides,
  };
}

describe("updateServiceTemplate", () => {
  beforeEach(() => {
    mocks.getDatabase.mockReset();
    mocks.updateVersioned.mockReset();
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (tx: unknown) => unknown) => callback({}),
    });
  });

  it("returns not-found instead of a validation error for a malformed id", async () => {
    const result = await updateServiceTemplate("not-a-uuid", updateInput());

    expect(result).toEqual({
      ok: false,
      code: ServiceTemplateErrorCode.ServiceTemplateNotFound,
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("returns validation issues without writing", async () => {
    const result = await updateServiceTemplate(
      SERVICE_TEMPLATE_ID,
      updateInput({ title: " " }),
    );

    expect(result).toMatchObject({
      ok: false,
      code: ServiceTemplateErrorCode.ValidationError,
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("maps a successful write to the DTO result", async () => {
    mocks.updateVersioned.mockResolvedValue({
      ok: true,
      value: { id: SERVICE_TEMPLATE_ID, title: "Landingpage" },
    });

    const result = await updateServiceTemplate(
      SERVICE_TEMPLATE_ID,
      updateInput(),
    );

    expect(result).toEqual({
      ok: true,
      serviceTemplate: { id: SERVICE_TEMPLATE_ID, title: "Landingpage" },
    });
  });

  it("maps a missing row to ServiceTemplateNotFound", async () => {
    mocks.updateVersioned.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.NotFound,
    });

    const result = await updateServiceTemplate(
      SERVICE_TEMPLATE_ID,
      updateInput(),
    );

    expect(result).toEqual({
      ok: false,
      code: ServiceTemplateErrorCode.ServiceTemplateNotFound,
    });
  });

  it("passes a version conflict through unchanged", async () => {
    const conflict = {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 4,
      current: { id: SERVICE_TEMPLATE_ID },
    };
    mocks.updateVersioned.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });

    const result = await updateServiceTemplate(
      SERVICE_TEMPLATE_ID,
      updateInput(),
    );

    expect(result).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });
  });
});
