# Überarbeiteter Migrationsplan: Invessiv Monorepo

Stand: 20.05.2026 — ersetzt ursprünglichen Plan vom 13.05.2026

## Context

Die aktuelle Next.js-App vermischt Marketing (invessiv.com) und Workspace-CRM in einem Projekt. Ziel ist ein
pnpm-Monorepo mit zwei unabhängig deployten Apps (zwei Vercel-Projekte, ein GitHub-Repo). Alle kritischen Fehler aus der
Plan-Review sind in diesem Plan behoben.

---

## Finale Architekturentscheidungen

| Frage                        | Entscheidung                                      |
| ---------------------------- | ------------------------------------------------- |
| Build-Tool                   | pnpm workspaces only (kein Turborepo)             |
| Legacy-Redirects in apps/web | `next.config.ts redirects()` — kein middleware    |
| DB-Zugriff                   | Beide Apps via `packages/db`                      |
| Kontaktformular-API          | Bleibt in apps/web (`/api/public/contact`)        |
| packages/common Scope        | Vollständige Migration aller `src/common`-Inhalte |
| CORS                         | Nicht nötig (kein Cross-Origin API)               |

---

## Zielstruktur

```
invessiv/                           ← gleicher GitHub-Repo-Root
  apps/
    web/                            ← invessiv.com (Marketing + Kontaktformular-API)
      src/
        app/                        ← nur öffentliche Routen
        components/marketing/
        components/legal/
        components/shared/
        server/contact/             ← Kontaktformular-Handler + E-Mail + Anti-Abuse
        i18n/
        lib/
        hooks/
        config/
      next.config.ts                ← Legacy-Redirects + workspace.invessiv.com-Redirects
      package.json                  ← @invessiv/web
      tsconfig.json

    workspace/                      ← workspace.invessiv.com (CRM)
      src/
        app/
          (auth)/sign-in/[[...rest]]/page.tsx
          (auth)/sign-up/[[...rest]]/page.tsx
          (app)/layout.tsx          ← Sidebar + UserButton
          (app)/page.tsx
          (app)/leads/
          (app)/import/
          (app)/settings/
        middleware.ts               ← Clerk Auth (Layer 1)
        lib/auth/                   ← allowlist.ts + permissions.ts + routes.ts
        server/workspace/           ← Leads, Outreach, etc.
        components/workspace/
        i18n/dictionaries/workspace/
        i18n/dictionaries/auth/
        client/leads/
        client/outreach/
      next.config.ts
      package.json                  ← @invessiv/workspace

  packages/
    common/                         ← alles aus src/common (types, contracts, constants)
      src/
        constants/
        contracts/
        defaults/
        patterns/
        index.ts
      package.json                  ← @invessiv/common
      tsconfig.json

    db/                             ← Drizzle-Client + Schemas + Migrations
      src/
        core/                       ← client.ts, sql-helpers.ts
        schema/                     ← lead-submissions.ts, leads.ts, etc.
        contact/                    ← persist-discovery-call.ts etc.
        index.ts
      scripts/                      ← run-migrations.ts, seed-leads-fixture.ts, etc.
      package.json                  ← @invessiv/db
      tsconfig.json

  package.json                      ← root (workspaces config)
  pnpm-workspace.yaml
  tsconfig.base.json
```

---

## Korrekturen gegenüber dem alten Plan

