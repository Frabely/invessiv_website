# Plan: Clerk Auth + geschützter `/[locale]/dashboard` Bereich

## Context

Die öffentliche Marketing-Seite invessiv.com soll um einen privaten Dashboard-Bereich unter `/[locale]/dashboard` ergänzt werden. **Dieses Ticket implementiert NUR das Auth-/Routing-Skelett** — kein echter Dashboard-Inhalt. Ziel ist eine saubere, erweiterbare Struktur, damit später keine großen Refactors nötig sind.

**Was am Ende dieses Tickets funktioniert:**

- `/[locale]/dashboard` ist erreichbar, aber serverseitig geschützt
- Nicht eingeloggte Besucher → Redirect zu `/[locale]/sign-in?redirect_url=...`
- Eingeloggte User ohne Allowlist-Eintrag → `notFound()` (HTTP 404)
- Allowlistete User sehen einen leeren Dashboard-Placeholder
- `<ClerkProvider>` + Locale-aware Sign-in/Sign-up-Routen
- ENV-basierte Allowlist (`DASHBOARD_ALLOWED_EMAILS`), erweiterbar ohne Code-Änderung
- Dashboard-spezifische `AGENTS.md` + `CLAUDE.md` auf Route-Group-Ebene

**Was bewusst NICHT implementiert wird:**

- Kein echter Dashboard-Inhalt, keine Sidebar, keine Widgets
- Keine eigene JWT/Session-Logik, kein Passwort-Hashing
- Kein DB-basiertes Rollen-System (ENV reicht für Phase 1)
- Kein 404-Cloaking-Pflichtfeature, kein IP-Allowlisting
- Keine Public-Nav-Verlinkung (komplett versteckt)
- Keine Tests für Dashboard-Inhalte (es gibt keine Inhalte)

---

## 1. Skills für Umsetzung und Review

Diese Skills sind für Claude und Codex als gemeinsame Arbeits-/Review-Leitplanken gedacht. Codex nutzt die genannten Skills direkt, wenn der jeweilige Scope bearbeitet wird. Claude kann dieselben Einträge als Rollen-, Checklisten- oder Review-Prompts verwenden.

| Skill                             |                   Priorität | Einsatz im Plan   | Warum relevant                                                                                                                      |
| --------------------------------- | --------------------------: | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `best-practices`                  |                    required | Tickets 2-5, 9    | Auth-/ENV-/Security-Entscheidungen, server-only Grenzen, keine Secrets im Repo, sichere Dependency- und Architekturentscheidungen   |
| `frontend-design`                 |                    required | Tickets 6-7       | Auth-Frame und Dashboard-Shell sind sichtbare UI; Umsetzung muss konsistent, responsiv, theme-fähig und nicht generisch sein        |
| `copywriting`                     | required bei Textänderungen | Tickets 6-7       | Sign-in-/Sign-up-Frame, Dashboard-Placeholder, Meta-Texte und Microcopy müssen in DE/EN parallel sauber formuliert werden           |
| `accessibility`                   |     required für UI-Abnahme | Tickets 6-8       | Clerk-Frame, Fokus-Reihenfolge, Labels, Kontrast, Keyboard-Nutzung und Fehlerzustände müssen WCAG-konform bleiben                   |
| `ux-design`                       |                    sinnvoll | Tickets 6-8       | Minimale, verständliche Auth-Journey ohne Public-Nav-Link; klare Zustände für Redirect, 404 und erlaubten Zugriff                   |
| `seo`                             |                    sinnvoll | Tickets 7, 9      | Dashboard muss bewusst `noindex`, `nofollow`, `nocache` und ohne Sitemap-Eintrag bleiben; Auth-Seiten brauchen konsistente Metadata |
| `performance` / `core-web-vitals` |                    sinnvoll | Tickets 3, 6-7, 9 | Clerk-Integration darf App-Start, Hydration und Core Web Vitals nicht unnötig verschlechtern                                        |
| `web-quality-audit`               |     optionales Release-Gate | Ticket 9          | Bündelt Performance, A11y, SEO und Best Practices als finaler Qualitätscheck, falls die UI in diesem Ticket erweitert wird          |

**Minimal verpflichtend pro Ticket:**

- Auth, ENV, Proxy, Permissions: `best-practices`
- Sichtbare UI oder Styling: `frontend-design` + `accessibility`
- Sichtbare Copy, Metadata oder i18n-Texte: `copywriting`
- Pre-merge Review: `best-practices`; bei UI-Änderungen zusätzlich `accessibility`

**Locale-Requirement für alle Tickets:** Auch wenn aktuell nur `de` und `en` umgesetzt sind, wird immer so modelliert, als könnten weitere Sprachen folgen. Keine binären Branches wie `locale === "de" ? deText : enText` oder `locale === "de" ? deDE : enUS`. Localeabhängige Inhalte und Provider-Konfigurationen werden über Dictionaries oder typisierte `Record<SupportedLocale, ...>`-Mappings aufgelöst.

---

## 2. Ausführungsregel: ein Ticket pro Schritt

