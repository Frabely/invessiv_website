# Import Contracts Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move 10 files in `src/common/contracts/leads/import/` into two subdirectories (`csv/` and `validation/`) to improve discoverability, then update all import paths throughout the codebase.

**Architecture:** Pure structural refactor — no logic changes. Files move into `csv/` (CSV parser internals) and `validation/` (row validation pipeline). Shared DTOs and client UI state stay flat. Eight files outside the `import/` directory have direct path imports to moved files and must be updated.

**Tech Stack:** TypeScript, Next.js (App Router), `@/` path alias pointing to `src/`

---

## Files Changed

| Action | Path                                                                                      |
| ------ | ----------------------------------------------------------------------------------------- |
| Move   | `import/lead-csv-parse-error-details.ts` → `import/csv/`                                  |
| Move   | `import/lead-csv-parse-result.ts` → `import/csv/`                                         |
| Move   | `import/lead-csv-parser-options.ts` → `import/csv/`                                       |
| Move   | `import/lead-csv-row-state.ts` → `import/csv/`                                            |
| Move   | `import/lead-import-raw-row.ts` → `import/csv/`                                           |
| Move   | `import/lead-import-validation-context.ts` → `import/validation/`                         |
| Move   | `import/lead-import-validation-result.ts` → `import/validation/`                          |
| Move   | `import/lead-import-valid-row.ts` → `import/validation/`                                  |
| Move   | `import/lead-import-social-profile.ts` → `import/validation/`                             |
| Move   | `import/lead-import-row-entry.ts` → `import/validation/`                                  |
| Modify | `src/common/contracts/leads/index.ts`                                                     |
| Modify | `src/common/contracts/leads/import/validation/lead-import-validation-result.ts`           |
| Modify | `src/common/contracts/leads/import/validation/lead-import-valid-row.ts`                   |
| Modify | `src/server/workspace/leads/services/import/lead-csv-parser-service.ts`                   |
| Modify | `src/server/workspace/leads/services/import/lead-csv-mapping-service.ts`                  |
| Modify | `src/server/workspace/leads/services/import/lead-import-social-profile-mapper-service.ts` |
| Modify | `src/server/workspace/leads/services/import/lead-import-validation-service.ts`            |
| Modify | `src/server/workspace/leads/command-handler/import-leads.command-handler.ts`              |
| Modify | `src/server/tests/workspace/leads/services/import/lead-import-validation-service.test.ts` |

---

## Task 1: Move CSV files into `csv/` subdirectory

**Files:**

- Move: `src/common/contracts/leads/import/lead-csv-parse-error-details.ts` → `src/common/contracts/leads/import/csv/`
- Move: `src/common/contracts/leads/import/lead-csv-parse-result.ts` → `src/common/contracts/leads/import/csv/`
- Move: `src/common/contracts/leads/import/lead-csv-parser-options.ts` → `src/common/contracts/leads/import/csv/`
- Move: `src/common/contracts/leads/import/lead-csv-row-state.ts` → `src/common/contracts/leads/import/csv/`
- Move: `src/common/contracts/leads/import/lead-import-raw-row.ts` → `src/common/contracts/leads/import/csv/`

- [ ] **Step 1: Move the five CSV files using git mv**

Run from the repo root:

```bash
git mv src/common/contracts/leads/import/lead-csv-parse-error-details.ts src/common/contracts/leads/import/csv/lead-csv-parse-error-details.ts
git mv src/common/contracts/leads/import/lead-csv-parse-result.ts src/common/contracts/leads/import/csv/lead-csv-parse-result.ts
git mv src/common/contracts/leads/import/lead-csv-parser-options.ts src/common/contracts/leads/import/csv/lead-csv-parser-options.ts
git mv src/common/contracts/leads/import/lead-csv-row-state.ts src/common/contracts/leads/import/csv/lead-csv-row-state.ts
git mv src/common/contracts/leads/import/lead-import-raw-row.ts src/common/contracts/leads/import/csv/lead-import-raw-row.ts
```