| #   | Problem                                                                             | Lösung                                                                                        |
| --- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | `middleware.ts` existierte nicht — `src/proxy.ts` war nie aktive Next.js-Middleware | apps/workspace bekommt echte `src/middleware.ts` mit Clerk; apps/web braucht keine Middleware |
| 2   | `WORKSPACE_ALLOWED_EMAILS` fehlte in Workspace-Env-Vars                             | Explizit in Phase 5 und Vercel-Config                                                         |
| 3   | Marketing-App braucht auch DB (Kontaktformular)                                     | Beide Apps nutzen `packages/db`                                                               |
| 4   | `"type": "module"` in packages/common riskant                                       | Entfernt — kein Typ-Feld in packages/common/package.json                                      |
| 5   | `"next": "latest"` riskiert Version-Mismatch                                        | Alle Apps pinnen `"next": "16.1.6"`, `"react": "19.2.3"`, `"zod": "^4.3.6"`                   |
| 6   | Phase-Reihenfolge: Phase 2 (apps/web) vor Phase 3 (common) bricht Build             | packages/_ werden **vor** apps/_ erstellt                                                     |
| 7   | Tailwind v4 nicht adressiert                                                        | Jede App behält/bekommt eigene Tailwind-CSS-Konfiguration                                     |
| 8   | Vercel Build-Command für Turborepo fehlt                                            | Kein Turborepo → `next build` direkt, Root-Directory-Konfiguration reicht                     |
| 9   | packages/common-Beispiele verwendeten plain string unions                           | Const-Objekt-Pattern (CLAUDE.md-Konvention) wird durchgängig erzwungen                        |
| 10  | E2E, Vitest, ESLint, Husky nicht adressiert                                         | In Phase 9 explizit behandelt                                                                 |
| 11  | DB-Migration-Scripts ohne Zielort                                                   | Liegen in `packages/db/scripts/`, werden von Root-DB-Commands aufgerufen                      |

---

## Kritische Dateien (Referenz)

| Datei                                 | Ziel                                                                                                      | Bemerkung                               |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `src/proxy.ts`                        | Aufteilen: legacy redirects → `apps/web/next.config.ts`; Clerk-Logic → `apps/workspace/src/middleware.ts` | War nie aktive Middleware               |
| `src/common/**`                       | → `packages/common/src/`                                                                                  | Vollständige Migration                  |
| `src/server/db/core/`                 | → `packages/db/src/core/`                                                                                 | Drizzle-Client                          |
| `src/server/db/record-configuration/` | → `packages/db/src/schema/`                                                                               | Schemas                                 |
| `src/server/db/scripts/`              | → `packages/db/scripts/`                                                                                  | Migration-Scripts                       |
| `src/server/db/contact/`              | → `packages/db/src/contact/`                                                                              | Contact-Persist-Handler (shared)        |
| `src/server/db/contracts/`            | → `packages/db/src/contracts/`                                                                            | DB-interne Typen                        |
| `src/server/contact/`                 | → `apps/web/src/server/contact/`                                                                          | Kontaktformular-Business-Logic          |
| `src/server/workspace/`               | → `apps/workspace/src/server/workspace/`                                                                  | CRM-Business-Logic                      |
| `src/app/[locale]/workspace/`         | → `apps/workspace/src/app/(app)/`                                                                         | Workspace-Routen (ohne /de)             |
| `src/app/[locale]/(auth)/`            | → `apps/workspace/src/app/(auth)/`                                                                        | Clerk Sign-in/Sign-up                   |
| `src/components/workspace/`           | → `apps/workspace/src/components/workspace/`                                                              |                                         |
| `src/components/auth/`                | → `apps/workspace/src/components/auth/`                                                                   |                                         |
| `src/components/marketing/`           | → `apps/web/src/components/marketing/`                                                                    |                                         |
| `src/lib/auth/`                       | → `apps/workspace/src/lib/auth/`                                                                          | allowlist.ts, permissions.ts, routes.ts |
| `src/i18n/dictionaries/workspace/`    | → `apps/workspace/src/i18n/...`                                                                           |                                         |
| `src/i18n/dictionaries/auth/`         | → `apps/workspace/src/i18n/...`                                                                           |                                         |
| `src/client/leads/`                   | → `apps/workspace/src/client/leads/`                                                                      |                                         |
| `src/client/outreach/`                | → `apps/workspace/src/client/outreach/`                                                                   |                                         |
| `src/client/contact/`                 | → `apps/web/src/client/contact/`                                                                          |                                         |
| `e2e/contact-lead-persistence.e2e.ts` | → `apps/web/e2e/`                                                                                         |                                         |
| `e2e/home-section-spacing.e2e.ts`     | → `apps/web/e2e/`                                                                                         |                                         |
| `e2e/services-localization.e2e.ts`    | → `apps/web/e2e/`                                                                                         |                                         |
| `vitest.config.ts`                    | → je eine pro App                                                                                         |                                         |
| `eslint.config.mjs`                   | → je eine pro App + root                                                                                  |                                         |

