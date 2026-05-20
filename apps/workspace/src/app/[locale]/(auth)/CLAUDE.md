# CLAUDE - Auth / `(auth)` Route Group

Architektur-Wissen für den öffentlichen Auth-Bereich der Invessiv-Website. Diese Datei ergänzt die Repo-Root
`CLAUDE.md`, `src/app/CLAUDE.md` und den Workspace-Plan `plans/workspace/clerk-auth-and-workspace-shell.md`. Sie gilt
für alle Routen unter `src/app/[locale]/(auth)/`.

> **Status:** Geplant im Rahmen des Clerk-Auth- und Workspace-Shell-Plans. `(auth)` ist die öffentliche Route-Group für
> Clerk Sign-in und Sign-up, nicht der geschützte App-Bereich.

## Zweck

`(auth)` stellt locale-aware Auth-Einstiege bereit:

- `/[locale]/sign-in`
- `/[locale]/sign-up`

Die Seiten rendern Clerk-Komponenten in einem schlanken Invessiv-Frame. Sie sind bewusst vom Workspace getrennt: Login
und Registrierung sind öffentlich, Workspace-Zugriff wird erst in `workspace` geprüft.

## Auth-Stack

- **Provider:** Clerk via `@clerk/nextjs`
- **Form-Komponenten:** `<SignIn />` und `<SignUp />`
- **Lokalisierung:** `@clerk/localizations`, gesetzt im zentralen `<ClerkProvider>` über ein typisiertes Locale-Mapping
- **Routing:** locale-aware über `[locale]`
- **Eigene Auth-Logik:** keine JWTs, keine eigenen Sessions, keine Passwort-Hashes, keine Login-Endpoints

## Abgrenzung zu `workspace`

| Route-Group | Pfad                                     | Zweck                        | Zugriff                 |
| ----------- | ---------------------------------------- | ---------------------------- | ----------------------- |
| `(auth)`    | `/[locale]/sign-in`, `/[locale]/sign-up` | Öffentliche Clerk-Forms      | öffentlich              |
| `workspace` | `/[locale]`                              | Geschützter interner Bereich | Clerk-Login + Allowlist |

`(auth)` prüft nicht, ob ein User auf der Workspace-Allowlist steht. Diese Prüfung bleibt in
`src/lib/auth/permissions.ts` und im `workspace/layout.tsx`.

## Erwartete Dateien

```txt
src/app/[locale]/(auth)/
  AGENTS.md
  CLAUDE.md
  layout.tsx
  sign-in/
    [[...rest]]/
      page.tsx
  sign-up/
    [[...rest]]/
      page.tsx
```

Begleitende Komponenten und Inhalte:

```txt
src/components/auth/auth-frame/
  auth-frame.tsx
  auth-frame.module.css

src/i18n/dictionaries/auth/
  de.json
  en.json
  index.ts
```

## Layout-Konvention

`(auth)/layout.tsx` ist ein schmaler Auth-Frame:

- kein Marketing-Header
- kein Marketing-Footer
- keine Public Navigation
- Logo/Brand-Signal erlaubt
- Theme-kompatibel, aber ohne unnötige Interaktion
- `{children}` rendert Clerk-Formulare

Der Frame gehört als wiederverwendbare Komponente nach `src/components/auth/auth-frame/`. Page-Dateien bleiben dünn und
orchestrieren nur.

## i18n

Auth-spezifische Frame-Texte liegen in:

```txt
src/i18n/dictionaries/auth/
  de.json
  en.json
  index.ts
```

Typische Inhalte:

- Metadata Title/Description
- Frame-Headline
- kurze Subcopy
- Brand-/Trust-Hinweis
- Labels für sichtbare eigene UI, falls vorhanden

Clerk-interne UI-Strings werden über `@clerk/localizations` bereitgestellt. Eigene deutsche und englische Texte müssen
immer parallel gepflegt werden.

