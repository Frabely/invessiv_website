# AGENTS.md - Workspace / CRM-Bereich

Diese Datei gilt für `src/app/[locale]/workspace/` und alle Subroutes darunter. Sie ergänzt die Repo-Root `AGENTS.md` und `src/app/AGENTS.md`. Engere Regeln in tieferen Ordnern haben Vorrang.

## Codex-Arbeitsweise

- Bestehende Workspace-Architektur zuerst lesen und respektieren; im Zweifel feinjustieren statt neu erfinden.
- Keine vorhandene Auth-, i18n-, SEO-/Caching- oder Sicherheitslogik entfernen, nur weil ein neuer Weg einfacher wirkt.
- Änderungen klein und reviewbar halten: erst Scope, Abhängigkeiten und Risiken klären, dann gezielt implementieren.
- Bei Unsicherheit über Security, Auth, Caching oder Datenzugriff stoppen und den Nutzer fragen, bevor produktive Schutzmechanismen abgeschwächt werden.
- Wenn eine Architekturregel nicht sofort eingehalten werden kann, die konkrete Stelle mit Pfad, Regelbezug, Risiko und
  nächstem Schritt dokumentieren.

## Status und Zweck

- Status: Workspace-Skelett. Auth-Setup und leere Shell sind im Implementierungsplan `plans/workspace/clerk-auth-and-workspace-shell.md` beschrieben.
- Zweck: privater, allowlist-geschützter Bereich für administrative oder interne Funktionen.
- Phase 1: nur Owner-Zugriff.
- Phase 2: kleine Gruppe berechtigter Nutzer.
- Später: erweiterbar zu Rollen- und Permission-Modell.

## Mandatorische Regeln

1. **Auth ist nicht optional.** Jede Route unter `workspace/` muss durch das gemeinsame `layout.tsx` gehen. Dieses Layout muss `requireWorkspaceAccess(locale)` aus `@/lib/auth/permissions` aufrufen. Keine page-level-only Auth ohne Layout-Gate.

2. **Kein Eigenbau-Auth.** Keine eigene JWT-Logik, keine eigenen Sessions, keine Passwort-Hashes, keine eigenen Login- oder Register-Endpoints. Auth läuft über Clerk (`@clerk/nextjs`).

3. **Server-only Auth-Helpers.** Alles unter `src/lib/auth/` ist serverseitig zu behandeln. Nie in `"use client"`-Dateien importieren, weil server-only Daten wie `WORKSPACE_ALLOWED_EMAILS` sonst ins Client-Bundle geraten könnten. Für Client-Userdaten Clerks `useUser()`, `useAuth()` oder `<UserButton>` verwenden.

4. **Defense-in-Depth bleibt aktiv.** Es gibt zwei Schutz-Layer, die beide erhalten bleiben:
   - Layer 1 Edge: `src/proxy.ts` nutzt `clerkMiddleware`, `createRouteMatcher` und `auth.protect()` für `/(de|en)/workspace(.*)`.
   - Layer 2 Server Component: `workspace/layout.tsx` ruft `requireWorkspaceAccess(locale)` auf, prüft Auth-State und Allowlist und gibt für eingeloggte, nicht berechtigte User `notFound()` zurück.

5. **Allowlist nur via ENV.** Erlaubte E-Mail-Adressen stehen ausschließlich in `WORKSPACE_ALLOWED_EMAILS` als kommagetrennte Liste. Parsing erfolgt lowercase und trim über `src/lib/auth/allowlist.ts`. Keine Hardcodings, keine inline-Listen in Pages oder Komponenten.

6. **i18n ist Pflicht.** Alle sprachabhängigen Workspace-Texte liegen in `src/i18n/dictionaries/workspace/`. Keine inline-Strings in `.tsx`, keine binären `locale === "de" ? ... : ...`-Branches. Diese Regel gilt auch für localeabhängige Provider-/Framework-Konfigurationen wie Clerk-Localizations; dafür zentrale `Record<SupportedLocale, ...>`-Mappings nutzen. DE und EN werden immer parallel gepflegt.

7. **Private Seiten sind noindex und dynamisch.** Jede Page unter `workspace/` muss `metadata.robots = { index: false, follow: false, nocache: true }` setzen und Static Generation verhindern, z. B. mit `export const dynamic = "force-dynamic"` oder gleichwertigem Mechanismus.

8. **Workspace-Komponenten bleiben fachlich getrennt.** Workspace-spezifische Komponenten gehören nach `src/components/workspace/<component-name>/<component-name>.tsx` und bei relevantem Styling in ein lokales `*.module.css`. Server Components sind Default; `"use client"` nur bei echter Interaktivität.

9. **Permissions zentralisieren.** Erweiterte Rechte, Rollen oder Zugriffsstufen werden über zentrale Helper in `src/lib/auth/permissions.ts` modelliert, z. B. `requireRole("admin")`, gespeist aus Clerk `publicMetadata`. Keine verstreuten Claims-Prüfungen in Pages.