---

## Migrationsphasen

### Phase 0 — Vorbereitung (Tag 1, Stunde 1)

1. Branch erstellen: `git checkout -b chore/monorepo-migration`
2. Tag setzen: `git tag before-monorepo-migration`
3. Alle ENV-Variablen dokumentieren (beide kommenden Apps):

**apps/web ENV:**

```
DATABASE_URL
RESEND_API_KEY
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_WORKSPACE_URL=https://workspace.invessiv.com
```

**apps/workspace ENV:**

```
DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
WORKSPACE_ALLOWED_EMAILS=...
NEXT_PUBLIC_APP_URL=https://workspace.invessiv.com
NEXT_PUBLIC_MARKETING_URL=https://invessiv.com
OPENAI_API_KEY
```

---

### Phase 1 — Monorepo-Basis anlegen (Tag 1)

**Root `package.json`:**

```json
{
  "name": "invessiv",
  "private": true,
  "scripts": {
    "dev:web": "pnpm --filter @invessiv/web dev",
    "dev:workspace": "pnpm --filter @invessiv/workspace dev",
    "build:web": "pnpm --filter @invessiv/web build",
    "build:workspace": "pnpm --filter @invessiv/workspace build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  },
  "packageManager": "pnpm@9.x"
}
```

Prüfe zuerst: `pnpm --version` → trage exakte Version ein.

**`pnpm-workspace.yaml`:**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**`tsconfig.base.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedSideEffectImports": true,
    "noFallthroughCasesInSwitch": true,
    "allowUnreachableCode": false
  }
}
```

---

### Phase 2 — `packages/common` (Tag 1–2, VOR den Apps)

**Ziel:** Alle Inhalte aus `src/common/` → `packages/common/src/`

**`packages/common/package.json`** (kein `"type": "module"`):

```json
{
  "name": "@invessiv/common",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*"
  },
  "dependencies": {
    "zod": "^4.3.6"
  }
}
```

**Konvention:** Alle Typen in packages/common müssen das Const-Objekt-Pattern verwenden:

```ts
// ✅ korrekt
export const LeadStatus = { New: "new", Contacted: "contacted" } as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

// ❌ verboten
export type LeadStatus = "new" | "contacted";
```

**Schritte:**

1. `packages/common/src/` anlegen, Verzeichnisstruktur spiegeln: `constants/`, `contracts/`, `defaults/`, `patterns/`
2. Dateien verschieben (nicht kopieren)
3. `packages/common/src/index.ts` anlegen mit Re-Exports aller Public-API
4. Im aktuellen Mono-App temporär `@invessiv/common` als Alias hinzufügen (`tsconfig.json` paths)
5. `npm run typecheck` + `npm run lint` grün

---

### Phase 3 — `packages/db` (Tag 2)

**Ziel:** Drizzle-Client + Schemas + Migrations + Scripts auslagern

**`packages/db/package.json`:**

```json
{
  "name": "@invessiv/db",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*"
  },
  "dependencies": {
    "@neondatabase/serverless": "^1.0.2",
    "drizzle-orm": "^0.45.2",
    "server-only": "^0.0.1",
    "@invessiv/common": "workspace:*"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.10",
    "tsx": "^4.21.0",
    "dotenv": "^17.3.1"
  }
}
```

**DB-Scripts** bleiben in `packages/db/scripts/`:

