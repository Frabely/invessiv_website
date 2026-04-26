# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript type-check (no emit)
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
npm run db:migrate   # Run DB migrations (variants: :dev, :preview, :prod)
```

Pre-merge gates: `npm run lint` and `npm run build` must pass green.

## Architecture

**Stack**: Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Drizzle ORM + Neon PostgreSQL · Resend (email) · Vitest + Playwright · Vercel

**What this is**: A conversion-focused marketing/service website for Invessiv with a contact-lead pipeline (project requests, discovery calls, quick contacts).

### Directory layout

```
src/
├── app/[locale]/         # Route entries only — page.tsx orchestrates, no logic here
│   ├── (landing)/        # Landing page route group
│   └── (legal)/          # Legal pages route group
├── app/api/              # API route handlers (POST /api/public/contact)
├── components/
│   ├── marketing/        # Landing page sections (hero, services, proof, process, contact, footer)
│   ├── legal/            # Legal page components
│   └── shared/           # Reusable UI (button, locale-switch, theme-switch, breadcrumbs)
├── server/
│   ├── db/               # Drizzle client, schemas in record-configuration/, migrations/
│   ├── contact/          # Command handlers per contact kind
│   └── services/         # Email service, response builder, anti-abuse, rate limiter
├── i18n/dictionaries/    # Per-section translation files: <section>/{de,en}.json + index.ts
├── hooks/                # Custom React hooks (scroll, reveal, tilt, theme, etc.)
├── lib/                  # SEO helpers, navigation, analytics utilities
└── common/
    ├── contracts/        # TypeScript DTO interfaces for contact request kinds
    ├── constants/        # Enums, defaults (contact kinds, locales, etc.)
    └── patterns/         # Shared utility patterns
```

### Routing

Dynamic locale segment `[locale]` (values: `"de"` | `"en"`) wraps all pages. Static generation via `generateStaticParams()`. URL slugs are always English (`/terms`, `/privacy`, `/imprint`) even when UI text is German.

### i18n (mandatory rules)

- All UI/page text lives exclusively in `src/i18n/dictionaries/<section>/{de,en}.json` — never inline in `.tsx`
- Loaded server-side via `src/i18n/get-dictionary.ts` (marked `server-only`)
- When editing copy, always update **all** supported locale files in the same commit
- No `locale === "de" ? … : …` branching in app/config/lib code — use locale-keyed dictionary lookups so adding a third language never requires code changes
- Key namespace convention: `meta`, `page`, `sections`, `labels`, `values` within each section namespace

### Contact API pattern

`POST /api/public/contact` dispatches to per-kind command handlers in `src/server/contact/`. Each handler validates with Zod, persists via a dedicated persistence service (`src/server/db/`), and sends email via Resend. Rate limiting and anti-abuse checks run before dispatch.

### Database

Canonical model source: `src/server/db/record-configuration/`. Schema defined with Drizzle `pgTable`; never duplicate column lists elsewhere. Connection is a cached singleton.

### Component conventions

- Each component lives in its own folder: `component-name/component-name.tsx`
- Styles go in a separate file (`component-name.css` or `*.module.css`), never inline styles in `.tsx`
- `src/app/globals.css` contains only: Tailwind import, global tokens/reset, theme CSS variables — no component-specific classes
- Server Components by default; `"use client"` only when interactivity requires it
- Animation/scroll/observer logic belongs in `src/hooks/`, not in render files
- `page.tsx` files orchestrate only — no large render switches or inline business logic

### CSS / Theming

- Design tokens (colors, spacing, radius) defined centrally in `globals.css`, not per-component
- Dark mode is the default theme; light mode must also work. Theme stored in cookie via `next-themes`
- CSS custom properties must be defined in `:root` (or the relevant scope) before use

### SEO requirements (every page)

- Unique `metadata` export with title, description, canonical, OpenGraph
- Title convention: home page → `Brand | Core promise`; subpages → `Page topic | Brand`
- Exactly one H1 per page; H2/H3 for content hierarchy only
- Structured data (JSON-LD) for `Organization` and relevant `Service` types

### Testing

- Unit tests co-located with implementation (`*.test.ts` / `*.test.tsx`)
- E2E tests in `e2e/` covering core conversion flows (contact form submission)
- New logic/workflows require tests (unit or E2E depending on risk) before merge

### Architecture violations

If a planned change violates a rule in this file or in an `AGENTS.md`, do not silently proceed — ask whether to fix immediately or defer. Deferred violations must be documented in `ARCHITECTURE-open-items.md` with file path, rule reference, risk, and next step.
