import { beforeEach, describe, expect, it, vi } from "vitest";

import { getLineItemTemplateById } from "@/server/workspace/crm/query-handler/get-line-item-template-by-id.query-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  database: { marker: "db" },
  findById: vi.fn(),
}));

vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: () => mocks.database,
}));
vi.mock(
  "@/server/workspace/crm/services/line-item-template-read-service",
  () => ({
    lineItemTemplateReadService: { findById: mocks.findById },
  }),
);

const TEMPLATE_ID = "9c8f1a10-1b1a-4a10-8e10-000000000001";

describe("getLineItemTemplateById", () => {
  beforeEach(() => {
    mocks.findById.mockReset();
  });

  it("returns the template for a known id", async () => {
    const dto = { id: TEMPLATE_ID, version: 1 };
    mocks.findById.mockResolvedValueOnce(dto);

    await expect(getLineItemTemplateById(TEMPLATE_ID)).resolves.toEqual(dto);
    expect(mocks.findById).toHaveBeenCalledWith(mocks.database, TEMPLATE_ID);
  });

  it("returns null for a malformed id without querying the database", async () => {
    await expect(getLineItemTemplateById("not-a-uuid")).resolves.toBeNull();
    expect(mocks.findById).not.toHaveBeenCalled();
  });

  it("returns null for an unknown id", async () => {
    mocks.findById.mockResolvedValueOnce(null);

    await expect(getLineItemTemplateById(TEMPLATE_ID)).resolves.toBeNull();
  });
});
