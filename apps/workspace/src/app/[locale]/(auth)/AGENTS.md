# AGENTS.md - Auth / `(auth)` Route Group

Diese Datei gilt für `apps/workspace/src/app/[locale]/(auth)/` und alle Subroutes darunter. Sie ergänzt die Repo-Root
`AGENTS.md`. Ziel ist ein sauberer, öffentlicher Auth-Bereich für Clerk-Formulare, getrennt vom geschützten Workspace.

## Codex-Arbeitsweise

- Bestehende Auth-Architektur zuerst lesen: `apps/workspace/src/app/[locale]/(auth)/CLAUDE.md`.
- Standardmäßig nur ein Ticket oder einen klar abgegrenzten Schritt bearbeiten, sofern der Nutzer nicht ausdrücklich
  mehr beauftragt.
- Keine eigene Auth-Logik einführen. Clerk bleibt die einzige Auth-Quelle.
- Sichtbare Texte und localeabhängige Konfigurationen immer über Dictionaries oder typisierte Locale-Mappings pflegen;
  keine binären `de`/Fallback-Branches.
- Bei Security-, Redirect-, ENV- oder Caching-Unsicherheit stoppen und den Nutzer fragen.

## Zweck

`(auth)` enthält öffentliche Auth-Routen mit Clerk-Komponenten:

- `/[locale]/sign-in`
- `/[locale]/sign-up`

Diese Route-Group ist öffentlich erreichbar, aber fachlich klar von `workspace` getrennt. Sie dient nur dem
Login-/Registrierungs-Frame und darf keine geschützten Workspace-Inhalte enthalten.

## Mandatorische Regeln

1. **Clerk-only Auth.** Keine eigenen Login-, Register-, Session-, JWT- oder Passwort-Endpunkte. Sign-in und Sign-up
   laufen über `@clerk/nextjs`.

2. **Öffentlich, aber minimal.** Auth-Routen sind öffentlich zugänglich. Sie bekommen keinen Marketing-Header, keine
   Footer-Navigation und keine ablenkenden Landing-Sections.

3. **Keine Workspace-Berechtigungen hier prüfen.** Allowlist- und Role-Checks gehören nach
   `apps/workspace/src/lib/auth/permissions.ts` und ins `workspace`-Layout. `(auth)` rendert nur den Auth-Einstieg.

4. **Locale-aware Routing.** Routen liegen unter `[locale]`. Redirects und Fallback-URLs müssen locale-aware gebaut
   werden, z. B. über Helper aus `apps/workspace/src/lib/auth/routes.ts`.

5. **i18n-Pflicht.** Frame-Texte, Headlines, Hinweise, Metadata und Microcopy kommen aus
   `apps/workspace/src/i18n/dictionaries/auth/`. Keine inline-Texte in `page.tsx`, Layouts oder Auth-Frame-Komponenten.

6. **Keine binären Locale-Branches.** Auch wenn aktuell nur DE/EN vorgesehen sind, wird immer so modelliert, als
   könnten weitere Sprachen folgen. Verboten sind Muster wie `locale === "de" ? deDE : enUS`. Erlaubt sind zentrale
   Lookup-Strukturen wie `Record<SupportedLocale, ClerkLocalization>`.

7. **Clerk-Lokalisierung nutzen.** Clerk-interne UI-Strings kommen über `@clerk/localizations` im zentralen
   `<ClerkProvider>` und werden über ein typisiertes Locale-Mapping aufgelöst.

8. **Komponenten-Konvention.** Auth-spezifische UI gehört nach
   `apps/workspace/src/components/auth/<component-name>/<component-name>.tsx` mit lokalem `*.module.css`, falls
   Styling relevant ist.

9. **Server Components als Default.** Pages und Layouts bleiben Server Components, außer eine lokale Interaktion
   erzwingt `"use client"`. Clerk-Komponenten dürfen gemäß SDK-Anforderung verwendet werden.

10. **Keine Secrets im Client.** `CLERK_SECRET_KEY`, Allowlist-ENV und server-only Auth-Helper niemals in Client
    Components importieren. `NEXT_PUBLIC_*` nur für tatsächlich öffentliche Clerk-Client-Konfiguration verwenden.

11. **Public Nav nicht nebenbei ändern.** Auth-Routen werden nicht automatisch im Marketing-Header oder Footer
    verlinkt. Änderungen daran brauchen eine explizite Entscheidung.

12. **Metadata sauber halten.** Auth-Seiten brauchen eigene Metadata. Sie sollen nicht als SEO-Landingpages behandelt
    werden; falls Indexierung unerwünscht ist, `robots` bewusst setzen und im Plan dokumentieren.

13. **Tests passend zum Risiko.** Auth-Frame-UI braucht mindestens Rendering-/Interaction-Smokes, wenn eigene
    Interaktion dazukommt. Redirect-/Route-Helper gehören in Unit-Tests.

## Skills für Arbeiten in `(auth)`

| Skill             |           Priorität | Wann nutzen                                         | Grund                                                                      |
| ----------------- | ------------------: | --------------------------------------------------- | -------------------------------------------------------------------------- |
| `frontend-design` |     required bei UI | Auth-Frame, Layout, Responsiveness, Theme-Anmutung  | Sichtbare Auth-Flows müssen konsistent, ruhig und conversion-tauglich sein |
| `copywriting`     | required bei Texten | Headlines, Subcopy, Fehler-/Hinweis-Texte, Metadata | Auth-Microcopy muss knapp, vertrauenswürdig und in DE/EN synchron sein     |

## Erwartete Struktur

```txt
apps/workspace/src/app/[locale]/(auth)/
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

Ergänzende Dateien:

```txt
apps/workspace/src/components/auth/auth-frame/
  auth-frame.tsx
  auth-frame.module.css

apps/workspace/src/i18n/dictionaries/auth/
  de.json
  en.json
  index.ts
```

## Was hier nicht hingehört

- Geschützte Workspace-Seiten oder interne Admin-Funktionen.
- Allowlist-, Rollen- oder Permission-Logik in Pages.
- Marketing-Sections, Pricing, FAQ oder Conversion-Landing-Inhalte.
- Legal-Seiten.
- Öffentliche API-Routen.
- Eigene Auth- oder Session-Endpunkte.