- Standard: Es wird immer nur **ein einzelnes Ticket** oder ein klar abgegrenzter Teilschritt ausgeführt.
- Mehrere Tickets dürfen nur zusammen umgesetzt werden, wenn der Nutzer das ausdrücklich sagt, z. B. "Tickets 2-4 umsetzen" oder "den kompletten Plan ausführen".
- Nach jedem Ticket wird kurz dokumentiert, was geändert wurde, welche Tests/Gates gelaufen sind und welches Ticket als Nächstes sinnvoll wäre.
- Wenn ein Ticket während der Umsetzung in größere unabhängige Aufgaben zerfällt, wird es in kleinere Schritte aufgeteilt, bevor weiter implementiert wird.
- Dokumentations- oder Planänderungen dürfen mehrere spätere Tickets betreffen, zählen aber nicht als technische Umsetzung dieser Tickets.

---

## 3. Bestätigte Fakten aus der Recon

| Punkt                          | Befund                                                                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Next.js Version                | **16.1.6** → `proxy.ts` Pattern (nicht `middleware.ts`)                                                                          |
| Vorhandener Proxy              | `src/proxy.ts` für Legacy-Redirects existiert → muss mit `clerkMiddleware` gemerged werden                                       |
| Locale-Struktur                | `src/app/[locale]/` mit `(landing)`, `(legal)` Route Groups                                                                      |
| Root-Layout                    | **Kein** `src/app/layout.tsx`, sondern `src/app/[locale]/layout.tsx` als effektives Root mit `<AppProviders>` (Theme + Language) |
| i18n                           | `src/i18n/dictionaries/<section>/{de,en}.json` + `index.ts`, geladen via `get-dictionary.ts` (server-only)                       |
| SEO Helper                     | `createPageMetadata()` aus `src/lib/seo/page-metadata.ts`                                                                        |
| Komponenten-Konvention         | `component-name/component-name.tsx` + `component-name.module.css`, Server-by-default                                             |
| Path Alias                     | `@/*` → `src/*`                                                                                                                  |
| Existierende Auth              | **Keine** — Greenfield für Clerk                                                                                                 |
| AGENTS.md/CLAUDE.md Pattern    | Liegen pro Hierarchie-Ebene (root, `src/app/`, `src/components/`, `src/server/`, `src/i18n/`)                                    |
| `.env.example`                 | **Existiert nicht** im Repo → kann als vollständige, secret-freie ENV-Vorlage angelegt werden                                    |
| Root `CLAUDE.md` / `AGENTS.md` | Verweisen inzwischen auf `(auth)` und `(dashboard)` Scope-Dateien                                                                |
| `src/app/CLAUDE.md`            | App-Router-Guidance auf `(auth)` für öffentliche Auth-Routen und `(dashboard)` für geschützte Dashboard-Flows aktualisiert       |

---

## 4. Bestätigte Entscheidungen aus den Rückfragen

| Frage                        | Entscheidung                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sign-in Routing              | Eigene Routes `/[locale]/sign-in` + `/sign-up` mit Clerks `<SignIn />` / `<SignUp />` Components                                                             |
| Allowlist                    | ENV-Variable `DASHBOARD_ALLOWED_EMAILS` (Komma-getrennt, lower-case-normalisiert)                                                                            |
| Nicht eingeloggt → Dashboard | Redirect zu `/[locale]/sign-in?redirect_url=...`                                                                                                             |
| Eingeloggt, nicht erlaubt    | `notFound()` → HTTP 404                                                                                                                                      |
| Nav-Visibility               | **Komplett versteckt** — kein Link in Header/Footer, nur Direkt-URL                                                                                          |
| Dashboard i18n               | Volles i18n via `src/i18n/dictionaries/dashboard/...`                                                                                                        |
| Auth i18n                    | Volles i18n via `src/i18n/dictionaries/auth/...` für den eigenen Auth-Frame; Clerk-interne Strings über `@clerk/localizations`                               |
| AGENTS.md/CLAUDE.md Scope    | `src/app/[locale]/(auth)/AGENTS.md`, `src/app/[locale]/(auth)/CLAUDE.md`, `src/app/[locale]/(dashboard)/AGENTS.md`, `src/app/[locale]/(dashboard)/CLAUDE.md` |
| Auth-Page Robots             | Auth-Seiten sind keine SEO-Landingpages und werden standardmäßig `noindex, follow: false` gesetzt                                                            |
| Sign-up Default              | `/[locale]/sign-up` bleibt zunächst erreichbar; Nutzer ohne Allowlist-Match sehen nach Login weiterhin 404 im Dashboard                                      |
| Clerk Theme Default          | Clerk Default-Light reicht für dieses Ticket; `appearance`-/Theme-Integration wird als spätere Erweiterung dokumentiert                                      |

---

