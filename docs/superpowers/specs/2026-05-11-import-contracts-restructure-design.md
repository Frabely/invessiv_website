# Design: Restructure `src/common/contracts/leads/import/`

**Date:** 2026-05-11  
**Goal:** Improve discoverability by grouping the 17 flat files into two subdirectories, keeping shared DTOs and UI state at the top level.

---

## Current State

17 files live flat inside `import/`, mixing CSV-parser internals, validation types, shared DTOs, and client UI state. No grouping makes it hard to find the right type without scanning all filenames.

## Target Structure

```
src/common/contracts/leads/import/
│
├── csv/
│   ├── lead-csv-parse-error-details.ts
│   ├── lead-csv-parse-result.ts
│   ├── lead-csv-parser-options.ts
│   ├── lead-csv-row-state.ts
│   └── lead-import-raw-row.ts
│
├── validation/
│   ├── lead-import-validation-context.ts
│   ├── lead-import-validation-result.ts
│   ├── lead-import-valid-row.ts
│   ├── lead-import-social-profile.ts
│   └── lead-import-row-entry.ts
│
├── lead-import-row.dto.ts            (unchanged)
├── lead-import-row.dto.test-d.ts     (unchanged)
├── lead-import-social-profile.dto.ts (unchanged)
├── lead-import-report.dto.ts         (unchanged)
├── lead-import-result.dto.ts         (unchanged)
├── lead-import-row-issue.dto.ts      (unchanged)
└── lead-import-dialog-phase.ts       (unchanged)
```

### Grouping rationale

| Subdirectory  | Contains                                                                   | Criterion                                                                                            |
| ------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `csv/`        | Parser options, result, row state, error details, raw row                  | All about reading/parsing the CSV file                                                               |
| `validation/` | Validation context, result, valid-row, validated social profile, row entry | Server-side row validation pipeline                                                                  |
| _(flat)_      | `*.dto.ts`, dialog-phase                                                   | Shared client↔server contracts — stays visible at top level, consistent with parent `leads/` pattern |

## Files to Move

### → `csv/`

- `lead-csv-parse-error-details.ts`
- `lead-csv-parse-result.ts`
- `lead-csv-parser-options.ts`
- `lead-csv-row-state.ts`
- `lead-import-raw-row.ts`

### → `validation/`

- `lead-import-validation-context.ts`
- `lead-import-validation-result.ts`
- `lead-import-valid-row.ts`
- `lead-import-social-profile.ts`
- `lead-import-row-entry.ts`

## Import Path Updates Required

### `src/common/contracts/leads/index.ts`

These exports reference moved files and must be updated:

- `./import/lead-import-raw-row` → `./import/csv/lead-import-raw-row`
- `./import/lead-import-social-profile` → `./import/validation/lead-import-social-profile`
- `./import/lead-import-row-entry` → `./import/validation/lead-import-row-entry`
- `./import/lead-import-validation-context` → `./import/validation/lead-import-validation-context`
- `./import/lead-import-validation-result` → `./import/validation/lead-import-validation-result`
- `./import/lead-import-valid-row` → `./import/validation/lead-import-valid-row`

### Other files importing moved paths

All files across the codebase that import directly from `@/common/contracts/leads/import/<moved-file>` must have their paths updated. A grep for each moved filename will identify all callers.

## Constraints

- File contents change only where import paths must be updated. All exports, types, and logic are untouched.
- `lead-import-result.dto.ts` imports from `./lead-import-report.dto` (relative same-level) — stays flat, no change needed.
- `lead-import-dialog-phase.ts` imports from `./lead-import-report.dto` — stays flat, no change needed.

### Cross-references within moved files

Two files being moved to `validation/` import each other with absolute `@/` paths:

| File (after move)                             | Current import                                               | Updated import                                                          |
| --------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `validation/lead-import-validation-result.ts` | `@/common/contracts/leads/import/lead-import-valid-row`      | `@/common/contracts/leads/import/validation/lead-import-valid-row`      |
| `validation/lead-import-valid-row.ts`         | `@/common/contracts/leads/import/lead-import-social-profile` | `@/common/contracts/leads/import/validation/lead-import-social-profile` |

## Success Criteria

- `npm run typecheck` passes with zero errors after the move.
- `npm run build` passes.
- No file contents changed, only locations and import paths.
