# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This directory contains all backend logic: orchestration, persistence, and server-side services.

## What belongs here

- Command handlers and request orchestration
- Validation wiring
- Mapper and transformation services
- DB client setup, migrations, scripts, and persistence
- Email services and other server-side integrations
- Shared server-side contracts and DTOs

## What does not belong here

- Reusable UI components → `src/components/`
- Route-level page composition → `src/app/`
- Language dictionaries → `src/i18n/`

## Contact flow structure

The contact pipeline is split across four locations — keep them separate:

| Responsibility                   | Location                        |
| -------------------------------- | ------------------------------- |
| Orchestration / command handlers | `src/server/contact/`           |
| Mapping / transformation         | `src/server/services/contact/`  |
| Persistence                      | `src/server/db/`                |
| Shared contracts / DTOs          | `src/common/contracts/contact/` |

## Naming conventions

- `*-mapping-service.ts` — transformation services
- `mapThingApiToDb` — API-to-DB mappers
- `mapThingDbToApi` — reverse direction (DB-to-API)
- `persist-*.ts` — database persistence functions
- `*-record.ts` — DB-adjacent row shapes (lives in `src/server/db/records/`)
- `*-persist-input.ts` — persistence payload contracts (lives in `src/server/db/contracts/`)

## Database model rules

- **Canonical model source**: `src/server/db/record-configuration/` — schema defined with Drizzle `pgTable`
- One model file per table in `record-configuration/`; no aggregate files, no duplicate model variants
- `records/**` holds only DB-adjacent record/row shapes with `snake_case` column names — no `camelCase` alias fields
- Composite persistence payloads and persistence results live exclusively in `contracts/**`, not in `records/**`
- Never duplicate column lists or table names alongside the `pgTable` definition
- No pure mapping logic in `src/server/db/`; no route orchestration in `src/server/db/`

## Tests

Tests mirror the server structure and live in `src/server/tests/`.
