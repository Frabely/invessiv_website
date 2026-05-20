# AGENTS.md - Auth / `(auth)` Route Group

Diese Datei gilt f�r `src/app/[locale]/(auth)/` und alle Subroutes darunter. Sie erg�nzt die Repo-Root `AGENTS.md` und
`src/app/AGENTS.md`. Ziel ist ein sauberer, �ffentlicher Auth-Bereich f�r Clerk-Formulare, getrennt vom gesch�tzten
Workspace.

## Codex-Arbeitsweise

- Bestehende Auth-Architektur zuerst lesen: `plans/workspace/clerk-auth-and-workspace-shell.md`,
  `src/app/[locale]/AGENTS.md` und `src/app/[locale]/CLAUDE.md`.
- Standardm��ig nur ein Ticket oder einen klar abgegrenzten Schritt bearbeiten, sofern der Nutzer nicht ausdr�cklich
  mehr beauftragt.
- Keine eigene Auth-Logik einf�hren. Clerk bleibt die einzige Auth-Quelle.
- Sichtbare Texte und localeabh�ngige Konfigurationen immer �ber Dictionaries oder typisierte Locale-Mappings pflegen;
  keine bin�ren `de`/Fallback-Branches.
- Bei Security-, Redirect-, ENV- oder Caching-Unsicherheit stoppen und den Nutzer fragen.

## Zweck

`(auth)` enth�lt �ffentliche Auth-Routen mit Clerk-Komponenten:

- `/[locale]/sign-in`
- `/[locale]/sign-up`

Diese Route-Group ist �ffentlich erreichbar, aber fachlich klar von `workspace` getrennt. Sie dient nur dem
Login-/Registrierungs-Frame und darf keine gesch�tzten Workspace-Inhalte enthalten.

## Mandatorische Regeln

1. **Clerk-only Auth.** Keine eigenen Login-, Register-, Session-, JWT- oder Passwort-Endpunkte. Sign-in und Sign-up
   laufen �ber `@clerk/nextjs`.

2. **�ffentlich, aber minimal.** Auth-Routen sind �ffentlich zug�nglich. Sie bekommen keinen Marketing-Header, keine
   Footer-Navigation und keine ablenkenden Landing-Sections.

3. **Keine Workspace-Berechtigungen hier pr�fen.** Allowlist- und Role-Checks geh�ren nach `src/lib/auth/permissions.ts`
   und ins `workspace`-Layout. `(auth)` rendert nur den Auth-Einstieg.

4. **Locale-aware Routing.** Routen liegen unter `[locale]`. Redirects und Fallback-URLs m�ssen locale-aware gebaut
   werden, z. B. �ber Helper aus `src/lib/auth/routes.ts`.

5. **i18n-Pflicht.** Frame-Texte, Headlines, Hinweise, Metadata und Microcopy kommen aus `src/i18n/dictionaries/auth/`.
   Keine inline-Texte in `page.tsx`, Layouts oder Auth-Frame-Komponenten.

6. **Keine bin�ren Locale-Branches.** Auch wenn aktuell nur DE/EN vorgesehen sind, wird immer so modelliert, als k�nnten
   weitere Sprachen folgen. Verboten sind Muster wie `locale === "de" ? deDE : enUS`. Erlaubt sind zentrale
   Lookup-Strukturen wie `Record<SupportedLocale, ClerkLocalization>`.

7. **Clerk-Lokalisierung nutzen.** Clerk-interne UI-Strings kommen �ber `@clerk/localizations` im zentralen
   `<ClerkProvider>` und werden �ber ein typisiertes Locale-Mapping aufgel�st.

8. **Komponenten-Konvention.** Auth-spezifische UI geh�rt nach
   `src/components/auth/<component-name>/<component-name>.tsx` mit lokalem `*.module.css`, falls Styling relevant ist.

9. **Server Components als Default.** Pages und Layouts bleiben Server Components, au�er eine lokale Interaktion
   erzwingt `"use client"`. Clerk-Komponenten d�rfen gem�� SDK-Anforderung verwendet werden.

10. **Keine Secrets im Client.** `CLERK_SECRET_KEY`, Allowlist-ENV und server-only Auth-Helper niemals in Client
    Components importieren. `NEXT_PUBLIC_*` nur f�r tats�chlich �ffentliche Clerk-Client-Konfiguration verwenden.

11. **Public Nav nicht nebenbei �ndern.** Auth-Routen werden nicht automatisch im Marketing-Header oder Footer verlinkt.
    �nderungen daran brauchen eine explizite Entscheidung.

12. **Metadata sauber halten.** Auth-Seiten brauchen eigene Metadata. Sie sollen nicht als SEO-Landingpages behandelt
    werden; falls Indexierung unerw�nscht ist, `robots` bewusst setzen und im Plan dokumentieren.

13. **Tests passend zum Risiko.** Auth-Frame-UI braucht mindestens Rendering-/Interaction-Smokes, wenn eigene
    Interaktion dazukommt. Redirect-/Route-Helper geh�ren in Unit-Tests.

## Skills f�r Arbeiten in `(auth)`

| Skill                             |               Priorit�t | Wann nutzen                                                     | Grund                                                                                  |
| --------------------------------- | ----------------------: | --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `best-practices`                  |                required | ENV, Clerk-Konfiguration, Redirects, server-only Grenzen        | Verhindert Secret-Leaks, Auth-Eigenbau und unsichere Runtime-Entscheidungen            |
| `frontend-design`                 |         required bei UI | Auth-Frame, Layout, Responsiveness, Theme-Anmutung              | Sichtbare Auth-Flows m�ssen konsistent, ruhig und conversion-tauglich sein             |
| `copywriting`                     |     required bei Texten | Headlines, Subcopy, Fehler-/Hinweis-Texte, Metadata             | Auth-Microcopy muss knapp, vertrauensw�rdig und in DE/EN synchron sein                 |
| `accessibility`                   | required bei UI-Abnahme | Fokus, Labels, Kontrast, Keyboard-Nutzung                       | Auth ist ein kritischer Zugangspfad und muss WCAG-tauglich sein                        |
| `ux-design`                       |                sinnvoll | Login-/Sign-up-Journey, Redirect-Zust�nde, leere/Fehlerzust�nde | Minimiert Reibung und h�lt den Flow verst�ndlich                                       |
| `performance` / `core-web-vitals` |                sinnvoll | Clerk-Provider, Auth-Frame, CSS/JS-Budget                       | Auth darf den App-Start und Core Web Vitals nicht unn�tig verschlechtern               |
| `seo`                             |                sinnvoll | Metadata, Robots, Canonicals                                    | Auth-Seiten m�ssen bewusst eingeordnet werden und d�rfen keine SEO-Verwirrung erzeugen |

## Erwartete Struktur

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

Erg�nzende Dateien:

```txt
src/components/auth/auth-frame/
  auth-frame.tsx
  auth-frame.module.css

src/i18n/dictionaries/auth/
  de.json
  en.json
  index.ts
```

## Was hier nicht hingeh�rt

- Gesch�tzte Workspace-Seiten oder interne Admin-Funktionen.
- Allowlist-, Rollen- oder Permission-Logik in Pages.
- Marketing-Sections, Pricing, FAQ oder Conversion-Landing-Inhalte.
- Legal-Seiten.
- �ffentliche API-Routen.
- Eigene Auth- oder Session-Endpunkte.
