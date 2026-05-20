# Invessiv Workspace Migrationsplan: Risikoarme Monorepo-Migration

Stand: 20.05.2026

## Zielbild

Invessiv wird in ein pnpm-Monorepo mit zwei unabhängig deployten Next.js-Apps überführt:

- `apps/web`: öffentliche Marketing-, Legal- und Kontaktformular-App für `https://invessiv.com`
- `apps/workspace`: private CRM-/Workspace-App für `https://workspace.invessiv.com`
- `packages/common`: geteilte DTOs, Konstanten, Defaults und Patterns
- `packages/db`: Drizzle-Client, Schemas, Migrationen, DB-Scripts und DB-nahe Persistenzfunktionen

Die Migration soll nicht als Big Bang erfolgen. Jede Phase muss für sich reviewbar, buildfähig und rückrollbar sein.

## Verbindliche Architekturentscheidungen

| Thema                   | Entscheidung                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Package Manager         | Migration von `package-lock.json` zu `pnpm-lock.yaml` über `pnpm import`; danach `package-lock.json` entfernen                                                     |
| Monorepo Tooling        | pnpm workspaces, kein Turborepo                                                                                                                                    |
| Next.js Routing-Schutz  | Für Next.js `16.1.6` wird `proxy.ts` verwendet, nicht `middleware.ts`                                                                                              |
| Workspace-URLs          | Workspace behält Locale-Prefixe auf der Subdomain: `/de/leads`, `/en/leads`                                                                                        |
| Web-Redirects           | Keine Workspace-/Auth-Redirects nötig; der Workspace wurde nicht öffentlich genutzt                                                                                |
| Auth-Schutz             | `apps/workspace/src/proxy.ts` schützt private Workspace-Seitenrouten                                                                                               |
| Public Workspace-Routen | Nur `/:locale/sign-in(.*)` und `/:locale/sign-up(.*)` sind öffentlich                                                                                              |
| API-Schutz              | Workspace-APIs werden nicht per Proxy geschützt, sondern ausschließlich route-level über `withWorkspaceApiAuth` oder gleichwertige serverseitige Allowlist-Prüfung |
| Kontaktformular         | Bleibt in `apps/web` unter `/api/public/contact`                                                                                                                   |
| DB                      | Beide Apps nutzen `packages/db`; `packages/db` bleibt server-only                                                                                                  |
| UI                      | Kein `packages/ui`, bis echter Cross-App-Reuse entsteht                                                                                                            |
| Lint                    | Scripts nutzen `eslint .`, nicht `next lint`                                                                                                                       |
| i18n                    | Sprachabhängige Inhalte bleiben dictionary-basiert; DE/EN-Keys müssen kompatibel bleiben                                                                           |

## Zielstruktur

```text
invessiv_website/
  apps/
    web/
      src/
        app/
          [locale]/
            (landing)/
            (legal)/
          api/public/contact/
        client/contact/
        components/
          legal/
          marketing/
          shared/
        config/
        hooks/
        i18n/
        lib/
        server/contact/
      e2e/
      next.config.ts
      package.json
      playwright.config.ts
      postcss.config.mjs
      tsconfig.json
      vitest.config.ts

    workspace/
      src/
        app/
          [locale]/
            (auth)/
              sign-in/[[...rest]]/page.tsx
              sign-up/[[...rest]]/page.tsx
            (app)/
              layout.tsx
              page.tsx
              leads/
              import/
              settings/
          api/workspace/
        client/
          leads/
          outreach/
        components/
          auth/
          workspace/
        config/
        i18n/
        lib/
          auth/
          workspace/
        server/workspace/
        proxy.ts
      e2e/
      next.config.ts
      package.json
      playwright.config.ts
      postcss.config.mjs
      tsconfig.json
      vitest.config.ts

  packages/
    common/
      src/
        constants/
        contracts/
        defaults/
        patterns/
        index.ts
      package.json
      tsconfig.json

    db/
      src/
        contact/
        contracts/
        core/
        migrations/
        record-configuration/
        index.ts
      scripts/
      package.json
      tsconfig.json

  package.json
  pnpm-workspace.yaml
  pnpm-lock.yaml
  tsconfig.base.json
```