10. **Public Navigation nicht nebenbei ändern.** Marketing-Header und Footer bleiben unberührt. Der Workspace wird nicht automatisch in der Public-Nav verlinkt. Änderungen daran brauchen einen bewussten Plan.

11. **Tests gehören zum Schutzmodell.** Auth-Logik wie `allowlist.ts` und `permissions.ts` braucht Unit-Tests. Neue kritische Workspace-Flows brauchen passende E2E- oder Integrationstests, sobald echte Inhalte oder Workflows existieren.

12. **Keine fachfremden Routen.** Marketing-Pages gehören nach `(landing)/`, Legal-Pages nach `(legal)/`, öffentliche API-Routen nach `src/app/api/public/`, Auth-Form-Routen nach `(auth)/`.

## Auth-Stack

- Provider: Clerk über `@clerk/nextjs`.
- Localization: `@clerk/localizations`, locale-aware im `<ClerkProvider>` über ein typisiertes Locale-Mapping.
- Storage: keine eigene Session-Tabelle und keine eigenen Cookies; Clerk-managed.
- Eigene Auth-Logik: nicht vorgesehen.

## Schutz-Layer im Detail

### Layer 1 - Edge / `proxy.ts`

`src/proxy.ts` nutzt `clerkMiddleware` und `createRouteMatcher`. Das Pattern `"/(de|en)/workspace(.*)"` ruft `auth.protect()` auf:

- Eingeloggt: Request läuft weiter.
- Nicht eingeloggt: Redirect zu `/[locale]/sign-in?redirect_url=...`.

Legacy-Redirects wie `/` nach `/de` oder `/imprint` nach `/de/imprint` laufen vor dem Auth-Check in derselben Middleware.

### Layer 2 - Server Component / `workspace/layout.tsx`

```txt
src/app/[locale]/workspace/layout.tsx
  -> await requireWorkspaceAccess(locale)
       -> auth() -> falls kein userId: redirect(signInPathFor(locale))
       -> currentUser() -> primary email
       -> isEmailAllowed(email) -> falls false: notFound()
```

Layer 2 fängt Fälle ab, die Layer 1 nicht vollständig abdecken kann:

- Eingeloggter User steht nicht auf der Allowlist: 404.
- Race Conditions zwischen Edge-Cache und Auth-State.

## Allowlist-Erweiterung

- Mehr E-Mail-Adressen: `WORKSPACE_ALLOWED_EMAILS` in Vercel ergänzen und redeployen.
- Mehr Strenge, z. B. Domain- oder Pattern-Regeln: `src/lib/auth/allowlist.ts` erweitern und Tests ergänzen.
- DB-basierte ACL erst ab mehr als 5 berechtigten Usern oder dynamischen Berechtigungen einführen. Dann nach
  `src/server/auth/` migrieren und DB-Modelle kanonisch unter `packages/db/src/record-configuration/` pflegen.

## Routing-Konvention

| Bereich     | Pfad                                                        | Zweck               | Geschützt? |
| ----------- | ----------------------------------------------------------- | ------------------- | ---------- |
| `(landing)` | `/[locale]`, `/[locale]/landing/*`                          | Marketing           | nein       |
| `(legal)`   | `/[locale]/imprint`, `/[locale]/privacy`, `/[locale]/terms` | Legal               | nein       |
| `(auth)`    | `/[locale]/sign-in`, `/[locale]/sign-up`                    | Clerk-Forms         | nein       |
| `workspace` | `/[locale]/workspace`, später mehr                          | Geschützter Bereich | ja         |

Alles unter `workspace/` ist geschützt. Sign-in und Sign-up unter `(auth)/` sind öffentlich. `workspace` ist ein echtes URL-Segment; `(auth)` bleibt eine pfadlose Route-Group.

## i18n-Struktur

Workspace-Content folgt dem Muster:

```txt
src/i18n/dictionaries/workspace/
  meta/
    de.json
    en.json
  page/
    de.json
    en.json
  index.ts
```

`index.ts` stellt typisierte Loader wie `getWorkspaceMetaContent(locale)` und `getWorkspacePageContent(locale)` bereit. `src/i18n/get-dictionary.ts` lädt Workspace-Sections nach Bedarf. Komponenten konsumieren vorbereitete Inhalte und enthalten keine sprachabhängige Rest-Copy.

## SEO und Caching

- Workspace-Pages sind private App-Seiten, keine SEO-Landingpages.
- `robots` muss auf `index: false`, `follow: false`, `nocache: true` stehen.
- Pages müssen dynamisch gerendert werden, damit user-spezifische Server-Renders nie statisch gecached werden.
- Keine externen Links auf Workspace-Seiten und keine Sitemap-Einträge für Workspace-Routen.

## Workflow für neue Workspace-Features