Expected: no output, exit 0. A new `csv/` subdirectory now exists inside `import/`.

- [ ] **Step 2: Verify the move**

```bash
ls src/common/contracts/leads/import/csv/
```

Expected output (5 files):

```
lead-csv-parse-error-details.ts
lead-csv-parse-result.ts
lead-csv-parser-options.ts
lead-csv-row-state.ts
lead-import-raw-row.ts
```

---

## Task 2: Move validation files into `validation/` subdirectory

**Files:**

- Move: `src/common/contracts/leads/import/lead-import-validation-context.ts` → `src/common/contracts/leads/import/validation/`
- Move: `src/common/contracts/leads/import/lead-import-validation-result.ts` → `src/common/contracts/leads/import/validation/`
- Move: `src/common/contracts/leads/import/lead-import-valid-row.ts` → `src/common/contracts/leads/import/validation/`
- Move: `src/common/contracts/leads/import/lead-import-social-profile.ts` → `src/common/contracts/leads/import/validation/`
- Move: `src/common/contracts/leads/import/lead-import-row-entry.ts` → `src/common/contracts/leads/import/validation/`

- [ ] **Step 1: Move the five validation files using git mv**

```bash
git mv src/common/contracts/leads/import/lead-import-validation-context.ts src/common/contracts/leads/import/validation/lead-import-validation-context.ts
git mv src/common/contracts/leads/import/lead-import-validation-result.ts src/common/contracts/leads/import/validation/lead-import-validation-result.ts
git mv src/common/contracts/leads/import/lead-import-valid-row.ts src/common/contracts/leads/import/validation/lead-import-valid-row.ts
git mv src/common/contracts/leads/import/lead-import-social-profile.ts src/common/contracts/leads/import/validation/lead-import-social-profile.ts
git mv src/common/contracts/leads/import/lead-import-row-entry.ts src/common/contracts/leads/import/validation/lead-import-row-entry.ts
```

Expected: no output, exit 0.

- [ ] **Step 2: Verify the move**

```bash
ls src/common/contracts/leads/import/validation/
```

Expected output (5 files):

```
lead-import-row-entry.ts
lead-import-social-profile.ts
lead-import-valid-row.ts
lead-import-validation-context.ts
lead-import-validation-result.ts
```

---

## Task 3: Fix cross-references within moved validation files

Two validation files import each other using absolute `@/` paths that now point to the old locations.

**Files:**

- Modify: `src/common/contracts/leads/import/validation/lead-import-validation-result.ts`
- Modify: `src/common/contracts/leads/import/validation/lead-import-valid-row.ts`

- [ ] **Step 1: Update `lead-import-validation-result.ts`**

Change line 2 from:

```ts
import type { ValidatedLeadImportRow } from "@/common/contracts/leads/import/lead-import-valid-row";
```

To:

```ts
import type { ValidatedLeadImportRow } from "@/common/contracts/leads/import/validation/lead-import-valid-row";
```

Full file after change:

```ts
import type { LeadImportRowIssueDto } from "@/common/contracts/leads";
import type { ValidatedLeadImportRow } from "@/common/contracts/leads/import/validation/lead-import-valid-row";

export interface LeadImportValidationSuccess {
  ok: true;
  value: ValidatedLeadImportRow;
  issues: LeadImportRowIssueDto[];
}

export interface LeadImportValidationFailure {
  ok: false;
  issues: LeadImportRowIssueDto[];
}

export type LeadImportValidationResult =
  | LeadImportValidationSuccess
  | LeadImportValidationFailure;
```

- [ ] **Step 2: Update `lead-import-valid-row.ts`**

Change line 2 from:

```ts
import type { ValidatedLeadImportSocialProfile } from "@/common/contracts/leads/import/lead-import-social-profile";
```

To:

