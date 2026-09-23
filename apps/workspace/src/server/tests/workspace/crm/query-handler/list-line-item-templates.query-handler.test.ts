import { beforeEach, describe, expect, it, vi } from "vitest";

import { listLineItemTemplates } from "@/server/workspace/crm/query-handler/list-line-item-templates.query-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  database: { marker: "db" },
  countRows: vi.fn(),
  listRows: vi.fn(),
}));

vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: () => mocks.database,
}));
vi.mock(
  "@/server/workspace/crm/services/line-item-template-read-service",
  () => ({
    lineItemTemplateReadService: {
      countRows: mocks.countRows,
      listRows: mocks.listRows,
    },
  }),
);

describe("listLineItemTemplates", () => {
  beforeEach(() => {
    mocks.countRows.mockReset();
    mocks.listRows.mockReset();
  });

  it("returns the first page of active templates without an archived existence lookup", async () => {
    mocks.countRows.mockResolvedValueOnce(1);
    mocks.listRows.mockResolvedValueOnce([{ id: "template-active" }]);

    await expect(
      listLineItemTemplates({ includeArchived: false, page: 1 }),
    ).resolves.toEqual({
      hasLineItemTemplates: true,
      page: 1,
      perPage: 25,
      rows: [{ id: "template-active" }],
      total: 1,
    });
    expect(mocks.countRows).toHaveBeenCalledTimes(1);
    expect(mocks.countRows).toHaveBeenCalledWith(mocks.database, false);
    expect(mocks.listRows).toHaveBeenCalledWith(mocks.database, false, {
      limit: 25,
      offset: 0,
    });
  });

  it("distinguishes an archived-only catalog from an empty catalog", async () => {
    mocks.countRows.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    mocks.listRows.mockResolvedValueOnce([]);

    await expect(
      listLineItemTemplates({ includeArchived: false, page: 1 }),
    ).resolves.toEqual({
      hasLineItemTemplates: true,
      page: 1,
      perPage: 25,
      rows: [],
      total: 0,
    });
    expect(mocks.countRows).toHaveBeenCalledTimes(2);
    expect(mocks.countRows).toHaveBeenNthCalledWith(2, mocks.database, true);
  });

  it("reports an entirely empty catalog as empty", async () => {
    mocks.countRows.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    mocks.listRows.mockResolvedValueOnce([]);

    await expect(
      listLineItemTemplates({ includeArchived: false, page: 1 }),
    ).resolves.toEqual({
      hasLineItemTemplates: false,
      page: 1,
      perPage: 25,
      rows: [],
      total: 0,
    });
  });

  it("skips the archived existence lookup when archived rows are already included", async () => {
    mocks.countRows.mockResolvedValueOnce(1);
    mocks.listRows.mockResolvedValueOnce([{ id: "template-archived" }]);

    await expect(
      listLineItemTemplates({ includeArchived: true, page: 1 }),
    ).resolves.toEqual({
      hasLineItemTemplates: true,
      page: 1,
      perPage: 25,
      rows: [{ id: "template-archived" }],
      total: 1,
    });
    expect(mocks.countRows).toHaveBeenCalledTimes(1);
  });

  it("clamps an out-of-range page to the last page", async () => {
    mocks.countRows.mockResolvedValueOnce(30);
    mocks.listRows.mockResolvedValueOnce([{ id: "template-30" }]);

    await expect(
      listLineItemTemplates({ includeArchived: false, page: 9 }),
    ).resolves.toEqual({
      hasLineItemTemplates: true,
      page: 2,
      perPage: 25,
      rows: [{ id: "template-30" }],
      total: 30,
    });
    expect(mocks.listRows).toHaveBeenCalledWith(mocks.database, false, {
      limit: 25,
      offset: 25,
    });
  });
});