1. Plan in `plans/workspace/<feature-name>.md` schreiben oder bestehenden Plan aktualisieren.
2. Dictionaries unter `src/i18n/dictionaries/workspace/<section>/` für DE und EN im selben Commit anlegen.
3. UI unter `src/components/workspace/<component-name>/<component-name>.tsx` bauen, mit getrenntem Styling und typisierten Props.
4. Page unter `workspace/<route>/page.tsx` dünn halten: orchestrieren, Content laden, Komponenten zusammensetzen.
5. Auth über das gemeinsame `workspace/layout.tsx` nutzen. Zusätzliche Rechte zentral über Permission-Helper prüfen.
6. Tests ergänzen: Unit für Auth-/Permission-Logik, E2E oder Integration für kritische Workflows.
7. Vor Merge mindestens `npm run lint`, `npm run typecheck` und `npm run build` grün halten.

## Geplante Erweiterungen

| Feature                           | Trigger                                                 | Ort                                                                                               |
| --------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Sidebar / Workspace-Navigation    | Sobald mehr als 1 Workspace-Page existiert              | `workspace/layout.tsx`                                                                            |
| `<UserButton>` im Site-Header     | Sobald Login öffentlich beworben wird                   | `src/components/marketing/site-header/` mit `<SignedIn>`-Wrapper                                  |
| Rollen-System (`admin`, `viewer`) | Sobald Allowlist-User unterschiedliche Rechte brauchen  | Clerk `publicMetadata.role` und `requireRole()`-Helper                                            |
| DB-basierte ACL                   | Mehr als 5 berechtigte User oder dynamische Permissions | Drizzle-Tabelle unter `packages/db/src/record-configuration/` und Helper unter `src/server/auth/` |
| E2E-Test Login-Flow               | Sobald Workspace-Inhalte existieren                     | `e2e/workspace-auth.e2e.ts`                                                                       |
| Custom Clerk Theme                | Falls Default-Light nicht zum Brand passt               | `appearance`-Prop in `<ClerkProvider>`                                                            |

## Kritische Dateien

| Pfad                                                   | Zweck                                                    |
| ------------------------------------------------------ | -------------------------------------------------------- |
| `src/proxy.ts`                                         | Legacy-Redirects und Clerk-Middleware (Layer 1)          |
| `src/app/[locale]/workspace/layout.tsx`                | Workspace Auth-Gate (Layer 2)                            |
| `src/app/[locale]/workspace/page.tsx`                  | Workspace-Shell                                          |
| `src/app/[locale]/(auth)/sign-in/[[...rest]]/page.tsx` | Clerk Sign-in                                            |
| `src/app/[locale]/(auth)/sign-up/[[...rest]]/page.tsx` | Clerk Sign-up                                            |
| `src/lib/auth/allowlist.ts`                            | ENV-Parser und `isEmailAllowed()`                        |
| `src/lib/auth/permissions.ts`                          | `requireWorkspaceAccess()` und spätere Permission-Helper |
| `src/lib/auth/routes.ts`                               | Locale-aware Auth-URLs                                   |
| `src/components/providers/app-providers.tsx`           | `<ClerkProvider>`-Einbindung                             |
| `src/i18n/dictionaries/workspace/`                     | Workspace-Texte                                          |
| `src/i18n/dictionaries/auth/`                          | Sign-in-/Sign-up-Frame-Texte                             |

## Sicherheits-Reminder

- `CLERK_SECRET_KEY` bleibt server-only und darf nie zu `NEXT_PUBLIC_*` werden.
- Neue ENV-Variablen sind server-only, außer es gibt einen zwingenden Client-Grund.
- Keine User-E-Mails oder Clerk-User-IDs in Logs schreiben, außer in einem explizit geplanten Audit-Trail.
- Auth-Checks nicht aus Performance-Gründen cachen, überspringen oder clientseitig ersetzen.
- User-spezifische Daten nie über statische Builds, öffentliche JSON-Dateien oder Client-Bundles ausliefern.

## Was hier nicht hingehört

- Marketing-Pages wie Hero, Pricing, FAQ oder Landing-Sections.
- Legal-Pages wie Impressum, Datenschutz, Terms.
- Öffentliche API-Routen.
- Eigene Login-, Register- oder Session-Endpoints.
- Business- oder Datenbanklogik, die nach `src/server/` gehört.

## Verweise

- Repo-Root `AGENTS.md`: globale Branding-, Security-, SEO-, i18n- und Qualitätsregeln.
- Repo-Root `CLAUDE.md`: bisherige Architekturhinweise, soweit noch vorhanden.
- `src/app/AGENTS.md`: App-Router-Konventionen.
- `src/components/AGENTS.md`: Komponenten-Konventionen.
- `src/i18n/AGENTS.md`: Dictionary-Regeln.
- Implementierungsplan: `plans/workspace/clerk-auth-and-workspace-shell.md`.