```json
{
  "scripts": {
    "db:migrate": "tsx scripts/run-migrations.ts",
    "db:migrate:dev": "tsx scripts/run-migrations.ts development",
    "db:migrate:prod": "tsx scripts/run-migrations.ts production",
    "db:seed:leads": "tsx scripts/seed-leads-fixture.ts"
  }
}
```

Root-`package.json` delegiert:

```json
{
  "db:migrate": "pnpm --filter @invessiv/db db:migrate",
  "db:migrate:dev": "pnpm --filter @invessiv/db db:migrate:dev"
}
```

**Schritte:**

1. `src/server/db/core/` → `packages/db/src/core/`
2. `src/server/db/record-configuration/` → `packages/db/src/schema/`
3. `src/server/db/contact/` → `packages/db/src/contact/`
4. `src/server/db/contracts/` → `packages/db/src/contracts/`
5. `src/server/db/scripts/` → `packages/db/scripts/`
6. `packages/db/src/index.ts` mit Public-Exports
7. Imports in aktuellem App aktualisieren
8. `npm run typecheck` grün

---

### Phase 4 — `apps/web` (Tag 3)

**Ziel:** Aktuelle Marketing-App wird nach `apps/web/` verschoben, Clerk entfernt, Legacy-Redirects in `next.config.ts`
verankert.

**Was kommt in apps/web:**

- `src/app/[locale]/(landing)/` + `(legal)/` + Root-Pages
- `src/app/api/public/contact/` (bleibt komplett)
- `src/components/marketing/`, `shared/`, `legal/`
- `src/server/contact/` (Kontaktformular-Handler, Resend, Anti-Abuse)
- `src/i18n/` (ohne workspace/, auth/)
- `src/lib/` (ohne auth/)
- `src/hooks/marketing/`
- `src/config/`
- `src/client/contact/`

**Was NICHT in apps/web kommt:**

- Alles unter `workspace/` (Route + Components + Server)
- `(auth)/` Routen
- `src/lib/auth/` (allowlist, permissions)
- `src/client/leads/`, `src/client/outreach/`

**`apps/web/next.config.ts`** — Legacy-Redirects + Workspace-Redirects:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Legacy-Redirects (aus proxy.ts übernommen)
      { source: "/", destination: "/de", permanent: true },
      { source: "/imprint", destination: "/de/imprint", permanent: true },
      { source: "/privacy", destination: "/de/privacy", permanent: true },
      { source: "/terms", destination: "/de/terms", permanent: true },
      // Workspace-Redirects (nach Migration)
      {
        source: "/de/workspace",
        destination: "https://workspace.invessiv.com",
        permanent: true,
      },
      {
        source: "/de/workspace/:path*",
        destination: "https://workspace.invessiv.com/:path*",
        permanent: true,
      },
      // Auth-Redirects
      {
        source: "/de/sign-in",
        destination: "https://workspace.invessiv.com/sign-in",
        permanent: true,
      },
      {
        source: "/de/sign-up",
        destination: "https://workspace.invessiv.com/sign-up",
        permanent: true,
      },
    ];
  },
  transpilePackages: ["@invessiv/common", "@invessiv/db"],
};

export default nextConfig;
```

**Kein `middleware.ts`** in apps/web — nicht nötig.

**`apps/web/package.json`:**

```json
{
  "name": "@invessiv/web",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start --port 3000",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests",
    "test:e2e": "playwright test --pass-with-no-tests"
  },
  "dependencies": {
    "@invessiv/common": "workspace:*",
    "@invessiv/db": "workspace:*",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "zod": "^4.3.6",
    "resend": "latest",
    "@vercel/analytics": "^1.6.1",
    "@vercel/speed-insights": "^1.3.1",
    "next-themes": "^0.4.6",
    "react-hook-form": "^7.72.1",
    "server-only": "^0.0.1"
  }
}
```

**Test:** `pnpm --filter @invessiv/web dev` → `http://localhost:3000` öffnen, Kontaktformular testen.

