# CLAUDE - Workspace / CRM-Bereich

Architektur-Wissen für den geschützten Workspace-Bereich der Invessiv-Website. Diese Datei ergänzt die Repo-Root `CLAUDE.md` und die `src/app/CLAUDE.md` und gilt für alle Routen unter `src/app/[locale]/workspace/`.

> **Status:** Skelett. Auth-Setup und leere Shell sind im Implementierungsplan `plans/dashboard/clerk-auth-and-shell.md` beschrieben. Echte Workspace-Inhalte folgen in späteren Tickets.

## Zweck

Privater, allowlist-geschützter Bereich für administrative / interne Funktionen. Phase 1: nur Owner-Zugriff. Phase 2: kleine Gruppe berechtigter Nutzer. Skaliert später zu Rollen-Modell.

## Auth-Stack

- **Provider:** [Clerk](https://clerk.com/) via `@clerk/nextjs`
- **Localization:** `@clerk/localizations`, locale-aware in `<ClerkProvider>` über ein typisiertes Locale-Mapping gesetzt
- **Storage:** keine eigene Session-Tabelle, keine eigenen Cookies — alles Clerk-managed
- **Eigene Auth-Logik:** keine. Keine JWTs, keine Passwort-Hashes, keine Login-Endpoints.

## Schutz-Layer (zwei Stufen, beide aktiv)

### Layer 1 — Edge / `proxy.ts`

`src/proxy.ts` nutzt `clerkMiddleware` + `createRouteMatcher`. Pattern `"/(de|en)/workspace(.*)"` ruft `auth.protect()` auf:

- Eingeloggt → durch
- Nicht eingeloggt → Redirect zu `/[locale]/sign-in?redirect_url=...`

Legacy-Redirects (Wurzel `/` → `/de`, `/imprint` → `/de/imprint`, etc.) laufen **vor** dem Auth-Check in derselben Middleware.

### Layer 2 — Server Component / `workspace/layout.tsx`

```
src/app/[locale]/workspace/layout.tsx
  └─ await requireWorkspaceAccess(locale)
       ├─ auth() → falls kein userId → redirect(signInPathFor(locale))
       ├─ currentUser() → primary email
       └─ isEmailAllowed(email) → falls false → notFound()
```

Layer 2 fängt zwei Fälle ab, die Layer 1 nicht abdecken kann:

- Eingeloggter User, der **nicht** auf der Allowlist steht → 404
- Race-Condition zwischen Edge-Cache und Auth-State

## Allowlist

**Mechanismus:** ENV-Variable `WORKSPACE_ALLOWED_EMAILS` (Komma-getrennt, lowercase, trim).

**Helper:** `src/lib/auth/allowlist.ts` parst zur Modul-Initialisierung (Server-Boot), exportiert `isEmailAllowed(email)`.

**Erweiterung:**

- Mehr Mails → ENV-Wert in Vercel ergänzen → Redeploy
- Mehr Strenge (Domain-basiert, Pattern-basiert) → `allowlist.ts` erweitern, Tests dazu
- DB-basierte ACL erst, wenn >5 User oder dynamische Berechtigungen — dann nach `src/server/auth/` migrieren

## Routing-Konvention

| Route-Group     | Pfad                                      | Zweck                   | Geschützt? |
| --------------- | ----------------------------------------- | ----------------------- | ---------- |
| `(landing)`     | `/[locale]`, `/[locale]/landing/*`        | Marketing               | nein       |
| `(legal)`       | `/[locale]/imprint`, `/privacy`, `/terms` | Legal                   | nein       |
| `(auth)`        | `/[locale]/sign-in`, `/sign-up`           | Clerk-Forms             | nein       |
| **`workspace`** | **`/[locale]/workspace`**, später mehr    | **Geschützter Bereich** | **ja**     |

Alles unter `workspace/` ist geschützt. Sign-in/Sign-up unter `(auth)/` sind öffentlich. `workspace` und `(auth)` sind getrennte Route-Groups.

## i18n

Pattern wie der Rest der Seite:

```
src/i18n/dictionaries/workspace/
  meta/
    de.json    # title, description (für generateMetadata)
    en.json
  page/
    de.json    # Headlines, Sub-Copy, Labels
    en.json
  index.ts     # getWorkspaceMetaContent(locale), getWorkspacePageContent(locale)
```

`src/i18n/get-dictionary.ts` lädt Workspace-Section nach Bedarf. Keine inline-Strings, keine locale-Branches im Code. Auch Provider-/Framework-Konfigurationen wie Clerk-Localizations dürfen nicht per `locale === "de" ? deDE : enUS` verzweigt werden; stattdessen zentrale `Record<SupportedLocale, ...>`-Mappings verwenden.

## SEO / Caching

- `metadata.robots = { index: false, follow: false, nocache: true }`
- `export const dynamic = "force-dynamic"` (oder `revalidate = 0`) auf jeder Page
- Keine externe Verlinkung, keine Sitemap-Einträge
- **Konsequenz:** Praktisch nicht crawlable, keine SEO-Optimierung nötig

## Geplante Erweiterungen (nicht implementiert)

| Feature                           | Trigger                                                | Wo                                                                            |
| --------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Sidebar / Workspace-Navigation    | Sobald >1 Workspace-Page existiert                     | `workspace/layout.tsx`                                                        |
| `<UserButton>` im Site-Header     | Sobald Login öffentlich beworben werden soll           | `src/components/marketing/site-header/` mit `<SignedIn>`-Wrapper              |
| Rollen-System (`admin`, `viewer`) | Sobald Allowlist-User unterschiedliche Rechte brauchen | Clerk `publicMetadata.role` + `requireRole()`-Helper                          |
| DB-basierte ACL                   | >5 berechtigte User oder dynamische Permissions        | Drizzle-Tabelle in `src/server/db/record-configuration/` + `src/server/auth/` |
| E2E-Test Login-Flow               | Sobald Workspace-Inhalte existieren                    | `e2e/workspace-auth.e2e.ts`                                                   |
| Custom Clerk Theme                | Falls Default-Light nicht zum Brand passt              | `appearance`-Prop in `<ClerkProvider>`                                        |

## Kritische Dateien (Referenz)

| Pfad                                                   | Zweck                                         |
| ------------------------------------------------------ | --------------------------------------------- |
| `src/proxy.ts`                                         | Legacy-Redirects + Clerk-Middleware (Layer 1) |
| `src/app/[locale]/workspace/layout.tsx`                | Auth-Gate (Layer 2)                           |
| `src/app/[locale]/workspace/page.tsx`                  | Workspace-Shell                               |
| `src/app/[locale]/(auth)/sign-in/[[...rest]]/page.tsx` | Clerk Sign-in                                 |
| `src/app/[locale]/(auth)/sign-up/[[...rest]]/page.tsx` | Clerk Sign-up                                 |
| `src/lib/auth/allowlist.ts`                            | ENV-Parser + `isEmailAllowed()`               |
| `src/lib/auth/permissions.ts`                          | `requireWorkspaceAccess()`                    |
| `src/lib/auth/routes.ts`                               | locale-aware Auth-URLs                        |
| `src/components/providers/app-providers.tsx`           | `<ClerkProvider>`-Einbindung                  |
| `src/i18n/dictionaries/workspace/`                     | Workspace-Texte                               |
| `src/i18n/dictionaries/auth/`                          | Sign-in/Sign-up-Frame-Texte                   |

## Was hier NICHT hingehört

- Marketing-Pages (Hero, Pricing, FAQ, etc.) → `(landing)/`
- Legal-Pages → `(legal)/`
- Public-API-Routen → `src/app/api/public/`
- Eigene Login-/Register-Endpoints → es gibt keine, Clerk übernimmt das

## Verweise

- Repo-Root `CLAUDE.md` — generelle Architektur, Stack, i18n-Regeln
- Repo-Root `AGENTS.md` — branchen-, branding-, security-Regeln
- `src/app/CLAUDE.md` — App-Router-Konventionen
- `src/components/CLAUDE.md` — Komponenten-Konventionen
- `src/i18n/CLAUDE.md` — Dictionary-Regeln
- Implementierungs-Plan: `plans/dashboard/clerk-auth-and-shell.md`