## URL-Zielbild

| Bisher intern         | Neu                                         |
| --------------------- | ------------------------------------------- |
| `/de/workspace`       | `https://workspace.invessiv.com/de`         |
| `/en/workspace`       | `https://workspace.invessiv.com/en`         |
| `/de/workspace/leads` | `https://workspace.invessiv.com/de/leads`   |
| `/en/workspace/leads` | `https://workspace.invessiv.com/en/leads`   |
| `/de/sign-in`         | `https://workspace.invessiv.com/de/sign-in` |
| `/en/sign-in`         | `https://workspace.invessiv.com/en/sign-in` |
| `/de/sign-up`         | `https://workspace.invessiv.com/de/sign-up` |
| `/en/sign-up`         | `https://workspace.invessiv.com/en/sign-up` |

Diese alten Pfade müssen nicht per Redirect erhalten bleiben, weil der Workspace bisher nicht öffentlich genutzt wurde. Nach dem Cleanup dürfen alte Workspace-Pfade auf `invessiv.com` 404 liefern. Entscheidend ist nur, dass interne Links, Bookmarks in interner Dokumentation und Clerk-Konfigurationen auf die neue Subdomain zeigen.

## PR-Schnitt

### PR 1: Monorepo-Grundlage ohne App-Split

Ziel: pnpm und Workspace-Struktur vorbereiten, ohne fachliche Dateien zu verschieben.

Umfang:

- Branch `chore/monorepo-migration` erstellen
- Backup-Tag `before-monorepo-migration` setzen
- `pnpm import` aus bestehender `package-lock.json` ausführen
- `pnpm-workspace.yaml` anlegen
- Root-`package.json` auf pnpm-Scripts vorbereiten
- `tsconfig.base.json` anlegen
- `package-lock.json` entfernen, `pnpm-lock.yaml` committen
- vorhandene Root-Scripts zunächst kompatibel mit der aktuellen Single-App-Struktur halten
- neue Filter-Scripts für `@invessiv/web`, `@invessiv/workspace` und `@invessiv/db` erst in den PRs aktivieren, in denen diese Workspaces existieren

Root-Scripts Zielzustand nach Abschluss des App-/Package-Splits:

```json
{
  "scripts": {
    "dev:web": "pnpm --filter @invessiv/web dev",
    "dev:workspace": "pnpm --filter @invessiv/workspace dev",
    "build:web": "pnpm --filter @invessiv/web build",
    "build:workspace": "pnpm --filter @invessiv/workspace build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "db:migrate:dev": "pnpm --filter @invessiv/db db:migrate:dev",
    "db:smoke:dev": "pnpm --filter @invessiv/db db:smoke:dev"
  },
  "packageManager": "pnpm@<lokal-geprüfte-version>"
}
```

Gate:

- `pnpm install`
- bestehendes `pnpm lint`
- bestehendes `pnpm typecheck`
- bestehendes `pnpm test`

Rollback:

- `package-lock.json` aus vorherigem Commit wiederherstellen
- `pnpm-lock.yaml`, `pnpm-workspace.yaml` und Root-Script-Änderungen zurücknehmen

### PR 2: `packages/common` extrahieren

Ziel: `src/common/**` nach `packages/common/src/**` verschieben und über `@invessiv/common` konsumieren.

Umfang:

- `packages/common/package.json` ohne `"type": "module"` anlegen
- `packages/common/src/index.ts` mit gezielten Public Exports anlegen
- `src/common/**` nach `packages/common/src/**` verschieben
- Imports auf `@invessiv/common` umstellen
- temporäre oder finale TS-Paths sauber konfigurieren
- neu berührte String-Unions auf Const-Objekt-Pattern prüfen

`packages/common/package.json`:

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
  },
  "devDependencies": {
    "typescript": "^5"
  },
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests"
  }
}
```

Gate:

- `pnpm --filter @invessiv/common typecheck`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`

