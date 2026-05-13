import { describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { SQL } from "drizzle-orm";
import { buildLeadFilter } from "@/server/workspace/leads/query-handler/lead-filter.query-handler";
import { LEAD_LIST_PAGE_SIZE } from "@/common/constants/leads/list/lead-list-defaults";
import * as schema from "@/server/db/record-configuration";
import { leads } from "@/server/db/record-configuration";

// Fake drizzle instance used only to compile SQL via .toSQL() — no network calls.
const db = drizzle({
  connection: "postgresql://test:test@test.neon.tech/testdb",
  schema,
});

function toSQLFull(where: SQL | undefined): { sql: string; params: unknown[] } {
  if (!where) return { sql: "", params: [] };
  return db.select({ id: leads.id }).from(leads).where(where).toSQL();
}

function toOrderSQL(orderBy: SQL): string {
  return db.select({ id: leads.id }).from(leads).orderBy(orderBy).toSQL().sql;
}

describe("buildLeadFilter", () => {
  describe("archived exclusion (default behaviour)", () => {
    it("excludes archived leads when no status filter is given", () => {
      const { sql, params } = toSQLFull(buildLeadFilter({}).where);
      expect(params).toContain("archived");
      expect(sql).toContain("<>");
    });

    it("excludes archived leads when status=all", () => {
      const { sql, params } = toSQLFull(
        buildLeadFilter({ status: "all" }).where,
      );
      expect(params).toContain("archived");
      expect(sql).toContain("<>");
    });

    it("shows only archived leads when status=archived", () => {
      const { sql, params } = toSQLFull(
        buildLeadFilter({ status: "archived" }).where,
      );
      expect(params).toContain("archived");
      expect(sql).not.toContain("<>");
    });

    it("shows only new leads when status=new (does not reference archived)", () => {
      const { params } = toSQLFull(buildLeadFilter({ status: "new" }).where);
      expect(params).toContain("new");
      expect(params).not.toContain("archived");
    });

    it("shows only qualified leads when status=qualified", () => {
      const { params } = toSQLFull(
        buildLeadFilter({ status: "qualified" }).where,
      );
      expect(params).toContain("qualified");
      expect(params).not.toContain("archived");
    });
  });

  describe("source filter", () => {
    it("adds source condition when source=webform", () => {
      const { params } = toSQLFull(
        buildLeadFilter({ source: "webform" }).where,
      );
      expect(params).toContain("webform");
    });

    it("adds source condition when source=manual", () => {
      const { params } = toSQLFull(buildLeadFilter({ source: "manual" }).where);
      expect(params).toContain("manual");
    });

    it("does not add source condition when source is absent", () => {
      const { params } = toSQLFull(buildLeadFilter({}).where);
      expect(params).not.toContain("webform");
      expect(params).not.toContain("manual");
      expect(params).not.toContain("import");
    });
  });

  describe("category filter", () => {
    it("adds category_id condition when category UUID is provided", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const { sql, params } = toSQLFull(
        buildLeadFilter({ category: uuid }).where,
      );
      expect(sql).toContain("category_id");
      expect(params).toContain(uuid);
    });
  });

  describe("score_min filter", () => {
    it("adds score >= condition when score_min is provided", () => {
      const { sql, params } = toSQLFull(
        buildLeadFilter({ score_min: 70 }).where,
      );
      expect(sql).toContain("score");
      expect(sql).toContain(">=");
      expect(params).toContain(70);
    });

    it("adds score >= 0 condition when score_min=0", () => {
      const { params } = toSQLFull(buildLeadFilter({ score_min: 0 }).where);
      expect(params).toContain(0);
    });

    it("does not add score condition when score_min is absent", () => {
      const { sql } = toSQLFull(buildLeadFilter({}).where);
      expect(sql).not.toContain(">=");
    });
  });

  describe("date range filter", () => {
    it("adds created_at >= condition when date_from is provided", () => {
      const { sql } = toSQLFull(
        buildLeadFilter({ date_from: "2024-01-01" }).where,
      );
      expect(sql).toContain("created_at");
      expect(sql).toContain(">=");
    });

    it("adds created_at <= condition when date_to is provided", () => {
      const { sql } = toSQLFull(
        buildLeadFilter({ date_to: "2024-12-31" }).where,
      );
      expect(sql).toContain("created_at");
      expect(sql).toContain("<=");
    });

    it("adds both date bounds when date_from and date_to are provided", () => {
      const { sql } = toSQLFull(
        buildLeadFilter({ date_from: "2024-01-01", date_to: "2024-12-31" })
          .where,
      );
      expect(sql).toContain(">=");
      expect(sql).toContain("<=");
    });
  });

  describe("free-text search (search)", () => {
    it("searches display_name, email, company_name, owner with ilike", () => {
      const { sql, params } = toSQLFull(
        buildLeadFilter({ search: "acme" }).where,
      );
      expect(sql.toLowerCase()).toContain("ilike");
      expect(sql).toContain("display_name");
      expect(sql).toContain("email");
      expect(sql).toContain("company_name");
      expect(sql).toContain("owner");
      expect(params.some((p) => String(p).includes("acme"))).toBe(true);
    });

    it("wraps the search term in % for pattern matching", () => {
      const { params } = toSQLFull(buildLeadFilter({ search: "test" }).where);
      expect(params.some((p) => String(p) === "%test%")).toBe(true);
    });

    it("does not add search condition when search is absent", () => {
      const { sql } = toSQLFull(buildLeadFilter({}).where);
      expect(sql.toLowerCase()).not.toContain("ilike");
    });
  });

  describe("pagination", () => {
    it("defaults to page 1 with full page size and offset 0", () => {
      const result = buildLeadFilter({});
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(LEAD_LIST_PAGE_SIZE);
      expect(result.limit).toBe(LEAD_LIST_PAGE_SIZE);
      expect(result.offset).toBe(0);
    });

    it("calculates correct offset for page 2", () => {
      const result = buildLeadFilter({ page: 2 });
      expect(result.page).toBe(2);
      expect(result.offset).toBe(LEAD_LIST_PAGE_SIZE);
    });

    it("calculates correct offset for page 3", () => {
      const result = buildLeadFilter({ page: 3 });
      expect(result.offset).toBe(2 * LEAD_LIST_PAGE_SIZE);
    });

    it("keeps perPage constant regardless of page number", () => {
      const result = buildLeadFilter({ page: 5 });
      expect(result.perPage).toBe(LEAD_LIST_PAGE_SIZE);
      expect(result.limit).toBe(LEAD_LIST_PAGE_SIZE);
    });
  });

  describe("sort order", () => {
    it("sorts by score DESC when sort=score_desc", () => {
      const sql = toOrderSQL(buildLeadFilter({ sort: "score_desc" }).orderBy);
      expect(sql).toContain("score");
      expect(sql.toLowerCase()).toContain("desc");
    });

    it("sorts by score ASC when sort=score_asc", () => {
      const sql = toOrderSQL(buildLeadFilter({ sort: "score_asc" }).orderBy);
      expect(sql).toContain("score");
      expect(sql.toLowerCase()).toContain("asc");
    });

    it("sorts by display_name ASC when sort=name_asc", () => {
      const sql = toOrderSQL(buildLeadFilter({ sort: "name_asc" }).orderBy);
      expect(sql).toContain("display_name");
      expect(sql.toLowerCase()).toContain("asc");
    });

    it("sorts by display_name DESC when sort=name_desc", () => {
      const sql = toOrderSQL(buildLeadFilter({ sort: "name_desc" }).orderBy);
      expect(sql).toContain("display_name");
      expect(sql.toLowerCase()).toContain("desc");
    });

    it("sorts by created_at DESC when sort=created_desc", () => {
      const sql = toOrderSQL(buildLeadFilter({ sort: "created_desc" }).orderBy);
      expect(sql).toContain("created_at");
      expect(sql.toLowerCase()).toContain("desc");
    });

    it("sorts by created_at ASC when sort=created_asc", () => {
      const sql = toOrderSQL(buildLeadFilter({ sort: "created_asc" }).orderBy);
      expect(sql).toContain("created_at");
      expect(sql.toLowerCase()).toContain("asc");
    });

    it("sorts by updated_at ASC when sort=updated_asc", () => {
      const sql = toOrderSQL(buildLeadFilter({ sort: "updated_asc" }).orderBy);
      expect(sql).toContain("updated_at");
      expect(sql.toLowerCase()).toContain("asc");
    });

    it("sorts by updated_at DESC when sort=updated_desc", () => {
      const sql = toOrderSQL(buildLeadFilter({ sort: "updated_desc" }).orderBy);
      expect(sql).toContain("updated_at");
      expect(sql.toLowerCase()).toContain("desc");
    });

    it("sorts by created_at DESC when sort is absent", () => {
      const sql = toOrderSQL(buildLeadFilter({}).orderBy);
      expect(sql).toContain("created_at");
      expect(sql.toLowerCase()).toContain("desc");
    });
  });

  describe("combined filters", () => {
    it("combines status and source conditions", () => {
      const { sql, params } = toSQLFull(
        buildLeadFilter({ status: "new", source: "webform" }).where,
      );
      expect(params).toContain("new");
      expect(params).toContain("webform");
      expect(sql.toLowerCase()).toContain("and");
    });

    it("combines archived exclusion with source and search when no status given", () => {
      const { sql, params } = toSQLFull(
        buildLeadFilter({ search: "acme", source: "manual" }).where,
      );
      expect(sql).toContain("<>");
      expect(params).toContain("archived");
      expect(params).toContain("manual");
      expect(params.some((p) => String(p).includes("acme"))).toBe(true);
    });

    it("combines score_min with date range", () => {
      const { sql, params } = toSQLFull(
        buildLeadFilter({ score_min: 50, date_from: "2024-01-01" }).where,
      );
      expect(params).toContain(50);
      expect(sql).toContain("created_at");
    });
  });
});
