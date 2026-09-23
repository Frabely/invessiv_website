import { beforeEach, describe, expect, it, vi } from "vitest";

import { lineItemTemplateReadService } from "./line-item-template-read-service";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ toDto: vi.fn() }));

vi.mock("./line-item-templates-mapper-service", () => ({
  lineItemTemplatesMapperService: { toDto: mocks.toDto },
}));

type ChainCalls = Record<string, unknown[]>;

function chain(result: unknown, calls: ChainCalls = {}) {
  const node = {
    from: (...args: unknown[]) => {
      calls.from = args;
      return node;
    },
    where: (...args: unknown[]) => {
      calls.where = args;
      return node;
    },
    orderBy: (...args: unknown[]) => {
      calls.orderBy = args;
      return node;
    },
    limit: (...args: unknown[]) => {
      calls.limit = args;
      return node;
    },
    offset: (...args: unknown[]) => {
      calls.offset = args;
      return node;
    },
    then: (resolve: (value: unknown) => void) => resolve(result),
  };
  return node;
}

describe("lineItemTemplateReadService", () => {
  beforeEach(() => {
    mocks.toDto.mockReset();
  });

  describe("countRows", () => {
    it("resolves the counted total", async () => {
      const db = { select: vi.fn(() => chain([{ total: 3 }])) };

      await expect(
        lineItemTemplateReadService.countRows(db as never, false),
      ).resolves.toBe(3);
    });

    it("treats a missing row as zero", async () => {
      const db = { select: vi.fn(() => chain([])) };

      await expect(
        lineItemTemplateReadService.countRows(db as never, false),
      ).resolves.toBe(0);
    });
  });

  describe("listRows", () => {
    it("maps every row through the mapper service", async () => {
      const row = { id: "row-1" };
      const dto = { id: "row-1", version: 1 };
      const db = { select: vi.fn(() => chain([row])) };
      mocks.toDto.mockReturnValue(dto);

      await expect(
        lineItemTemplateReadService.listRows(db as never, false),
      ).resolves.toEqual([dto]);
      expect(mocks.toDto.mock.calls[0]?.[0]).toEqual(row);
    });

    it("omits limit and offset when no page is given", async () => {
      const calls: ChainCalls = {};
      const db = { select: vi.fn(() => chain([], calls)) };
      mocks.toDto.mockImplementation((row) => row);

      await lineItemTemplateReadService.listRows(db as never, false);

      expect(calls.limit).toBeUndefined();
      expect(calls.offset).toBeUndefined();
    });

    it("applies limit and offset when a page is given", async () => {
      const calls: ChainCalls = {};
      const db = { select: vi.fn(() => chain([], calls)) };
      mocks.toDto.mockImplementation((row) => row);

      await lineItemTemplateReadService.listRows(db as never, false, {
        limit: 10,
        offset: 20,
      });

      expect(calls.limit).toEqual([10]);
      expect(calls.offset).toEqual([20]);
    });
  });

  describe("findById", () => {
    it("maps the matching row through the mapper service", async () => {
      const row = { id: "row-1" };
      const dto = { id: "row-1", version: 1 };
      const db = { select: vi.fn(() => chain([row])) };
      mocks.toDto.mockReturnValue(dto);

      await expect(
        lineItemTemplateReadService.findById(db as never, "row-1"),
      ).resolves.toEqual(dto);
    });

    it("returns null when no row matches", async () => {
      const db = { select: vi.fn(() => chain([])) };

      await expect(
        lineItemTemplateReadService.findById(db as never, "missing"),
      ).resolves.toBeNull();
    });
  });
});