## 5. Ziel-Ordnerstruktur (Baum)

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/                          # NEU — öffentliche Auth-Routen
│   │   │   ├── AGENTS.md                    # NEU — auth-scope Agent-Regeln
│   │   │   ├── CLAUDE.md                    # NEU — auth-scope Architektur-Knowledge
│   │   │   ├── layout.tsx                   # NEU — schmaler Auth-Frame (nur Logo + Theme)
│   │   │   ├── sign-in/
│   │   │   │   └── [[...rest]]/
│   │   │   │       └── page.tsx             # NEU — Clerk <SignIn />
│   │   │   └── sign-up/
│   │   │       └── [[...rest]]/
│   │   │           └── page.tsx             # NEU — Clerk <SignUp />
│   │   │
│   │   ├── (dashboard)/                           # NEU — geschützte App-/Dashboard-Routen
│   │   │   ├── AGENTS.md                    # NEU — dashboard-scope Agent-Regeln
│   │   │   ├── CLAUDE.md                    # NEU — dashboard-scope Architektur-Knowledge
│   │   │   ├── layout.tsx                   # NEU — Auth-Gate + Permission-Check (Server)
│   │   │   └── dashboard/
│   │   │       └── page.tsx                 # NEU — leerer Placeholder-Shell
│   │   │
│   │   ├── (landing)/                       # bestehend
│   │   ├── (legal)/                         # bestehend
│   │   └── layout.tsx                       # ÄNDERUNG — <ClerkProvider> ergänzen
│   │
│   └── api/                                 # bestehend (kein Eingriff)
│
├── components/
│   ├── auth/                                # NEU
│   │   └── auth-frame/                      # leichter Auth-Layout-Wrapper (Logo, Theme-Switch)
│   │       ├── auth-frame.tsx
│   │       └── auth-frame.module.css
│   ├── dashboard/                           # NEU — vorbereitend (heute nur Shell)
│   │   └── dashboard-shell/
│   │       ├── dashboard-shell.tsx          # leerer Placeholder mit i18n-Headline
│   │       └── dashboard-shell.module.css
│   └── providers/
│       └── app-providers.tsx                # ÄNDERUNG — <ClerkProvider> + locale-aware localization
│
├── lib/
│   └── auth/                                # NEU — server-only auth helpers
│       ├── allowlist.ts                     # parses DASHBOARD_ALLOWED_EMAILS, exports isEmailAllowed()
│       ├── allowlist.test.ts                # Unit-Tests für Parser/Normalisierung
│       ├── permissions.ts                   # requireDashboardAccess() — auth() + allowlist + redirect/notFound
│       └── routes.ts                        # Konstanten: SIGN_IN_PATH, DASHBOARD_PATH, AFTER_SIGN_IN_PATH (locale-aware)
│
├── i18n/
│   └── dictionaries/
│       ├── auth/                            # NEU
│       │   ├── de.json                      # Sign-in/Sign-up Frame-Texte (Headline, Sub-Copy, Brand-Claim)
│       │   ├── en.json
│       │   └── index.ts                     # getAuthContent(locale)
│       └── dashboard/                       # NEU
│           ├── meta/
│           │   ├── de.json                  # title, description (noindex impliziert)
│           │   └── en.json
│           ├── page/
│           │   ├── de.json                  # Placeholder-Headline, Sub-Copy
│           │   └── en.json
│           └── index.ts                     # getDashboardMetaContent(locale), getDashboardPageContent(locale)
│
├── proxy.ts                                 # ÄNDERUNG — Legacy-Redirects + clerkMiddleware()
└── ...

# Repo-Root
├── .env.example                             # OPTIONAL — falls angelegt: alle nicht-geheimen Variable-Namen + Beispielwerte
└── ARCHITECTURE-open-items.md               # nur falls Abweichungen entstehen
```

**Begründung der Struktur:**

- **`(auth)` Route Group**: Hält Sign-in/Sign-up-Routen im Tree zusammen, ohne den URL-Pfad zu beeinflussen. Eigenes `layout.tsx` für minimalen Frame ohne Marketing-Header.
- **`(dashboard)` Route Group**: Genau wie in der vorhandenen `CLAUDE.md` vorgesehen. `layout.tsx` der Group ist der zentrale Auth-Gate — alle künftigen Dashboard-Subroutes erben den Schutz automatisch.
- **`src/lib/auth/`**: Server-only Helpers, klar abgegrenzt von Client-Auth-Hooks (die kommen später bei Bedarf in `src/hooks/auth/`).
- **`src/components/dashboard/`**: Eigene Komponenten-Domain analog zu `marketing/`, `legal/`, `shared/`. Skaliert sauber, wenn später Sidebar/Widgets dazukommen.
- **AGENTS.md/CLAUDE.md auf `(auth)/` Ebene**: Greift für öffentliche Sign-in-/Sign-up-Routen, den Auth-Frame, Auth-Dictionaries, Clerk-UI, Redirects und auth-spezifische Skills.
- **AGENTS.md/CLAUDE.md auf `(dashboard)/` Ebene**: Greift für den gesamten geschützten Dashboard-Subtree (`dashboard/`, später `settings/`, etc.) und alle Allowlist-/Permission-Grenzen.

---

## 6. Dependency-Plan

**Installieren:**

- `@clerk/nextjs` — offizielles Next.js-15+/16 SDK (`ClerkProvider`, `<SignIn>`, `<SignUp>`, `<UserButton>`, `auth()`, `clerkMiddleware`)
- `@clerk/localizations` — UI-Strings für die Clerk-Komponenten; konkrete Locale-Objekte werden über ein typisiertes Locale-Mapping aufgelöst, nicht per binärem `de`/Fallback-Branch

**NICHT installieren:**

- `jsonwebtoken`, `jose` — keine eigene JWT-Logik
- `bcrypt`, `argon2` — kein Passwort-Hashing
- `iron-session`, `next-auth` — keine alternative Auth-Lösung
- `@clerk/themes` (vorerst) — Theming geht über `appearance`-Prop direkt; einbinden nur falls Standard-Themes nicht reichen

**Begründung:** Clerk übernimmt komplett Auth-State, Sessions, MFA, Passwort-Recovery. Eigene Crypto-/JWT-Pakete wären redundant und fehleranfällig.

---

## 7. ENV-Plan

**Neue ENV-Variablen:**

| Variable                                          | Wo gesetzt                                      | Zweck                                                |
| ------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`               | `.env.local`, Vercel (alle Envs)                | Client-side Clerk Init                               |
| `CLERK_SECRET_KEY`                                | `.env.local`, Vercel (alle Envs, **encrypted**) | Server-side Clerk                                    |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`                   | `.env.local`, Vercel                            | `/sign-in` (Locale-Prefix wird zur Laufzeit ergänzt) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`                   | `.env.local`, Vercel                            | `/sign-up`                                           |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `.env.local`, Vercel                            | `/dashboard`                                         |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `.env.local`, Vercel                            | `/dashboard`                                         |
| `DASHBOARD_ALLOWED_EMAILS`                        | `.env.local`, Vercel (alle Envs)                | Komma-Liste, Start: `moritz-hecht@gmx.net`           |