```ts
import type { ValidatedLeadImportSocialProfile } from "@/common/contracts/leads/import/validation/lead-import-social-profile";
```

Full file after change:

```ts
import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import type { ValidatedLeadImportSocialProfile } from "@/common/contracts/leads/import/validation/lead-import-social-profile";

export interface ValidatedLeadImportRow {
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone?: string;
  owner?: string;
  notes?: string;
  external_guid?: string;
  website_url?: string;
  category_slug?: string;
  category_id?: string;
  score?: number;
  status?: ContactLeadStatus;
  improvements: string[];
  social_profiles: ValidatedLeadImportSocialProfile[];
}
```

---

## Task 4: Update `src/common/contracts/leads/index.ts`

Six exports in the barrel index point to moved files.

**Files:**

- Modify: `src/common/contracts/leads/index.ts`

- [ ] **Step 1: Replace the six stale export paths**

Replace the current contents of `src/common/contracts/leads/index.ts` with:

```ts
export type { LeadImportRowDto } from "./import/lead-import-row.dto";
export type { LeadImportReportDto } from "./import/lead-import-report.dto";
export type { RawLeadImportRow } from "./import/csv/lead-import-raw-row";
export type { LeadImportRowIssueDto } from "./import/lead-import-row-issue.dto";
export type { ValidatedLeadImportSocialProfile } from "./import/validation/lead-import-social-profile";
export type {
  InvalidRowEntry,
  RowEntry,
  ValidatedRowEntry,
} from "./import/validation/lead-import-row-entry";
export type { LeadImportValidationContext } from "./import/validation/lead-import-validation-context";
export type {
  LeadImportValidationFailure,
  LeadImportValidationResult,
  LeadImportValidationSuccess,
} from "./import/validation/lead-import-validation-result";
export type { ValidatedLeadImportRow } from "./import/validation/lead-import-valid-row";
export type { LeadImportResultDto } from "./import/lead-import-result.dto";
export type { CreateLeadCoreInput } from "./create-lead-core-input";
export type { CreateLeadCoreOptions } from "./create-lead-core-options";
export type { CreateLeadCoreSocialProfileInput } from "./create-lead-core-social-profile-input";
```

---

## Task 5: Update server-side callers

Five server files and one test file import moved files using direct `@/` paths (not via the barrel). Each must be updated.

**Files:**

- Modify: `src/server/workspace/leads/services/import/lead-csv-parser-service.ts`
- Modify: `src/server/workspace/leads/services/import/lead-csv-mapping-service.ts`
- Modify: `src/server/workspace/leads/services/import/lead-import-social-profile-mapper-service.ts`
- Modify: `src/server/workspace/leads/services/import/lead-import-validation-service.ts`
- Modify: `src/server/workspace/leads/command-handler/import-leads.command-handler.ts`
- Modify: `src/server/tests/workspace/leads/services/import/lead-import-validation-service.test.ts`

- [ ] **Step 1: Update `lead-csv-parser-service.ts`**

Change lines 5–8 from:

```ts
import type { LeadCsvParseErrorDetails } from "@/common/contracts/leads/import/lead-csv-parse-error-details";
import type { LeadCsvParseResult } from "@/common/contracts/leads/import/lead-csv-parse-result";
import type { LeadCsvParserOptions } from "@/common/contracts/leads/import/lead-csv-parser-options";
import type { LeadCsvRowState } from "@/common/contracts/leads/import/lead-csv-row-state";
```

To:

```ts
import type { LeadCsvParseErrorDetails } from "@/common/contracts/leads/import/csv/lead-csv-parse-error-details";
import type { LeadCsvParseResult } from "@/common/contracts/leads/import/csv/lead-csv-parse-result";
import type { LeadCsvParserOptions } from "@/common/contracts/leads/import/csv/lead-csv-parser-options";
import type { LeadCsvRowState } from "@/common/contracts/leads/import/csv/lead-csv-row-state";
```

- [ ] **Step 2: Update `lead-csv-mapping-service.ts`**

