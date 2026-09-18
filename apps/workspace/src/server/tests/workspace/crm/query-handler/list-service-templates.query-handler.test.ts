import { beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceTemplateStatus } from "@invessiv/common/constants/crm/service-template-statuses";
import { listServiceTemplates } from "@/server/workspace/crm/query-handler/list-service-templates.query-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  database: { select: vi.fn() },
  toDto: vi.fn(),
}));

vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: () => mocks.database,
}));
vi.mock(
  "@/server/workspace/crm/services/service-templates-mapper-service",
  () => ({
    serviceTemplatesMapperService: { toDto: mocks.toDto },
  }),
);

function mockList(rows: unknown[], allRows?: unknown[]) {
  mocks.database.select
    .mockReturnValueOnce({
      from: () => ({
        where: () => ({ orderBy: () => Promise.resolve(rows) }),
      }),
    })
    .mockReturnValueOnce({
      from: () => ({ limit: () => Promise.resolve(allRows ?? []) }),
    });
}

describe("listServiceTemplates", () => {
  beforeEach(() => {
    mocks.database.select.mockReset();
    mocks.toDto.mockReset();
  });

  it("returns active templates without an existence lookup", async () => {
    const row = { id: "template-active" };
    const dto = { id: "template-active", version: 1 };
    mockList([row]);
    mocks.toDto.mockReturnValue(dto);

    await expect(
      listServiceTemplates({ includeArchived: false }),
    ).resolves.toEqual({ hasServiceTemplates: true, rows: [dto] });
    expect(mocks.database.select).toHaveBeenCalledTimes(1);
    expect(mocks.toDto.mock.calls[0]?.[0]).toEqual(row);
  });

  it("distinguishes an archived-only catalog from an empty catalog", async () => {
    mockList([], [{ id: "template-archived" }]);

    await expect(
      listServiceTemplates({ includeArchived: false }),
    ).resolves.toEqual({ hasServiceTemplates: true, rows: [] });
    expect(mocks.database.select).toHaveBeenCalledTimes(2);
  });

  it("reports an entirely empty catalog as empty", async () => {
    mockList([], []);

    await expect(
      listServiceTemplates({ includeArchived: false }),
    ).resolves.toEqual({ hasServiceTemplates: false, rows: [] });
  });

  it("uses the returned rows as the existence signal when archived templates are included", async () => {
    const row = {
      id: "template-archived",
      status: ServiceTemplateStatus.Archived,
    };
    const dto = { id: "template-archived", version: 2 };
    mockList([row]);
    mocks.toDto.mockReturnValue(dto);

    await expect(
      listServiceTemplates({ includeArchived: true }),
    ).resolves.toEqual({ hasServiceTemplates: true, rows: [dto] });
    expect(mocks.database.select).toHaveBeenCalledTimes(1);
  });
});
