import "server-only";

import { LeadImportErrorCode } from "@/common/constants/leads/import/errors/lead-import-error-codes";
import type { LeadCsvSeparator } from "@/common/constants/leads/import/csv/lead-csv-separator";
import type { LeadCsvParseErrorDetails } from "@/common/contracts/leads/import/lead-csv-parse-error-details";
import type { LeadCsvParseResult } from "@/common/contracts/leads/import/lead-csv-parse-result";
import type { LeadCsvParserOptions } from "@/common/contracts/leads/import/lead-csv-parser-options";
import type { LeadCsvRowState } from "@/common/contracts/leads/import/lead-csv-row-state";

const BOM = "\ufeff";
const QUOTE = '"';
const CARRIAGE_RETURN = "\r";
const LINE_FEED = "\n";

export class LeadCsvParseError extends Error {
  public readonly code: LeadImportErrorCode;
  public readonly details?: LeadCsvParseErrorDetails;

  constructor(
    code: LeadImportErrorCode,
    message = code,
    details?: LeadCsvParseErrorDetails,
  ) {
    super(message);
    this.name = "LeadCsvParseError";
    this.code = code;
    this.details = details;
  }
}

function isWhitespaceCharacter(character: string): boolean {
  return (
    character === " " ||
    character === "\t" ||
    character === "\v" ||
    character === "\f"
  );
}

function stripBom(input: string): string {
  return input.startsWith(BOM) ? input.slice(1) : input;
}

function createParseError(
  code: LeadImportErrorCode,
  input: string,
): LeadCsvParseError {
  return new LeadCsvParseError(code, code, {
    inputPreview: input.slice(0, 120),
  });
}

function getFirstNonEmptyLine(input: string): string | null {
  const lines = input.split(/\r\n|\n|\r/);
  for (const line of lines) {
    if (line.trim().length > 0) {
      return line;
    }
  }
  return null;
}

function countSeparatorsOutsideQuotes(
  line: string,
  separator: LeadCsvSeparator,
): number {
  let count = 0;
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === QUOTE) {
      if (inQuotes && line[index + 1] === QUOTE) {
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && character === separator) {
      count += 1;
    }
  }

  return count;
}

function detectSeparator(input: string): LeadCsvSeparator {
  const firstNonEmptyLine = getFirstNonEmptyLine(input);
  if (!firstNonEmptyLine) {
    throw createParseError(LeadImportErrorCode.InvalidCsv, input);
  }

  const semicolonCount = countSeparatorsOutsideQuotes(firstNonEmptyLine, ";");
  const commaCount = countSeparatorsOutsideQuotes(firstNonEmptyLine, ",");

  if (semicolonCount > 0) {
    return ";";
  }

  if (commaCount > 0) {
    return ",";
  }

  return ";";
}

function createRowState(): LeadCsvRowState {
  return {
    currentRow: [],
    currentField: "",
    inQuotes: false,
    afterQuote: false,
    rowHasStructuralContent: false,
  };
}

function flushRow(state: LeadCsvRowState, rows: string[][]): void {
  const isBlankRow =
    !state.rowHasStructuralContent &&
    state.currentRow.length === 0 &&
    state.currentField.trim().length === 0;

  if (!isBlankRow) {
    state.currentRow.push(state.currentField);
    rows.push(state.currentRow);
  }

  state.currentRow = [];
  state.currentField = "";
  state.inQuotes = false;
  state.afterQuote = false;
  state.rowHasStructuralContent = false;
}

function startQuotedField(state: LeadCsvRowState): void {
  // Entering a quoted cell means separators and line breaks stop being
  // structural characters until the closing quote appears.
  state.currentField = "";
  state.inQuotes = true;
  state.afterQuote = false;
  state.rowHasStructuralContent = true;
}

function finalizeCurrentField(state: LeadCsvRowState): void {
  // Commit the current cell to the row buffer.
  state.currentRow.push(state.currentField);
  state.currentField = "";
  state.afterQuote = false;
}

function normalizeRow(row: string[], width: number): string[] {
  if (row.length === width) {
    return row;
  }

  if (row.length > width) {
    return row.slice(0, width);
  }

  return [...row, ...Array.from({ length: width - row.length }, () => "")];
}