Change the import of `RawLeadImportRow` from:

```ts
import type { RawLeadImportRow } from "@/common/contracts/leads/import/lead-import-raw-row";
```

To:

```ts
import type { RawLeadImportRow } from "@/common/contracts/leads/import/csv/lead-import-raw-row";
```

- [ ] **Step 3: Update `lead-import-social-profile-mapper-service.ts`**

Change lines 7–8 from:

```ts
import type { RawLeadImportRow } from "@/common/contracts/leads/import/lead-import-raw-row";
import type { ValidatedLeadImportSocialProfile } from "@/common/contracts/leads/import/lead-import-social-profile";
```

To:

```ts
import type { RawLeadImportRow } from "@/common/contracts/leads/import/csv/lead-import-raw-row";
import type { ValidatedLeadImportSocialProfile } from "@/common/contracts/leads/import/validation/lead-import-social-profile";
```

- [ ] **Step 4: Update `lead-import-validation-service.ts`**

Change lines 16–19 from:

```ts
import type { RawLeadImportRow } from "@/common/contracts/leads/import/lead-import-raw-row";
import type { LeadImportValidationContext } from "@/common/contracts/leads/import/lead-import-validation-context";
import type { LeadImportValidationResult } from "@/common/contracts/leads/import/lead-import-validation-result";
import type { ValidatedLeadImportRow } from "@/common/contracts/leads/import/lead-import-valid-row";
```

To:

```ts
import type { RawLeadImportRow } from "@/common/contracts/leads/import/csv/lead-import-raw-row";
import type { LeadImportValidationContext } from "@/common/contracts/leads/import/validation/lead-import-validation-context";
import type { LeadImportValidationResult } from "@/common/contracts/leads/import/validation/lead-import-validation-result";
import type { ValidatedLeadImportRow } from "@/common/contracts/leads/import/validation/lead-import-valid-row";
```

- [ ] **Step 5: Update `import-leads.command-handler.ts`**

Change lines 11–14 (the `lead-import-row-entry` import block) from:

```ts
import type {
  RowEntry,
  ValidatedRowEntry,
} from "@/common/contracts/leads/import/lead-import-row-entry";
```

To:

```ts
import type {
  RowEntry,
  ValidatedRowEntry,
} from "@/common/contracts/leads/import/validation/lead-import-row-entry";
```

Change line 26 (the `lead-import-valid-row` import) from:

```ts
import type { ValidatedLeadImportRow } from "@/common/contracts/leads/import/lead-import-valid-row";
```

To:

```ts
import type { ValidatedLeadImportRow } from "@/common/contracts/leads/import/validation/lead-import-valid-row";
```

- [ ] **Step 6: Update `lead-import-validation-service.test.ts`**

Change line 9 from:

```ts
import type { RawLeadImportRow } from "@/common/contracts/leads/import/lead-import-raw-row";
```

To:

```ts
import type { RawLeadImportRow } from "@/common/contracts/leads/import/csv/lead-import-raw-row";
```

---

## Task 6: Verify and commit

- [ ] **Step 1: Run TypeScript type check**

```bash
npm run typecheck
```

Expected: exits 0, no errors. If errors appear, they will all be "Cannot find module" errors — re-check that the import path in the failing file matches the new location.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: exits 0, no errors.

- [ ] **Step 3: Commit all changes**

```bash
git add src/common/contracts/leads/ src/server/workspace/leads/services/import/lead-csv-parser-service.ts src/server/workspace/leads/services/import/lead-csv-mapping-service.ts src/server/workspace/leads/services/import/lead-import-social-profile-mapper-service.ts src/server/workspace/leads/services/import/lead-import-validation-service.ts src/server/workspace/leads/command-handler/import-leads.command-handler.ts src/server/tests/workspace/leads/services/import/lead-import-validation-service.test.ts
git commit -m "refactor: group import contracts into csv/ and validation/ subdirs"
```
