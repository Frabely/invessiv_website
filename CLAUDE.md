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
│   ├── (auth)/           # Public Clerk sign-in/sign-up routes
│   ├── workspace/      # Protected workspace route group
│   ├── (landing)/        # Landing page route group
│   └── (legal)/          # Legal pages route group
├── app/api/              # API route handlers (POST /api/public/contact)
├── components/
│   ├── auth/             # Auth frame components for Clerk pages
│   ├── workspace/        # Protected workspace UI components
│   ├── marketing/        # Landing page sections (hero, services, proof, process, contact, footer)
│   ├── legal/            # Legal page components
│   └── shared/           # Reusable UI (button, locale-switch, theme-switch, breadcrumbs)
├── server/
│   ├── contact/          # Command handlers per contact kind
│   ├── workspace/        # Workspace command/query handlers
│   └── services/         # Email service, response builder, anti-abuse, rate limiter
├── i18n/dictionaries/    # Per-section translation files: <section>/{de,en}.json + index.ts
├── hooks/                # Custom React hooks (scroll, reveal, tilt, theme, etc.)
└── lib/                  # SEO helpers, navigation, analytics utilities

packages/
├── common/               # Shared DTOs, constants, defaults, patterns (@invessiv/common)
│   ├── contracts/
│   ├── constants/
│   ├── defaults/
│   └── patterns/
└── db/                   # Drizzle client, schemas, migrations, persistence (@invessiv/db)
    ├── migrations/       # SQL migration files
    ├── scripts/          # Migration/seed/smoke-test runners
    └── src/
        ├── contact/      # Persist-* functions per contact kind
        ├── contracts/    # Persistence input/record contracts
        ├── core/         # DB client, env loading, SQL helpers
        └── record-configuration/  # pgTable schemas (one file per table)
```

### Scoped guidance files

Read the closest scoped guidance file before changing files in that area. Root rules still apply; scoped files add or tighten local conventions.

| File                                   | What it contains                                                                                                                                   | When to use it                                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/[locale]/(auth)/AGENTS.md`    | Agent/Codex rules for public Clerk auth routes, i18n, component structure, security boundaries, and required skills.                               | Use for sign-in/sign-up routes, auth frame UI, auth metadata, auth dictionaries, or Clerk UI work in `(auth)`.                                      |
| `src/app/[locale]/(auth)/CLAUDE.md`    | Architecture knowledge for the public auth area: purpose, Clerk stack, routing, redirects, i18n, security, and planned extensions.                 | Use for planning, implementation, or review of `/[locale]/sign-in`, `/[locale]/sign-up`, Clerk appearance, auth redirects, or auth E2E smoke tests. |
| `src/app/[locale]/workspace/AGENTS.md` | Agent/Codex rules for the protected workspace: auth gate, allowlist, noindex/dynamic rendering, permission boundaries, tests, and skills.          | Use for workspace routes, workspace layout, auth/permission checks, workspace dictionaries, or protected workspace components.                      |
| `src/app/[locale]/workspace/CLAUDE.md` | Architecture knowledge for the workspace: defense-in-depth, Clerk/allowlist mechanics, routing conventions, critical files, and future extensions. | Use for `/[locale]/workspace`, `requireWorkspaceAccess`, allowlist changes, role-model planning, or workspace shell work.                           |

### Routing

Dynamic locale segment `[locale]` (values: `"de"` | `"en"`) wraps all pages. Static generation via `generateStaticParams()`. URL slugs are always English (`/terms`, `/privacy`, `/imprint`) even when UI text is German.

### i18n (mandatory rules)

