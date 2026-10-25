import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SITE_NAME } from "@/lib/site-metadata";

const DICTIONARY_ROOT = join(process.cwd(), "src", "i18n", "dictionaries");

function listJsonFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listJsonFiles(path);
    return entry.name.endsWith(".json") ? [path] : [];
  });
}

function collectMetaTitles(value: unknown, insideMeta = false): string[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    if (insideMeta && key === "title" && typeof child === "string") {
      return [child];
    }
    return collectMetaTitles(child, insideMeta || key === "meta");
  });
}

describe("dictionary meta titles", () => {
  it("never name the brand, because the root layout template appends it once", () => {
    const offenders = listJsonFiles(DICTIONARY_ROOT).flatMap((file) =>
      collectMetaTitles(JSON.parse(readFileSync(file, "utf8")))
        .filter((title) => title.includes(SITE_NAME))
        .map((title) => `${file}: ${title}`),
    );

    expect(offenders).toEqual([]);
  });
});