---

### Phase 5 — `apps/workspace` (Tag 3–4)

**Ziel:** Eigenständige Next.js-App für das CRM.

**Was kommt in apps/workspace:**

- `src/app/[locale]/workspace/**` → `src/app/(app)/**` (Locale-Prefix entfernen)
- `src/app/[locale]/(auth)/` → `src/app/(auth)/`
- `src/components/workspace/`
- `src/components/auth/`
- `src/server/workspace/`
- `src/lib/auth/` (allowlist.ts, permissions.ts, routes.ts — angepasst für neue URLs)
- `src/i18n/dictionaries/workspace/`
- `src/i18n/dictionaries/auth/`
- `src/client/leads/`, `src/client/outreach/`

**`apps/workspace/src/middleware.ts`** (echte Next.js-Middleware):

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

**URL-Mapping:**

```
/de/workspace           → /          (apps/workspace Root)
/de/workspace/leads     → /leads
/de/workspace/leads/new → /leads/new
/de/workspace/import    → /import
/de/sign-in             → /sign-in
/de/sign-up             → /sign-up
```

**ENV-Variablen für apps/workspace/.env.local:**

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
WORKSPACE_ALLOWED_EMAILS=deine@email.de
DATABASE_URL=...
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_MARKETING_URL=http://localhost:3000
OPENAI_API_KEY=...
```

**`apps/workspace/package.json`:**

```json
{
  "name": "@invessiv/workspace",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests",
    "test:e2e": "playwright test --pass-with-no-tests"
  },
  "dependencies": {
    "@clerk/nextjs": "^7.2.8",
    "@clerk/localizations": "^4.5.6",
    "@invessiv/common": "workspace:*",
    "@invessiv/db": "workspace:*",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "zod": "^4.3.6",
    "openai": "^6.38.0",
    "next-themes": "^0.4.6",
    "react-hook-form": "^7.72.1",
    "server-only": "^0.0.1"
  }
}
```

**Test:** `pnpm --filter @invessiv/workspace dev` → `http://localhost:3001`, Login, Leads.

---

### Phase 6 — Tailwind v4 pro App (Tag 4)

Tailwind v4 hat keine `tailwind.config.ts` mehr. Jede App braucht ihre eigene CSS-Konfiguration.

**apps/web:** Bestehende Tailwind-CSS-Konfiguration aus `src/app/globals.css` übernehmen.

**apps/workspace:** Neue `src/app/globals.css` mit:

```css
@import "tailwindcss";
/* Workspace-spezifische Theme-Tokens */
```

Wenn `packages/ui` später Komponenten enthält, müssen beide Apps dessen Pfad referenzieren:

```css
@source "../../../packages/ui/src/**/*.tsx";
```

---

### Phase 7 — Vercel-Projekte einrichten (Tag 5)

**Projekt 1: invessiv-web**

```
Root Directory:  apps/web
Build Command:   next build        (kein Turborepo)
Framework:       Next.js
Domain:          invessiv.com
```

ENV-Vars in Vercel:

```
DATABASE_URL
RESEND_API_KEY
NEXT_PUBLIC_SITE_URL=https://invessiv.com
NEXT_PUBLIC_WORKSPACE_URL=https://workspace.invessiv.com
```

**Wichtig:** In Vercel → Project Settings → Build & Development → aktiviere **"Include source files outside of the Root
Directory"** (für Zugriff auf packages/\*).

**Projekt 2: invessiv-workspace**

```
Root Directory:  apps/workspace
Build Command:   next build
Framework:       Next.js
Domain:          workspace.invessiv.com
```

ENV-Vars in Vercel:

```
DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
WORKSPACE_ALLOWED_EMAILS=...
NEXT_PUBLIC_APP_URL=https://workspace.invessiv.com
NEXT_PUBLIC_MARKETING_URL=https://invessiv.com
OPENAI_API_KEY=...
```

