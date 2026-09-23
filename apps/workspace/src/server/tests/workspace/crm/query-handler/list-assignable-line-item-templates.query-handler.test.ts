import { beforeEach, describe, expect, it, vi } from "vitest";

import { listAssignableLineItemTemplates } from "@/server/workspace/crm/query-handler/list-assignable-line-item-templates.query-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  database: { marker: "db" },
  listRows: vi.fn(),
}));

vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: () => mocks.database,
}));
vi.mock(
  "@/server/workspace/crm/services/line-item-template-read-service",
  () => ({
    lineItemTemplateReadService: { listRows: mocks.listRows },
  }),
);

describe("listAssignableLineItemTemplates", () => {
  beforeEach(() => {
    mocks.listRows.mockReset();
  });

  it("returns every active template unpaginated", async () => {
    const rows = [{ id: "template-1" }, { id: "template-2" }];
    mocks.listRows.mockResolvedValueOnce(rows);

    await expect(listAssignableLineItemTemplates()).resolves.toEqual(rows);
    expect(mocks.listRows).toHaveBeenCalledWith(mocks.database, false);
  });
});
