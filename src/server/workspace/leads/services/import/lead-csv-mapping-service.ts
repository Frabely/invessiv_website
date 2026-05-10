import "server-only";

import type { LeadImportColumnKey } from "@/common/constants/leads/lead-import-column-keys";
import { LEAD_IMPORT_COLUMN_KEY_VALUES } from "@/common/constants/leads/lead-import-column-keys";
import type { RawLeadImportRow } from "@/server/workspace/leads/services/import/lead-import-row";

const LEAD_IMPORT_COLUMN_KEY_SET = new Set<string>(
  LEAD_IMPORT_COLUMN_KEY_VALUES,
);

function trimCell(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeRequiredCell(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function mapHeadersToColumns(headers: string[]): {
  columns: (LeadImportColumnKey | null)[];
  ignored: string[];
} {
  const columns: (LeadImportColumnKey | null)[] = [];
  const ignored: string[] = [];
  const seenColumns = new Set<LeadImportColumnKey>();

  for (const header of headers) {
    if (!LEAD_IMPORT_COLUMN_KEY_SET.has(header)) {
      columns.push(null);
      ignored.push(header);
      continue;
    }

    const column = header as LeadImportColumnKey;
    if (seenColumns.has(column)) {
      columns.push(null);
      ignored.push(header);
      continue;
    }

    seenColumns.add(column);
    columns.push(column);
  }

  return { columns, ignored };
}

export function mapRowToRaw(
  columns: (LeadImportColumnKey | null)[],
  row: string[],
): RawLeadImportRow {
  const raw: Partial<Record<LeadImportColumnKey, string | undefined>> = {};

  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index];
    if (column === null) {
      continue;
    }

    const cell = row[index];
    if (column === "email") {
      raw[column] = normalizeRequiredCell(cell);
      continue;
    }

    raw[column] = trimCell(cell);
  }

  return {
    email: raw.email ?? "",
    first_name: raw.first_name,
    last_name: raw.last_name,
    company_name: raw.company_name,
    phone: raw.phone,
    owner: raw.owner,
    notes: raw.notes,
    external_guid: raw.external_guid,
    website_url: raw.website_url,
    linkedin_url: raw.linkedin_url,
    instagram_url: raw.instagram_url,
    youtube_url: raw.youtube_url,
    category: raw.category,
    category_id: raw.category_id,
    score: raw.score,
    status: raw.status,
    improvements: raw.improvements,
  };
}