Follow-up-Regel:

- Wenn alte String-Union-Verstöße nicht in diesem PR bereinigt werden können, müssen sie mit Dateipfad, Regelbezug, Risiko und nächstem Schritt dokumentiert werden.

### PR 3: `packages/db` extrahieren

Ziel: DB-nahe Logik server-only in `packages/db` bündeln.

Umfang:

- `src/server/db/core/**` nach `packages/db/src/core/**`
- `src/server/db/record-configuration/**` nach `packages/db/src/record-configuration/**`
- `src/server/db/contact/**` nach `packages/db/src/contact/**`
- `src/server/db/contracts/**` nach `packages/db/src/contracts/**`
- `src/server/db/migrations/**` nach `packages/db/src/migrations/**` oder `packages/db/migrations/**`
- `src/server/db/scripts/**` nach `packages/db/scripts/**`
- Script-Pfade so anpassen, dass Migrationen unabhängig vom aktuellen Working Directory gefunden werden
- `packages/db/src/index.ts` nur mit serverseitig sicheren Exports anlegen
- Imports in der bestehenden App auf `@invessiv/db` umstellen

`packages/db/package.json`:

```json
{
  "name": "@invessiv/db",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*"
  },
  "dependencies": {
    "@invessiv/common": "workspace:*",
    "@neondatabase/serverless": "^1.0.2",
    "dotenv": "^17.3.1",
    "drizzle-orm": "^0.45.2",
    "server-only": "^0.0.1",
    "tsx": "^4.21.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.10",
    "typescript": "^5",
    "vitest": "latest"
  },
  "scripts": {
    "db:migrate": "tsx scripts/run-migrations.ts",
    "db:migrate:dev": "tsx scripts/run-migrations.ts development",
    "db:migrate:preview": "tsx scripts/run-migrations.ts preview",
    "db:migrate:prod": "tsx scripts/run-migrations.ts production",
    "db:reset:dev": "tsx scripts/reset-development-db.ts",
    "db:smoke": "tsx scripts/smoke-test.ts",
    "db:smoke:dev": "tsx scripts/smoke-test.ts development",
    "db:smoke:preview": "tsx scripts/smoke-test.ts preview",
    "db:smoke:prod": "tsx scripts/smoke-test.ts production",
    "db:seed:leads": "tsx scripts/seed-leads-fixture.ts",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests"
  }
}
```

Gate:

- `pnpm --filter @invessiv/db typecheck`
- `pnpm --filter @invessiv/db test`
- `pnpm --filter @invessiv/db db:smoke:dev`
- `pnpm lint`
- `pnpm typecheck`

### PR 4: `apps/web` erstellen und Marketing-App isolieren

Ziel: öffentliche Website in `apps/web` lauffähig machen, ohne Workspace-Code mitzunehmen.

Umfang:

- Marketing-, Legal-, SEO-, Theme-, Navigation-, Public-Asset- und Provider-Code nach `apps/web` verschieben
- `src/app/api/public/contact/**` nach `apps/web/src/app/api/public/contact/**`
- `src/server/contact/**` nach `apps/web/src/server/contact/**`
- `src/client/contact/**` nach `apps/web/src/client/contact/**`
- `src/i18n/**` für Web übernehmen, aber Workspace- und Auth-Dictionaries nicht in `apps/web` belassen
- `src/lib/auth/**`, Workspace-Komponenten, Workspace-APIs und Auth-Routen nicht nach `apps/web` übernehmen
- `apps/web/src/app/robots.ts` und `apps/web/src/app/sitemap.ts` auf `https://invessiv.com` ausrichten
- `apps/web/next.config.ts` ohne Workspace-/Auth-Redirects halten
- vorhandene öffentliche Links zum Workspace entfernen; falls ein interner Link bewusst bleibt, zeigt er direkt auf `NEXT_PUBLIC_WORKSPACE_URL`
- bestehendes `/projects`-Feature-Flag-Verhalten in `apps/web` übernehmen und die bisherigen Proxy-Tests dafür in passende Web-Routing-/Config-Tests überführen oder funktional ersetzen