**`.env.example` (falls neu angelegt, vollständig, ohne Geheimnisse, im Repo committet):**

Wenn eine `.env.example` im Rahmen dieses Plans angelegt wird, darf sie nicht nur die neuen Clerk-/Dashboard-Variablen enthalten. Sie muss alle aktuell in den lokalen ENV-Dateien bekannten Key-Namen dokumentieren:

- `.env.local`
- `.env.development.local`
- `.env.preview.local`
- `.env.production.local`

Dabei werden nur Key-Namen und sichere Platzhalterwerte übernommen, niemals echte Secrets, Tokens, Mail-Adressen, Datenbank-URLs oder produktive Vercel-Werte. Neue Clerk-/Dashboard-Keys aus diesem Plan werden zusätzlich aufgenommen. Wenn ein Key nur von Vercel/Turbo automatisch gesetzt wird, wird er als automatisch/runtime-managed kommentiert.

```dotenv
# Clerk (https://dashboard.clerk.com → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# Dashboard Allowlist (Komma-getrennt, lowercase, ohne Whitespace)
DASHBOARD_ALLOWED_EMAILS=you@example.com

# Existing project keys from .env*.local files (placeholders only)
DATABASE_URL=postgresql://user:password@host:5432/database
CONTACT_MAIL_PROVIDER=resend
CONTACT_MAIL_FROM=Invessiv <noreply@example.com>
CONTACT_MAIL_TO=contact@example.com
RESEND_API_KEY=re_xxx
ENABLE_MARKETING_PROOF=false
NX_DAEMON=false
TURBO_CACHE=local
TURBO_DOWNLOAD_LOCAL_ENABLED=false
TURBO_REMOTE_ONLY=false
TURBO_RUN_SUMMARY=true

# Vercel/Turbo runtime-managed values; normally provided by the platform
VERCEL=1
VERCEL_ENV=development
VERCEL_TARGET_ENV=development
VERCEL_URL=example.vercel.app
VERCEL_OIDC_TOKEN=runtime-managed
VERCEL_GIT_PROVIDER=github
VERCEL_GIT_REPO_OWNER=example-owner
VERCEL_GIT_REPO_SLUG=example-repo
VERCEL_GIT_REPO_ID=runtime-managed
VERCEL_GIT_COMMIT_REF=main
VERCEL_GIT_COMMIT_SHA=runtime-managed
VERCEL_GIT_PREVIOUS_SHA=runtime-managed
VERCEL_GIT_COMMIT_MESSAGE=runtime-managed
VERCEL_GIT_COMMIT_AUTHOR_LOGIN=runtime-managed
VERCEL_GIT_COMMIT_AUTHOR_NAME=runtime-managed
VERCEL_GIT_PULL_REQUEST_ID=
```

**Sicherheit:**

- `.env.local` bleibt in `.gitignore` (bereits konfiguriert)
- `CLERK_SECRET_KEY` darf NIE in `NEXT_PUBLIC_*` enden
- `.env.example` enthält nur Platzhalter, niemals echte Keys
- Für Vercel: Variablen für **Production**, **Preview**, **Development** separat setzen (Test-Keys für Preview/Dev, Prod-Keys nur für Production)

---

## 8. Clerk-Architektur

### 8.1 `<ClerkProvider>` Einbindung

`src/components/providers/app-providers.tsx` wird ergänzt:

```tsx
// Pseudo-Code für den Plan — nicht zur Umsetzung in diesem Schritt
import { ClerkProvider } from "@clerk/nextjs";
import { deDE, enUS } from "@clerk/localizations";

const clerkLocalizations: Record<SupportedLocale, typeof deDE> = {
  de: deDE,
  en: enUS,
};

export function AppProviders({
  children,
  initialLocale,
  initialTheme,
}: {
  children: ReactNode;
  initialLocale: SupportedLocale;
  initialTheme: Theme;
}) {
  return (
    <ClerkProvider localization={clerkLocalizations[initialLocale]}>
      <ThemeProvider initialTheme={initialTheme}>
        <LanguageProvider initialLocale={initialLocale}>
          {children}
        </LanguageProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
```

`src/app/[locale]/layout.tsx` reicht `activeLocale` weiterhin als `initialLocale` an `<AppProviders>` weiter. Die bestehende `initialTheme`-API bleibt erhalten.

### 8.2 `proxy.ts` — Merge mit `clerkMiddleware`

