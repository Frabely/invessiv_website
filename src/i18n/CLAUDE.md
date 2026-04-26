# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This directory contains all language data, dictionaries, and translation helpers.

## What belongs here

- Per-section dictionaries: `dictionaries/<section>/{de.json, en.json, index.ts}`
- Translation loader: `get-dictionary.ts` (marked `server-only`)
- Locale-keyed metadata content

## What does not belong here

- UI components → `src/components/`
- Route orchestration → `src/app/`
- Database persistence → `src/server/db/`

## Mandatory rules

- **All** UI/page text lives exclusively in these dictionary files — never inline translated strings in `.tsx`, `page.tsx`, layouts, or config files
- When editing any copy, update **all** supported locale files (`de.json` and `en.json`) in the **same commit** — merging with stale translations is not allowed
- When a dictionary file grows too large, split it by domain (e.g. `legal`, `home`, `services`, `footer`) rather than letting a monolithic file keep growing
- No `locale === "de" ? … : …` branching anywhere in app/config/lib/component code — use locale-keyed dictionary lookups so adding a third language never requires code changes
- SEO/structured-data values (meta descriptions, OpenGraph text, breadcrumb labels) also live in dictionaries — not in hard-coded locale branches

## Key naming convention

Each section dictionary uses consistent top-level keys:

```json
{
  "meta": { "title": "…", "description": "…" },
  "page": { … },
  "sections": { … },
  "labels": { … },
  "values": { … }
}
```

## Adding a new language

1. Add the locale to `SUPPORTED_LOCALES` in `src/config/i18n.ts`
2. Create `dictionaries/<section>/<locale>.json` for every section with identical keys
3. Verify that `alternates.languages`, the language switch, and metadata resolve correctly