Keine locale-basierten Inline-Branches in Pages, Komponenten, Provider-Konfigurationen oder Lib-Code. Auch wenn aktuell
nur DE/EN vorgesehen sind, wird immer so modelliert, als könnten weitere Sprachen folgen. Muster wie
`locale === "de" ? deDE : enUS` sind nicht zulässig; stattdessen zentrale Lookup-Strukturen wie
`Record<SupportedLocale, ClerkLocalization>` nutzen.

## Redirects und Pfade

Locale-aware Auth-Pfade sollen zentral über `src/lib/auth/routes.ts` erzeugt werden:

- `signInPathFor(locale)`
- `signUpPathFor(locale)`
- `workspacePathFor(locale)`

Clerk-ENV-Werte wie `NEXT_PUBLIC_CLERK_SIGN_IN_URL` und `NEXT_PUBLIC_CLERK_SIGN_UP_URL` können pfadneutral ohne
Locale-Prefix bleiben. Locale-spezifische Redirects werden in App-Code oder Proxy-Logik sauber ergänzt.

## Security-Hinweise

- `CLERK_SECRET_KEY` ist server-only.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` ist öffentlich und darf im Client verwendet werden.
- `WORKSPACE_ALLOWED_EMAILS` gehört nicht in `(auth)` und darf nie ins Client-Bundle gelangen.
- Keine User-E-Mails oder Clerk-IDs in normalen Logs ausgeben.
- Keine Auth-Checks clientseitig als Sicherheitsgrenze verwenden.

## SEO und Indexierung

Auth-Seiten sind keine Landingpages. Metadata soll eindeutig sein, aber nicht auf organische Suche optimiert werden.
Falls Auth-Seiten nicht indexiert werden sollen, `robots` bewusst in der jeweiligen Page-Metadata setzen und im Plan
festhalten.

## Skills für Claude und Codex

| Skill                             |               Priorität | Einsatz                                                        |
| --------------------------------- | ----------------------: | -------------------------------------------------------------- |
| `best-practices`                  |                required | Clerk-Konfiguration, ENV-Grenzen, Redirects, Secret-Schutz     |
| `frontend-design`                 |         required bei UI | Auth-Frame, visuelle Konsistenz, responsive Umsetzung          |
| `copywriting`                     |     required bei Texten | Auth-Frame-Copy, Metadata, Trust-/Hinweis-Texte in DE/EN       |
| `accessibility`                   | required bei UI-Abnahme | Fokus, Keyboard-Nutzung, Kontrast, Labels, Form-Zugänglichkeit |
| `ux-design`                       |                sinnvoll | Verständliche Login-/Sign-up-Journey und Redirect-Zustände     |
| `performance` / `core-web-vitals` |                sinnvoll | Minimales JS/CSS, keine unnötigen Rendering-Blocker            |
| `seo`                             |                sinnvoll | Bewusste Metadata-/Robots-Entscheidungen                       |

## Geplante Erweiterungen

| Feature                 | Trigger                                                 | Ort                                                                    |
| ----------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Custom Clerk Appearance | Wenn Default-Light nicht zum Brand passt                | `<ClerkProvider appearance={...}>` oder lokale Auth-Page-Konfiguration |
| Sign-up deaktivieren    | Wenn Registrierung nur manuell über Clerk erfolgen soll | Clerk Dashboard, möglichst ohne Code-Änderung                          |
| UserButton im Header    | Wenn Login öffentlich sichtbar werden soll              | `src/components/marketing/site-header/` mit `<SignedIn>`-Wrapper       |
| Auth E2E-Smoke          | Sobald Auth-Flows stabil umgesetzt sind                 | `e2e/auth.e2e.ts` oder workspace-auth E2E                              |

## Was hier nicht hingehört

- Workspace-Content, Sidebar, Widgets oder interne Admin-Funktionen.
- Allowlist- oder Rollenlogik in Pages.
- Public API Routes.
- Marketing-, Legal- oder Pricing-Seiten.
- Eigene Auth-Endpoints.