- All UI/page text lives exclusively in `src/i18n/dictionaries/<section>/{de,en}.json` — never inline in `.tsx`
- Loaded server-side via `src/i18n/get-dictionary.ts` (marked `server-only`)
- When editing copy, always update **all** supported locale files in the same commit
- No `locale === "de" ? … : …` branching in app/config/lib/provider/component code. This also applies to provider configuration and third-party localization objects such as Clerk `deDE`/`enUS`. Use typed locale-keyed dictionaries or `Record<SupportedLocale, ...>` mappings so adding a third language never requires structural code changes.
- Key namespace convention: `meta`, `page`, `sections`, `labels`, `values` within each section namespace

### Contact API pattern

`POST /api/public/contact` dispatches to per-kind command handlers in `src/server/contact/`. Each handler validates with
Zod, persists via a dedicated persistence service (`packages/db/src/contact/`), and sends email via Resend. Rate
limiting and anti-abuse checks run before dispatch.

### Database

Canonical model source: `packages/db/src/record-configuration/` (workspace package `@invessiv/db`). Schema defined with
Drizzle `pgTable`; never duplicate column lists elsewhere. Connection is a cached singleton.

### Constants & Enums

- String union types always use the **const object + derived type** pattern — never TypeScript `enum`:
  ```ts
  export const FooKind = { Bar: "bar", Baz: "baz" } as const;
  export type FooKind = (typeof FooKind)[keyof typeof FooKind];
  ```
- Keys use **PascalCase** (`LeadSource.Webform`, not `LeadSource.WEBFORM`)
- When iteration is needed (Drizzle `{ enum: [...] }`, `sqlCheckIn`), export a separate `FOO_KIND_VALUES` array derived from the object — string literals appear **exactly once**, in the const object:
  ```ts
  export const FOO_KIND_VALUES = [FooKind.Bar, FooKind.Baz] as const;
  ```
- Each constant group lives in its own file under `packages/common/src/constants/<domain>/`

### Error Codes & Messages

Error codes are constants like any other string union. Human-readable message text is mapped in exactly one place and
never duplicated inline across call sites. This convention applies both server-side (API responses) and client-side (
form validation errors, toasts, inline error text).

**Pattern:**

```ts
// 1. Error codes in packages/common/src/constants/<domain>/<domain>-error-codes.ts
export const FooErrorCode = {
  NotFound: "NOT_FOUND",
  ValidationError: "VALIDATION_ERROR",
  Internal: "INTERNAL",
} as const;
export type FooErrorCode = (typeof FooErrorCode)[keyof typeof FooErrorCode];

// 2. Message map + helper co-located with the layer that uses it (e.g. src/app/api/.../foo-error.ts)
const MESSAGES: Record<FooErrorCode, string> = {
  [FooErrorCode.NotFound]: "Not found",
  [FooErrorCode.ValidationError]: "Validation failed",
  [FooErrorCode.Internal]: "Unexpected server error",
};

export function fooError(
  code: FooErrorCode,
  status: number,
  details?: unknown,
): Response {
  return Response.json(
    {
      error: code,
      message: MESSAGES[code],
      ...(details !== undefined ? { details } : {}),
    },
    { status },
  );
}
```

**Rules:**

- Each error code string literal appears **exactly once** — in the const object.
- Message text appears **exactly once** — in the `MESSAGES` map of the layer's `*-error.ts` file.
- Route/component files call the helper (`fooError(FooErrorCode.NotFound, 404)`) — no inline `Response.json` with
  hardcoded strings.
- `MESSAGES` is **not exported** unless external code (e.g. a test or i18n layer) needs individual messages directly.
- Client-side equivalent: a `fooErrorMessage(code: FooErrorCode): string` lookup function, same pattern.

### Types & Contracts

Exported TypeScript types and interfaces are never defined inline in service or handler files. They live in dedicated
files:

- **Shared between client and server** (input shapes, result shapes, DTOs): `packages/common/src/contracts/<domain>/`
- **Server-internal only** (contains server-only imports or DB types): dedicated `*-types.ts` file within
  `src/server/workspace/<domain>/`

The service or handler file imports directly from the contract file — no re-exporting.

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
