import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { LeadImportErrorCode } from "@/common/constants/leads/lead-import-error-codes";
import { LeadCsvParseError, parseLeadCsv } from "./lead-csv-parser";

vi.mock("server-only", () => ({}));

function readFixture(): string {
  return readFileSync(
    resolve("plans/workspace/leads/lead-import-example.csv"),
    "utf8",
  );
}

describe("parseLeadCsv", () => {
  it("parses semicolon-separated input, strips BOM, and keeps quoted separators plus CRLF values", () => {
    const result = parseLeadCsv(
      '\ufeffemail;notes\r\nanna@example.com;"Hello; world"\r\nmax@example.com;"Line 1\r\nLine 2"\r\n',
      { maxDataRows: 500 },
    );

    expect(result.headers).toEqual(["email", "notes"]);
    expect(result.rows).toEqual([
      ["anna@example.com", "Hello; world"],
      ["max@example.com", "Line 1\r\nLine 2"],
    ]);
  });

  it("prefers semicolons when both separators appear on the header line", () => {
    const result = parseLeadCsv(
      'email;notes,extra\nfoo@example.com;"hello, world"\n',
      { maxDataRows: 500 },
    );

    expect(result.headers).toEqual(["email", "notes,extra"]);
    expect(result.rows).toEqual([["foo@example.com", "hello, world"]]);
  });

  it("parses comma-separated input", () => {
    const result = parseLeadCsv("email,last_name\nanna@example.com,Schmidt\n", {
      maxDataRows: 500,
    });

    expect(result.headers).toEqual(["email", "last_name"]);
    expect(result.rows).toEqual([["anna@example.com", "Schmidt"]]);
  });

  it("ignores empty and whitespace-only lines while keeping the data row count stable", () => {
    const result = parseLeadCsv(
      "\n   \nemail;last_name\n\nanna@example.com;Schmidt\n  \n",
      { maxDataRows: 500 },
    );

    expect(result.headers).toEqual(["email", "last_name"]);
    expect(result.rows).toEqual([["anna@example.com", "Schmidt"]]);
  });

  it("pads shorter rows to the header width", () => {
    const result = parseLeadCsv(
      "email;last_name;company_name\nanna@example.com;Schmidt\n",
      { maxDataRows: 500 },
    );

    expect(result.rows).toEqual([["anna@example.com", "Schmidt", ""]]);
  });

  it("accepts mixed CRLF and LF line endings", () => {
    const result = parseLeadCsv(
      "email;last_name\r\nanna@example.com;Schmidt\nmax@example.com;Mustermann\r\n",
      { maxDataRows: 500 },
    );

    expect(result.rows).toEqual([
      ["anna@example.com", "Schmidt"],
      ["max@example.com", "Mustermann"],
    ]);
  });

  it("throws InvalidCsv for malformed quoting", () => {
    expect(() =>
      parseLeadCsv('email;notes\nanna@example.com;"unterminated\n', {
        maxDataRows: 500,
      }),
    ).toThrowError(LeadCsvParseError);

    try {
      parseLeadCsv('email;notes\nanna@example.com;"unterminated\n', {
        maxDataRows: 500,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(LeadCsvParseError);
      expect((error as LeadCsvParseError).code).toBe(
        LeadImportErrorCode.InvalidCsv,
      );
    }
  });

  it("throws InvalidCsv when a quoted field starts after leading whitespace", () => {
    expect(() =>
      parseLeadCsv('email;notes\nanna@example.com; "hello"\n', {
        maxDataRows: 500,
      }),
    ).toThrowError(LeadCsvParseError);

    try {
      parseLeadCsv('email;notes\nanna@example.com; "hello"\n', {
        maxDataRows: 500,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(LeadCsvParseError);
      expect((error as LeadCsvParseError).code).toBe(
        LeadImportErrorCode.InvalidCsv,
      );
    }
  });

  it("throws TooManyRows when the data row limit is exceeded", () => {
    const rows = Array.from({ length: 501 }, (_, index) => {
      const value = String(index).padStart(3, "0");
      return `${value}@example.com;${value}`;
    });

    expect(() =>
      parseLeadCsv(`email;last_name\n${rows.join("\n")}\n`, {
        maxDataRows: 500,
      }),
    ).toThrowError(LeadCsvParseError);

    try {
      parseLeadCsv(`email;last_name\n${rows.join("\n")}\n`, {
        maxDataRows: 500,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(LeadCsvParseError);
      expect((error as LeadCsvParseError).code).toBe(
        LeadImportErrorCode.TooManyRows,
      );
    }
  });

  it("parses the example fixture without error", () => {
    const result = parseLeadCsv(readFixture(), { maxDataRows: 500 });

    expect(result.headers).toEqual([
      "external_guid",
      "email",
      "first_name",
      "last_name",
      "company_name",
      "phone",
      "website_url",
      "category_id",
      "category",
      "score",
      "linkedin_url",
      "instagram_url",
      "youtube_url",
      "status",
      "owner",
      "notes",
      "improvements",
    ]);
    expect(result.rows).toHaveLength(3);
  });
});