`apps/web/package.json`:

```json
{
  "name": "@invessiv/web",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start --port 3000",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests",
    "test:e2e": "playwright test --pass-with-no-tests"
  },
  "dependencies": {
    "@invessiv/common": "workspace:*",
    "@invessiv/db": "workspace:*",
    "@vercel/analytics": "^1.6.1",
    "@vercel/speed-insights": "^1.3.1",
    "next": "16.1.6",
    "next-themes": "^0.4.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-hook-form": "^7.72.1",
    "resend": "latest",
    "server-only": "^0.0.1",
    "zod": "^4.3.6"
  }
}
```

Minimaler Zielzustand für `apps/web/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/", destination: "/de", permanent: true },
      { source: "/imprint", destination: "/de/imprint", permanent: true },
      { source: "/privacy", destination: "/de/privacy", permanent: true },
      { source: "/terms", destination: "/de/terms", permanent: true },
    ];
  },
  transpilePackages: ["@invessiv/common", "@invessiv/db"],
};

export default nextConfig;
```

Gate:

- `pnpm --filter @invessiv/web lint`
- `pnpm --filter @invessiv/web typecheck`
- `pnpm --filter @invessiv/web test`
- `pnpm --filter @invessiv/web build`
- Kontaktformular lokal gegen Development-DB testen

### PR 5: `apps/workspace` erstellen

Ziel: Workspace-App mit Locale-Prefix und eigenem Auth-Gate lauffähig machen.

Umfang:

- `src/app/[locale]/workspace/**` nach `apps/workspace/src/app/[locale]/(app)/**`
- `src/app/[locale]/(auth)/**` nach `apps/workspace/src/app/[locale]/(auth)/**`
- `src/app/api/workspace/**` nach `apps/workspace/src/app/api/workspace/**`
- `src/server/workspace/**` nach `apps/workspace/src/server/workspace/**`
- `src/lib/auth/**` und `src/lib/workspace/**` nach `apps/workspace/src/lib/**`
- Workspace- und Auth-Dictionaries nach `apps/workspace/src/i18n/**`
- Workspace-Komponenten und Client-Services nach `apps/workspace/src/**`
- Workspace-`robots.ts` mit `noindex`, `nofollow`, `noarchive` und `nosnippet`
- keine Sitemap für private Workspace-Routen
- `apps/workspace/src/proxy.ts` mit Clerk-Schutz für Seitenrouten anlegen
- `/api/workspace/**` aus dem Proxy-Auth-Schutz ausnehmen
- API-Routen verpflichtend über `withWorkspaceApiAuth` oder einen gleichwertigen Route-Level-Helper schützen
- API-Routen behalten JSON-Fehler bei fehlender Auth oder fehlender Allowlist und liefern keine Redirect-/HTML-Antworten

`apps/workspace/src/proxy.ts`:

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/:locale/sign-in(.*)",
  "/:locale/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!api|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