---

### Phase 8 — DNS für workspace.invessiv.com (Tag 6)

1. In Vercel → `invessiv-workspace` → Settings → Domains → `workspace.invessiv.com` hinzufügen
2. Vercel zeigt CNAME-Wert an → beim Domain-Anbieter eintragen:
   ```
   Type: CNAME
   Name: workspace
   Value: cname.vercel-dns.com
   ```
3. Warten auf Vercel-Validierung
4. Testen: `https://workspace.invessiv.com/sign-in`

**Clerk Dashboard prüfen:**

- Allowed redirect URLs: `https://workspace.invessiv.com/*`
- Allowed origins: `https://workspace.invessiv.com`
- Production domain korrekt gesetzt

---

### Phase 9 — Tests, Tooling, Cleanup (Tag 7)

**Vitest pro App** (apps/web/vitest.config.ts, apps/workspace/vitest.config.ts):

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    exclude: [".claude/**", "node_modules/**"],
  },
});
```

**E2E-Tests:**

- `e2e/contact-lead-persistence.e2e.ts` → `apps/web/e2e/`
- `e2e/home-section-spacing.e2e.ts` → `apps/web/e2e/`
- `e2e/services-localization.e2e.ts` → `apps/web/e2e/`
- Neue Workspace-E2E: `apps/workspace/e2e/workspace-auth.e2e.ts`

**ESLint** — Root bleibt, Apps bekommen eigene `eslint.config.mjs` (extends root).

**Husky + lint-staged** — bleiben im Root, funktionieren für gesamtes Monorepo.

**Cleanup:**

- `src/app/[locale]/workspace/` aus apps/web entfernen
- `src/app/[locale]/(auth)/` aus apps/web entfernen (nach Workspace-Migration)
- `src/lib/auth/` aus apps/web entfernen
- `src/proxy.ts` entfernen (komplett ersetzt)
- `src/components/workspace/` und `auth/` aus apps/web entfernen

---

### Phase 10 — Go-live-Reihenfolge

1. Monorepo-Migration mergen (workspace-Routen noch in apps/web für Rollback)
2. Preview-Deploy beider Vercel-Projekte testen
3. DNS für workspace.invessiv.com setzen
4. Production-Deploy workspace testen: Login, Leads, Allowlist
5. Marketing-Links in apps/web auf `workspace.invessiv.com` umstellen
6. Redirects `/de/workspace/*` → `workspace.invessiv.com/*` aktivieren
7. Workspace-Code aus apps/web entfernen
8. Monitoring-Logs prüfen

**Rollback:** Vercel → vorheriges Deployment reaktivieren; Redirects deaktivieren → alte Routen wieder aktiv.

---

## Verification / Testcheckliste

**Lokal vor Go-live:**

```bash
pnpm --filter @invessiv/web dev      # http://localhost:3000
pnpm --filter @invessiv/workspace dev # http://localhost:3001
pnpm typecheck
pnpm lint
pnpm --filter @invessiv/web test
pnpm --filter @invessiv/workspace test
```

**Funktionale Tests (apps/web):**

- [ ] Startseite + Landing lädt
- [ ] Kontaktformular: Absenden → DB-Eintrag + E-Mail
- [ ] Legal-Pages (imprint, privacy, terms)
- [ ] Sprach-Switch DE/EN
- [ ] Legacy-Redirects: `/` → `/de`, `/imprint` → `/de/imprint`
- [ ] `/de/workspace` → Redirect zu `workspace.invessiv.com`

**Funktionale Tests (apps/workspace):**

- [ ] Sign-in funktioniert
- [ ] Sign-up funktioniert
- [ ] Nicht-Allowlist-User → 404
- [ ] Lead-Liste lädt
- [ ] Lead erstellen/bearbeiten
- [ ] Import funktioniert
- [ ] Logout funktioniert
- [ ] Session bleibt nach Reload