function hasMeaningfulOverflow(row: string[], width: number): boolean {
  return row.slice(width).some((cell) => cell.trim().length > 0);
}

function parseRows(input: string, separator: LeadCsvSeparator): string[][] {
  const rows: string[][] = [];
  const state = createRowState();

  let index = 0;
  while (index < input.length) {
    const character = input[index];

    if (state.inQuotes) {
      if (character === QUOTE) {
        const nextCharacter = input[index + 1];
        if (nextCharacter === QUOTE) {
          // Doubled quotes inside a quoted cell become a literal quote.
          state.currentField += QUOTE;
          index += 2;
          continue;
        }

        // A single quote closes the quoted cell. The next non-whitespace
        // character must be a separator or a line ending.
        state.inQuotes = false;
        state.afterQuote = true;
        index += 1;
        continue;
      }

      state.currentField += character;
      index += 1;
      continue;
    }

    if (state.afterQuote) {
      if (character === separator) {
        // The quoted cell has ended cleanly and the row continues with the
        // next column.
        finalizeCurrentField(state);
        state.rowHasStructuralContent = true;
        index += 1;
        continue;
      }

      if (character === CARRIAGE_RETURN || character === LINE_FEED) {
        // Support both CRLF and LF. When we see CR, we consume the following
        // LF as part of the same line ending so Windows files do not create
        // empty rows.
        finalizeCurrentField(state);
        if (character === CARRIAGE_RETURN && input[index + 1] === LINE_FEED) {
          index += 2;
        } else {
          index += 1;
        }
        flushRow(state, rows);
        continue;
      }

      if (isWhitespaceCharacter(character)) {
        index += 1;
        continue;
      }

      throw createParseError(LeadImportErrorCode.InvalidCsv, input);
    }

    if (character === QUOTE) {
      if (state.currentField.length === 0) {
        startQuotedField(state);
        index += 1;
        continue;
      }

      // A quote after any preceding content would make the cell ambiguous.
      // Keep the parser strict so malformed exports fail fast.
      throw createParseError(LeadImportErrorCode.InvalidCsv, input);
    }

    if (character === separator) {
      // An unquoted separator ends the current cell.
      finalizeCurrentField(state);
      state.rowHasStructuralContent = true;
      index += 1;
      continue;
    }

    if (character === CARRIAGE_RETURN || character === LINE_FEED) {
      // Raw CR, LF, or CRLF terminate the current row when we are not inside a
      // quoted cell.
      if (character === CARRIAGE_RETURN && input[index + 1] === LINE_FEED) {
        index += 2;
      } else {
        index += 1;
      }

      flushRow(state, rows);
      continue;
    }

    state.currentField += character;
    if (!isWhitespaceCharacter(character)) {
      state.rowHasStructuralContent = true;
    }
    index += 1;
  }

  if (state.inQuotes) {
    throw createParseError(LeadImportErrorCode.InvalidCsv, input);
  }

  if (state.afterQuote) {
    // The file may end right after a closing quote without a trailing line
    // ending or separator. In that case the last field still needs to be
    // committed.
    finalizeCurrentField(state);
  }

  flushRow(state, rows);

  return rows;
}

function parseLeadCsv(
  input: string,
  options: LeadCsvParserOptions,
): LeadCsvParseResult {
  const normalizedInput = stripBom(input);
  const separator = detectSeparator(normalizedInput);
  const parsedRows = parseRows(normalizedInput, separator);

  if (parsedRows.length === 0) {
    throw createParseError(LeadImportErrorCode.InvalidCsv, normalizedInput);
  }

  const [headers, ...dataRows] = parsedRows;

  if (dataRows.length > options.maxDataRows) {
    throw createParseError(LeadImportErrorCode.TooManyRows, normalizedInput);
  }

  const hasOverlongRow = dataRows.some((row) =>
    hasMeaningfulOverflow(row, headers.length),
  );
  if (hasOverlongRow) {
    throw createParseError(LeadImportErrorCode.InvalidCsv, normalizedInput);
  }

  return {
    headers,
    rows: dataRows.map((row) => normalizeRow(row, headers.length)),
  };
}

export const leadCsvParserService = {
  parseLeadCsv,
};