Wichtig: **Next.js 16 nutzt `proxy.ts`**, Clerks aktuelle Doku zeigt häufig `middleware.ts`. Die Funktion ist API-kompatibel — wir wrappen den Default-Export weiterhin in `proxy`.

`src/proxy.ts` Struktur (nach Umsetzung):

```ts
// Pseudo-Code
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/:locale/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // 1) Legacy-Redirects (bestehend) zuerst
  const legacyRedirect = handleLegacyRedirects(req);
  if (legacyRedirect) return legacyRedirect;

  // 2) Auth-Schutz nur für Dashboard
  if (isProtectedRoute(req)) {
    await auth.protect(); // redirected zu Sign-in wenn nicht eingeloggt
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

**Wichtig**: `auth.protect()` deckt nur "nicht eingeloggt" ab. Die Allowlist-Prüfung passiert **zusätzlich** im Server-Layout (`(dashboard)/layout.tsx`) — siehe 8.3. Doppelter Check ist Absicht: Defense-in-Depth.

### 8.3 Server-side Permission Helper

`src/lib/auth/permissions.ts`:

```ts
// Pseudo-Code
import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { isEmailAllowed } from "./allowlist";
import { signInPathFor } from "./routes";

export async function requireDashboardAccess(locale: SupportedLocale) {
  const { userId } = await auth();
  if (!userId) redirect(signInPathFor(locale));

  const user = await currentUser();
  const primaryEmail = user?.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId,
  )?.emailAddress;

  if (!isEmailAllowed(primaryEmail)) notFound();

  return { userId, email: primaryEmail! };
}
```

Aufruf in `src/app/[locale]/(dashboard)/layout.tsx` — gilt damit für alle Dashboard-Subroutes.

### 8.4 Allowlist-Helper

`src/lib/auth/allowlist.ts`:

```ts
// Pseudo-Code
const raw = process.env.DASHBOARD_ALLOWED_EMAILS ?? "";
const allowed = new Set(
  raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowed.has(email.toLowerCase());
}
```

Wird **server-only** benutzt. Niemals in einem `"use client"`-File importieren (würde die ENV-Liste in Client-Bundle leaken). Sicherheits-Hinweis kommt in den AGENTS.md-Eintrag.

### 8.5 Spätere Erweiterung (vorbereiten, NICHT bauen)

- **Mehr Owner**: Komma-Liste in `DASHBOARD_ALLOWED_EMAILS` ergänzen → Vercel Redeploy → fertig.
- **Rollen** (z. B. `admin`, `viewer`): Migration auf Clerk `publicMetadata.role`. `permissions.ts` bekommt `requireRole(role)`-Variante. Schema im Dashboard-CLAUDE.md vorgemerkt.
- **DB-basierte ACL**: Wenn >5 User oder dynamische Permissions: Drizzle-Tabelle `dashboard_access` in `src/server/db/record-configuration/`. Erst dann nötig.

---

## 9. Routing-Plan

| Route                                     | Status     | Verhalten                                                    |
| ----------------------------------------- | ---------- | ------------------------------------------------------------ |
| `/[locale]` (Home)                        | öffentlich | unverändert                                                  |
| `/[locale]/landing/*`                     | öffentlich | unverändert                                                  |
| `/[locale]/imprint`, `/privacy`, `/terms` | öffentlich | unverändert                                                  |
| `/[locale]/sign-in`                       | öffentlich | Clerk `<SignIn />`, eigene Route mit catch-all `[[...rest]]` |
| `/[locale]/sign-up`                       | öffentlich | Clerk `<SignUp />`                                           |
| `/[locale]/dashboard`                     | geschützt  | Auth + Allowlist                                             |
| `/api/public/contact`                     | öffentlich | unverändert                                                  |

**Verhalten am `/[locale]/dashboard`-Endpoint:**

| User-Zustand                       | Reaktion                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| Nicht eingeloggt                   | `auth.protect()` in `proxy.ts` → Redirect zu `/[locale]/sign-in?redirect_url=/[locale]/dashboard` |
| Eingeloggt, **nicht** in Allowlist | `requireDashboardAccess()` in Layout → `notFound()` → HTTP 404                                    |
| Eingeloggt, in Allowlist           | Dashboard-Shell wird gerendert                                                                    |

**Locale-Handling**: Die Sign-in-URL wird locale-aware gebaut (`signInPathFor(locale)`). Clerks ENV-Vars enthalten den Pfad ohne Locale-Prefix (`/sign-in`); die Locale wird zur Laufzeit ergänzt. Damit funktioniert auch `/de/sign-in` und `/en/sign-in` korrekt.

**Redirect-Akzeptanzkriterien:**

- `/de/dashboard` ohne Login redirectet zu `/de/sign-in?redirect_url=%2Fde%2Fdashboard`.
- `/en/dashboard` ohne Login redirectet zu `/en/sign-in?redirect_url=%2Fen%2Fdashboard`.
- Nach erfolgreichem Login führt `redirect_url` zurück zur ursprünglichen Locale-Dashboard-URL.
- Fallback-Redirects aus Clerk-ENV dürfen nie auf nicht-lokalisierte `/dashboard`-URLs führen; App-Code ergänzt bei Bedarf den Locale-Prefix.
- Falls `auth.protect()` keinen locale-aware Redirect sauber unterstützt, wird in Ticket 5 ein custom Redirect in `proxy.ts` umgesetzt und die Entscheidung dokumentiert.

---

## 10. Navigations-Plan

**Entscheidung: Dashboard ist komplett versteckt.**

- **Kein Link** in `src/components/marketing/site-header/`
- **Kein Link** in Footer
- `src/config/navigation/home.ts` bleibt unverändert
- Kein `<UserButton>` im Header (wäre nur sichtbar wenn eingeloggt — aber wir haben für die Marketing-Site bewusst keine sichtbare Login-Funktion)

**Konsequenz:** Erreichbarkeit nur durch direktes Tippen von `/de/dashboard` oder Bookmark. Logout passiert auf der Dashboard-Seite selbst (in einem späteren Ticket via `<UserButton>` oder eigener Logout-Button — heute nicht im Scope).

**Wenn sich das später ändert** (z. B. UserButton im Header für eingeloggte User): `<SignedIn>` / `<SignedOut>` von `@clerk/nextjs` als Wrapper im Site-Header. Vorgesehen, nicht jetzt umgesetzt.

---

## 11. Dashboard-Shell-Plan

**`src/app/[locale]/(dashboard)/dashboard/page.tsx`** — leer im Sinne von "kein Inhalt", aber strukturell vollständig:

- Server Component
- `generateStaticParams()` für Locales (oder `dynamic = "force-dynamic"` — siehe unten)
- `generateMetadata()` mit `noindex: true` (`robots: { index: false, follow: false, nocache: true }`)
- `Cache-Control: no-store` über `export const dynamic = "force-dynamic"` und `export const revalidate = 0` — damit User-spezifische Server-Renders nie statisch gecached werden
- Rendert nur `<DashboardShell />`-Komponente mit Headline aus i18n-Dictionary

**`src/app/[locale]/(dashboard)/layout.tsx`**:

- Server Component
- Ruft `await requireDashboardAccess(locale)` auf — alle Auth-Logik zentral hier
- Rendert `{children}` (heute = Dashboard-Shell, später = Shell mit Sidebar)

**`src/components/dashboard/dashboard-shell/`** — leerer Placeholder:

- Headline aus Dict (z. B. "Invessiv Dashboard"), Sub-Copy "Bereich wird vorbereitet"
- Eigenes `*.module.css` mit minimalem Styling
- Server Component
- Bewusst KEINE Sidebar, KEINE Navigation, KEINE Widgets

**SEO/Crawler:**

- `metadata.robots = { index: false, follow: false }`
- `Cache-Control: no-store` (via `dynamic = "force-dynamic"`)
- Keine Verlinkung von außerhalb → praktisch nicht crawlable

**Auth-Seiten:**

- `/[locale]/sign-in` und `/[locale]/sign-up` setzen eigene Metadata.
- Auth-Seiten sind keine SEO-Landingpages und werden standardmäßig `robots: { index: false, follow: false }`.
- Canonicals werden nur gesetzt, wenn sie nicht im Konflikt mit `noindex` und Locale-Routing stehen.

---

## 12. AGENTS.md / CLAUDE.md Pfad

- `src/app/[locale]/(auth)/AGENTS.md` — gilt für öffentliche Auth-Routen, Auth-Frame, Auth-Dictionaries und Clerk-UI.
- `src/app/[locale]/(auth)/CLAUDE.md` — Architektur-Knowledge für den öffentlichen Auth-Bereich.
- `src/app/[locale]/(dashboard)/AGENTS.md` — gilt für den gesamten Dashboard-Subtree.
- `src/app/[locale]/(dashboard)/CLAUDE.md` — Architektur-Knowledge für den Dashboard.
- Root `AGENTS.md` und Root `CLAUDE.md` verweisen auf diese Scope-Dateien und erklären, wann sie zu lesen sind.

Die Detail-Inhalte der Dateien liegen in den jeweiligen Files selbst (in diesem Plan-Schritt bereits erstellt).

---

## 13. Implementierungs-Tickets (atomar)

### Ticket 1 — Recon & Plan

Status: erledigt durch diesen Plan, Auth-/Dashboard-Scope-Dateien und Root-Verweise:

- `src/app/[locale]/(auth)/AGENTS.md`
- `src/app/[locale]/(auth)/CLAUDE.md`
- `src/app/[locale]/(dashboard)/AGENTS.md`
- `src/app/[locale]/(dashboard)/CLAUDE.md`
- Root `AGENTS.md` und Root `CLAUDE.md` mit Scope-Index
- `src/app/CLAUDE.md` mit korrigierter Route-Group-Konvention für `(auth)` und `(dashboard)`

### Ticket 2 — Clerk Dependency + ENV vorbereiten

- `npm install @clerk/nextjs @clerk/localizations`
- Falls eine `.env.example` angelegt wird: vollständig mit allen Key-Namen aus Abschnitt 7, plus neuen Clerk-/Dashboard-Keys, nur mit Platzhalterwerten
- `.env.local` lokal mit Test-Keys aus Clerk Dashboard ergänzen (durch Owner)
- Vercel Production/Preview/Development ENV-Vars setzen (durch Owner)
- **Acceptance**: `npm run typecheck` grün, `.env.example` ist entweder vollständig committet oder die Entscheidung gegen eine Vorlage ist dokumentiert, lokal `.env.local` gesetzt.

### Ticket 3 — `<ClerkProvider>` integrieren

- `src/components/providers/app-providers.tsx` erweitern: `<ClerkProvider>` als äußerster Wrapper, `localization` über typisiertes `Record<SupportedLocale, ...>`-Mapping.
- Bestehende `AppProviders`-API beibehalten: `initialLocale` und `initialTheme` bleiben Props.
- `src/app/[locale]/layout.tsx`: `activeLocale` weiterhin als `initialLocale` an `<AppProviders>` durchreichen.
- **Acceptance**: App startet (`npm run dev`), keine Hydration-Warnings, Theme + Language weiterhin funktionsfähig.

### Ticket 4 — Auth-/Permission-Helper

- `src/lib/auth/allowlist.ts` + `allowlist.test.ts` (Vitest)
- `src/lib/auth/permissions.ts` (`requireDashboardAccess`)
- `src/lib/auth/routes.ts` (`signInPathFor(locale)`, `DASHBOARD_PATH`, etc.)
- **Acceptance**: `npm run test` grün, Unit-Tests decken Allowlist-Edge-Cases ab (leerer String, Whitespace, Mixed-Case, mehrere Einträge), Route-Helper (`signInPathFor`, `signUpPathFor`, `dashboardPathFor`) und `requireDashboardAccess()`-Pfade (unauthenticated redirect, missing email, denied email, allowed email).

### Ticket 5 — `proxy.ts` mit `clerkMiddleware` mergen

- `src/proxy.ts` umbauen: bestehende Legacy-Redirect-Logik in eine Helper-Funktion extrahieren, Default-Export wird `clerkMiddleware`. Matcher anpassen.
- **Acceptance**: Legacy-Redirects funktionieren weiter (e2e-Test bestehend bleibt grün), `/de/dashboard` ohne Login → Redirect zu `/de/sign-in?redirect_url=...`, `/en/dashboard` ohne Login → Redirect zu `/en/sign-in?redirect_url=...`, Post-login Redirect bleibt in derselben Locale, kein Fallback auf nicht-lokalisiertes `/dashboard`.

### Ticket 6 — Auth-Routen `(auth)/sign-in` und `(auth)/sign-up`

- `src/app/[locale]/(auth)/layout.tsx` (schmaler Frame mit Logo + Theme-Switch)
- `src/app/[locale]/(auth)/sign-in/[[...rest]]/page.tsx` mit Clerks `<SignIn />`
- `src/app/[locale]/(auth)/sign-up/[[...rest]]/page.tsx` mit Clerks `<SignUp />`
- `src/components/auth/auth-frame/auth-frame.tsx` (+ `.module.css`)
- `src/i18n/dictionaries/auth/{de,en}.json` + `index.ts` (für Frame-Texte; Clerk-internes UI kommt aus `@clerk/localizations`)
- **Acceptance**: `/de/sign-in` und `/en/sign-in` rendern Clerk-Form auf Deutsch bzw. Englisch, Auth-Seiten setzen `robots: { index: false, follow: false }`, Theme funktioniert, Direct-Sign-up via `/de/sign-up` möglich.

### Ticket 7 — Dashboard-Shell

- `src/app/[locale]/(dashboard)/layout.tsx` mit `requireDashboardAccess()`
- `src/app/[locale]/(dashboard)/dashboard/page.tsx` (`metadata` mit noindex, `dynamic = "force-dynamic"`, ruft `<DashboardShell />`)
- `src/components/dashboard/dashboard-shell/dashboard-shell.tsx` (+ `.module.css`) mit i18n-Headline
- `src/i18n/dictionaries/dashboard/meta/{de,en}.json` + `page/{de,en}.json` + `index.ts`
- **Acceptance**: Eingeloggter User mit Allowlist-Mail sieht Placeholder-Headline. Eingeloggter User ohne Allowlist sieht 404. Locale-Switch DE/EN funktioniert.

### Ticket 8 — Manuelle Tests

- Lokal mit Clerk-Test-Keys gegen die Szenarien aus Abschnitt 14.
- **Acceptance**: Alle Test-Szenarien dokumentiert bestanden.

### Ticket 9 — Cleanup + Review

- `npm run lint`, `npm run typecheck`, `npm run build` grün
- README-/CLAUDE.md-Eintrag im Root mit kurzem Hinweis auf Auth- und Dashboard-Scope-Dateien, falls durch Ticket 1 noch nicht ausreichend vorhanden
- Falls Architektur-Abweichungen entstanden: `ARCHITECTURE-open-items.md` Eintrag
- **Acceptance**: Pre-merge gates grün, Doku-Hinweis ergänzt.

---

## 14. Testplan

### Manuelle Test-Szenarien (lokal mit Test-Clerk-Account)

| #   | Szenario                                                       | Erwartetes Verhalten                                                                |
| --- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | Nicht eingeloggt → `/de/dashboard` aufrufen                    | Redirect zu `/de/sign-in?redirect_url=%2Fde%2Fdashboard`                            |
| 2   | Mit Test-User (nicht in Allowlist) einloggen → `/de/dashboard` | Nach Login: HTTP 404 (`notFound()`)                                                 |
| 3   | Mit `moritz-hecht@gmx.net` einloggen → `/de/dashboard`         | Dashboard-Placeholder-Headline auf Deutsch sichtbar                                 |
| 4   | Mit Owner einloggen → `/en/dashboard`                          | Placeholder auf Englisch                                                            |
| 5   | `/de` öffnen, Header anschauen                                 | KEIN Dashboard-Link sichtbar (egal ob eingeloggt)                                   |
| 6   | `/de/sign-in` direkt aufrufen                                  | Clerk-Form auf Deutsch, Theme funktioniert                                          |
| 7   | `/en/sign-in` direkt aufrufen                                  | Clerk-Form auf Englisch                                                             |
| 8   | Legacy `/imprint` (ohne Locale)                                | Weiterhin Redirect zu `/de/imprint` (bestehende Logik intakt)                       |
| 9   | DevTools Network-Tab auf `/de/dashboard`                       | Response-Header `Cache-Control: no-store` (oder gleichwertig durch Next.js dynamic) |
| 10  | View-Source auf `/de/dashboard`                                | Meta `<meta name="robots" content="noindex,nofollow">`                              |

### Automatisierte Gates

- `npm run lint` → grün
- `npm run typecheck` → grün
- `npm run test` → grün (inkl. neue `allowlist.test.ts`)
- `npm run test:e2e` → bestehende Tests bleiben grün (kein neuer e2e-Test in diesem Ticket)
- `npm run build` → grün, keine Warnings zu Static Generation der Dashboard-Page

### Vercel-ENV-Check (nach Deploy)

- Preview-Deployment einer feature-branch öffnen
- `/de/dashboard` ohne Login → Redirect zur Sign-in
- Login mit Owner-Mail → Placeholder sichtbar
- Logs prüfen: keine Errors zu fehlenden ENV-Vars

---

## 15. Risiken & offene Entscheidungen

| Risiko                                                                      | Schwere | Mitigation                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.ts` vs `middleware.ts` — Clerk-Doku zeigt häufig nur `middleware.ts` | mittel  | Vor Implementierung Clerk-Docs auf Next.js 16 + `proxy.ts`-Kompatibilität verifizieren (via context7 MCP). API ist identisch, Datei-Name ist der Unterschied. Falls Clerk-CLI/Examples auf `middleware.ts` insistieren: manuell auf `proxy.ts` mappen + ARCHITECTURE-open-items.md-Eintrag.                                                                               |
| `auth.protect()` Default-Redirect-Locale                                    | mittel  | Clerks `auth.protect()` redirected zu `NEXT_PUBLIC_CLERK_SIGN_IN_URL`. Wenn das ohne Locale-Prefix steht, landet man auf `/sign-in` (keine Locale). Lösung: in `proxy.ts` Locale aus `req.url` extrahieren und via custom redirect statt `auth.protect()` arbeiten — falls `auth.protect()` keinen Custom-Redirect-Pfad akzeptiert. Klärung im Implementierungs-Ticket 5. |
| Static Generation für Dashboard                                             | niedrig | `dynamic = "force-dynamic"` setzt das aus, Build sollte bei generateStaticParams nicht versuchen die geschützte Seite zu rendern (Clerk wirft auf Build-Time keinen User). Verifizieren in Ticket 7.                                                                                                                                                                      |
| Clerk DE-Lokalisierung deckt nicht alles ab                                 | niedrig | `@clerk/localizations` deckt Standard-Strings; eigene Frame-Texte (Headline, Brand) liegen in `src/i18n/dictionaries/auth/`. Wenn Clerk-Strings hässlich sind: `appearance` + custom labels in einem späteren Ticket.                                                                                                                                                     |
| ENV nicht gesetzt → Build-Fehler                                            | niedrig | `@clerk/nextjs` wirft sprechende Fehler. `.env.example` als Referenz. Owner setzt ENV-Werte selbst.                                                                                                                                                                                                                                                                       |
| Owner-Mail Tippfehler in ENV                                                | mittel  | Allowlist normalisiert lower-case + trim. Trotzdem: nach Deploy unbedingt Test-Szenario 3 durchspielen.                                                                                                                                                                                                                                                                   |

### Strukturentscheidungen, die später teuer wären

- **Falsches Route-Group-Naming** (`(dashboard)` vs. `(app)` vs. `(private)`) → wir bleiben bei `(dashboard)` (Owner-Entscheidung). `src/app/CLAUDE.md` ist im Rahmen von Ticket 1 auf `(auth)` und `(dashboard)` korrigiert.
- **Auth in `proxy.ts` vs. nur in Layout** → wir machen beides (Defense-in-Depth). Wenn später nur Layout: bleibt rückwärtskompatibel.
- **Allowlist in `lib/auth/` vs. `server/auth/`** → `lib/auth/` weil das Modul reines Helper-/Utility-Land ist (keine DB-/Service-Aufrufe). Falls später Persistierung kommt: dann nach `src/server/auth/`.

---

## 16. Nicht-blockierende Defaults vor Umsetzung

Alle wesentlichen Architektur-Entscheidungen sind geklärt. Die folgenden Defaults gelten, bis der Nutzer ausdrücklich etwas anderes sagt:

1. **Sign-up bleibt öffentlich erreichbar.** `/[locale]/sign-up` wird umgesetzt. Nutzer ohne Allowlist-Match werden nach Login beim Dashboard-Zugriff weiterhin per 404 abgefangen. Falls strikteres Onboarding gewünscht ist, wird Sign-up im Clerk Dashboard deaktiviert; möglichst ohne Code-Änderung.

2. **Clerk Default-Light reicht zunächst.** Kein `appearance`-Prop in diesem Ticket. Theme-Anpassung wird in den Scope-Dateien als spätere Erweiterung notiert.