```

`apps/workspace/package.json`:

```json
{
  "name": "@invessiv/workspace",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests",
    "test:e2e": "playwright test --pass-with-no-tests"
  },
  "dependencies": {
    "@clerk/localizations": "^4.5.6",
    "@clerk/nextjs": "^7.2.8",
    "@invessiv/common": "workspace:*",
    "@invessiv/db": "workspace:*",
    "next": "16.1.6",
    "next-themes": "^0.4.6",
    "openai": "^6.38.0",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-hook-form": "^7.72.1",
    "server-only": "^0.0.1",
    "zod": "^4.3.6"
  }
}
```

Gate:

- `pnpm --filter @invessiv/workspace lint`
- `pnpm --filter @invessiv/workspace typecheck`
- `pnpm --filter @invessiv/workspace test`
- `pnpm --filter @invessiv/workspace build`
- manueller Auth-Smoke mit Allowlist-User und Nicht-Allowlist-User

### PR 6: Tooling, Tests und E2E pro App splitten

Ziel: App-spezifische Qualitätsgates stabilisieren.

Umfang:

- `apps/web/vitest.config.ts`
- `apps/workspace/vitest.config.ts`
- `apps/web/playwright.config.ts`
- `apps/workspace/playwright.config.ts`
- `apps/web/eslint.config.mjs`
- `apps/workspace/eslint.config.mjs`
- `apps/web/postcss.config.mjs`
- `apps/workspace/postcss.config.mjs`
- Tooling-Abhängigkeiten bleiben zentral am Root; App-/Package-Configs referenzieren Root-Tooling, statt alle Dev-Dependencies unnötig zu duplizieren
- E2E-Tests fachlich verschieben:
  - Kontaktformular und Marketing nach `apps/web/e2e/**`
  - Workspace-Auth, Leads, Import und Outreach nach `apps/workspace/e2e/**`
- Root-Husky und lint-staged auf Monorepo-Pfade prüfen

Gate:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @invessiv/web test:e2e`
- `pnpm --filter @invessiv/workspace test:e2e`

### PR 7: Vercel Preview und ENV-Split

Ziel: beide Apps als getrennte Vercel-Projekte previewfähig machen.

`apps/web` ENV:

```text
DATABASE_URL
CONTACT_MAIL_PROVIDER
CONTACT_MAIL_FROM
CONTACT_MAIL_TO
RESEND_API_KEY
NEXT_PUBLIC_SITE_URL=https://invessiv.com
NEXT_PUBLIC_WORKSPACE_URL=https://workspace.invessiv.com
ENABLE_MARKETING_PROOF
GOOGLE_SITE_VERIFICATION
```

`apps/workspace` ENV:

```text
DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
WORKSPACE_ALLOWED_EMAILS
NEXT_PUBLIC_APP_URL=https://workspace.invessiv.com
NEXT_PUBLIC_MARKETING_URL=https://invessiv.com
OPENAI_API_KEY
OPENAI_MODEL
```

Clerk-ENV-Werte dürfen keine harte `/de`-Default-Locale erzwingen. Locale-passende Sign-in-, Sign-up-, After-Sign-in- und Redirect-Targets werden über zentrale Route-Helper oder Proxy-/App-Logik erzeugt.

`packages/db` Scripts unterstützen weiterhin:

```text
DATABASE_URL_DEVELOPMENT
DATABASE_URL_PREVIEW
DATABASE_URL_PRODUCTION
```

Vercel-Konfiguration:

- Projekt `invessiv-web`: Root Directory `apps/web`
- Projekt `invessiv-workspace`: Root Directory `apps/workspace`
- Zugriff auf externe Workspace-Packages aktivieren, falls Vercel dies für `packages/**` verlangt
- Vercel muss die Root-Workspace-Installation plus Zugriff auf `packages/**` unterstützen
- Preview-Deploys beider Apps vor DNS-Änderung testen

Gate:

- Preview `apps/web`: `/de`, `/en`, Kontaktformular, Legal-Routen
- Preview `apps/workspace`: `/de/sign-in`, `/en/sign-in`, `/de/leads`
- Clerk Allowed Origins und Redirect URLs für Preview und Production prüfen

### PR 8: DNS, direkte Workspace-Links und Cleanup

Ziel: Workspace produktiv auf Subdomain schalten, direkte interne Zugriffe nutzen und alten Workspace-Code aus der Web-App entfernen.

Reihenfolge:

1. `workspace.invessiv.com` im Vercel-Projekt `invessiv-workspace` hinzufügen
2. DNS-CNAME setzen
3. Clerk Allowed Origins und Redirect URLs aktualisieren:
   - `https://workspace.invessiv.com/de/*`
   - `https://workspace.invessiv.com/en/*`
   - `https://workspace.invessiv.com`
4. Production-Smoke Workspace durchführen
5. interne Dokumentation und persönliche Bookmarks auf `workspace.invessiv.com` umstellen
6. Marketing-Links, falls vorhanden, auf `workspace.invessiv.com` umstellen oder entfernen
7. alten Workspace- und Auth-Code aus `apps/web` entfernen
8. `src/proxy.ts` aus alter Root-Struktur entfernen, sobald beide Apps vollständig getrennt sind

Gate:

- `https://invessiv.com/de` lädt korrekt
- `https://invessiv.com/en` lädt korrekt
- `https://workspace.invessiv.com/de/leads` ist direkt erreichbar
- `https://workspace.invessiv.com/en/leads` ist direkt erreichbar
- alte Workspace-Pfade auf `invessiv.com`, z. B. `/de/workspace/leads`, dürfen nach Cleanup 404 liefern
- nicht eingeloggter Workspace-User landet bei locale-passendem Sign-in
- nicht-allowlisted eingeloggter User erhält 404
- allowlisted User sieht Leads, Import und Outreach
- Workspace-API liefert bei fehlender Auth JSON `401`
- Workspace-API liefert bei fehlender Allowlist JSON `404`
- Workspace-Routen sind `noindex` und nicht in der Web-Sitemap
- DE/EN-Dictionaries bleiben key-kompatibel

Rollback:

- Web-App auf altes Deployment zurückrollen, falls öffentliche Website betroffen ist
- Workspace-DNS auf vorherigen Zustand zurücksetzen
- Vercel Production Deployment der vorherigen Web-App reaktivieren
- Clerk Redirect URLs erst nach erfolgreichem Rollback bereinigen

## Endgültiger Testplan

Lokale Gates:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build:web
pnpm build:workspace
pnpm --filter @invessiv/db db:migrate:dev
pnpm --filter @invessiv/db db:smoke:dev
pnpm --filter @invessiv/web test:e2e
pnpm --filter @invessiv/workspace test:e2e
```

Web Acceptance:

- [ ] `/de` und `/en` laden korrekt
- [ ] Kontaktformular schreibt DB-Eintrag
- [ ] Kontaktformular sendet oder queued Mail
- [ ] Legal-Routen `/de/imprint`, `/de/privacy`, `/de/terms`, `/en/imprint`, `/en/privacy`, `/en/terms` laden korrekt
- [ ] Canonicals und Metadata zeigen auf `https://invessiv.com`
- [ ] Sitemap enthält keine privaten Workspace-Routen

Workspace Acceptance:

- [ ] `/de/sign-in` und `/en/sign-in` laden korrekt
- [ ] `/de/sign-up` und `/en/sign-up` laden korrekt
- [ ] geschützte Routen erfordern Clerk-Login
- [ ] Allowlist-Gate bleibt serverseitig aktiv
- [ ] Leads, Import und Outreach funktionieren für allowlisted User
- [ ] API-Fehler bleiben JSON und redirecten nicht auf HTML
- [ ] `robots.ts` setzt private Defaults

Qualitäts-Gates:

- [ ] Lint grün
- [ ] Typecheck grün
- [ ] Unit-/Integration-Tests grün
- [ ] E2E-Smokes grün oder bewusst mit Risiko dokumentiert
- [ ] A11y-Smoke für Web-Startseite und Workspace-Core-Flow geprüft
- [ ] Core-Web-Vitals-Risiken für Web dokumentiert
- [ ] Security-/Privacy-Auswirkungen dokumentiert

## Offene Entscheidungen vor Umsetzung

- Liegen DB-Migrationen final in `packages/db/src/migrations/**` oder `packages/db/migrations/**`? Die Scripts müssen den gewählten Pfad eindeutig referenzieren.
- Wird `OPENAI_MODEL` als Pflichtvariable im Workspace eingeführt oder mit serverseitigem Default betrieben?
- Werden Preview-Clerk-Redirects wildcard-basiert oder deployment-spezifisch gepflegt?

## Nicht-Ziele dieser Migration

- Kein neues `packages/ui`
- Kein CORS-Layer zwischen Web und Workspace
- Keine Änderung am Rollenmodell über die bestehende Allowlist hinaus
- Keine fachliche Erweiterung von Leads, Import oder Outreach
- Keine Umstellung auf Turborepo
