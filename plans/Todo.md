# To-dos

## Cleanup von `src/common`

- `src/common` strukturell aufraeumen und fachlich sauberer schneiden.
- Gemeinsame Contracts, Konstanten und Hilfstypen weiter konsolidieren, damit der Bereich langfristig schlank bleibt.

## Cleanup der `AGENTS.md`-Dateien

- `AGENTS.md`-Dateien prüfen und bereinigen.

## Follow-up zu Lead-DTOs und Form-Verträgen

- `AddLeadFormValues` und die übrigen Lead-Form-State-Typen in `src/common/contracts/leads/forms/` weiter sauber
  strukturieren und bei Bedarf in weitere fachliche Teiltypen aufteilen.
- Prüfen, ob für weitere Lead-Formen ein konsistentes `forms/`, `requests/` und `results/`-Layout im
  Common-Contract-Layer sinnvoll ist.
- Bestehende Lead-API-Endpunkte schrittweise überarbeiten und korrigieren, damit alle Bodies, Responses und
  Handler-Inputs konsistent auf Shared DTOs und dieselbe Contract-Struktur umgestellt sind.
- Das ist ein separater Struktur-Schritt und kein Teil des laufenden Feature-Flows.

## Workspace Mobile Usability

- Den Workspace so weiterentwickeln, dass er auf Mobile nutzbar und sauber bedienbar ist.

## Follow-up zu Zod-Issue-Typen

- Die verbliebenen `ZodIssue`-Verwendungen im Repo schrittweise auf das aktuelle Zod-Pattern mit `z.core.$ZodIssue`
  umstellen.
- Betroffene Stellen gezielt aktualisieren und die jeweiligen Tests mitziehen.
- Das ist eine separate technische Bereinigung und kein Teil des aktuellen Leads-Refactors.

## I18n Dictionary Rework

- `src/i18n/dictionaries/marketing/home.ts` und ggf. weitere verbleibende Dictionary-`*.ts`-Dateien auf das JSON-Schema umstellen.
- Zielstruktur pro Dictionary: `<sinnvollerName>.de.json` und `<sinnvollerName>.en.json`.
- Vor einer Umstellung prüfen, welche Loader-, Typisierungs- und Importpfade in `src/i18n/get-dictionary.ts` sowie den
  aufrufenden Modulen angepasst werden müssen.
- Dieses Thema nicht im laufenden Contact-Form-Task umsetzen, sondern als separates Rework behandeln.

## `src`-Struktur Rework

- Die Ordnerstruktur in `src` insgesamt neu schneiden.
- In `src/app` soll unter dem aktuellen `[locale]` ein Ordner `(marketing)` eingeführt werden.
- Alles, was aktuell direkt unter `src/app/[locale]` für den Marketing-Bereich liegt, soll nach
  `src/app/[locale]/(marketing)` verschoben werden.
- Der `api`-Ordner in `src/app` bleibt bestehen.
- Zusätzlich soll es in `src/app` einen separaten Bereich wie `management` oder `dashboard` geben.
- Neben `src/app` soll es einen gemeinsamen Ordner wie `src/lib` oder `src/shared` geben.
- In diesen gemeinsamen Ordner soll sinnvoll strukturiert alles verschoben werden, was aktuell neben `src/app` liegt, mit Ausnahme von `server`.
- Die Struktur von Sections klarer trennen: Eine Section bleibt ein eigener Feature-Ordner, zum Beispiel für
  `contact-section` mit section-spezifischer Logik und Zusammensetzung.
- Zusätzlich soll es innerhalb solcher Bereiche einen klaren Unterordner für Komponenten geben, wenn mehrere
  Teilkomponenten zu einer Section gehören.
- Dabei zwischen section-spezifischen Teilkomponenten und wirklich wiederverwendbaren Elementen unterscheiden.
- Wirklich wiederverwendbare Elemente wie Feldhüllen, Actions, Shells oder Status-Bausteine sollen nicht implizit im
  Section-Ordner versteckt bleiben, sondern in einen passenden gemeinsamen Komponentenbereich verschoben oder dort neu
  geschnitten werden.
- Dieses Thema nicht im laufenden Task umsetzen, sondern als separates Struktur-Rework behandeln.

## `AGENTS.md`-Struktur Rework

- Die `AGENTS.md`-Dateien im Projekt sauber auf Root, `src/app`, `src/components`, `src/i18n` und `src/server` verteilen.
- Die Inhalte in den Bereichsdateien auf die jeweils passende Domäne verschlanken und doppelte Regeln aus den Unterordnern entfernen.
- Die Root-`AGENTS.md` als globale Übersicht und Verweis auf die Bereichsdateien behalten.
- Dieses Thema nicht implizit nebenbei weiter umbauen, sondern als eigenes Struktur-Rework behandeln.

## Const-Objekt-Pattern für alle String-Konstanten

Das in `src/common/constants/leads/` etablierte Muster (`const Foo = { Bar: "bar" } as const` + abgeleiteter Type + `FOO_VALUES`-Array) muss projektweit umgesetzt werden.

- `src/common/constants/contact/` vollständig prüfen und umstellen, zum Beispiel `CONTACT_REQUEST_KINDS`,
  `CONTACT_LEAD_STATUS_VALUES`, `CONTACT_BUDGET_KEYS`, `CONTACT_GOAL_KEYS` usw. Der Einstiegspunkt ist der bestehende
  Eintrag zu `CONTACT_REQUEST_KINDS` im Punkt „Contact Form Follow-up“.
- Alle weiteren `src/common/constants/**`-Dateien prüfen; jedes `as const`-Array, das String-Literale als Union-Typ
  exponiert, auf das Const-Objekt-Pattern umstellen.
- Andere Ordner auf vergleichbare String-Literal-Arrays oder manuelle Union-Typen prüfen, insbesondere:
  - `src/lib/`
  - `src/server/db/record-configuration/` (inline-Enums in Drizzle-Spalten ohne zugehörige Konstante)
  - `src/i18n/` (falls Key-Listen als Array modelliert sind)
- Nicht als Teil laufender Feature-Tasks umsetzen, sondern als eigenständiges Konsolidierungs-Rework behandeln.

## Contact Form Follow-up

- Die Form-Bezeichnungen im Code sind an mindestens einer Stelle vertauscht: Form 2 soll fachlich die E-Mail-Form sein,
  Form 3 der Call-Pfad. Das später gezielt konsistent bereinigen, aber nicht im laufenden Schritt mit umbauen.
- Prüfen, ob `CONTACT_REQUEST_KINDS` statt als `as const`-Array künftig besser als `const`-Objekt mit abgeleiteter Liste
  modelliert werden sollte, um lesbarere Zugriffe wie `ContactRequestKind.ProjectRequest` zu ermöglichen, ohne ein
  echtes TypeScript-`enum` einzuführen.
- `src/server/services/contact/*` als verbleibende technische Hilfen schrittweise in eine saubere
  Contact-Domänenstruktur überführen.
- `src/features/contact/*` den Altbestand vollständig in `client/` und `shared/` schneiden.
- Die Contact-Testlandschaft schichtbezogen statt komponentenübergreifend neu ordnen.
- Die bestehende Contact-Ordnerstruktur zwischen `features/contact`, `server/services/contact` und der Route langfristig bereinigen.
- Alte gemischte Services weiter in klarere Handler- und Infrastruktur-Grenzen zerlegen, falls nach dem aktuellen
  Upgrade noch nötig.
- Den verbleibenden Contact-Altbestand konsistent in die Zielstruktur überführen, aber als separates Nachfolge-Rework
  behandeln.
- `src/server/services/contact/contact-lead-metadata.ts` als komplette Datei später gezielt reviewen, besonders die
  Typen, Prepared-Write-Strukturen und die Trennung zwischen fachlichem Modell und DB-Insert-Vorbereitung.
- In `src/server/services/contact/contact-lead-metadata.ts` und angrenzenden Persistenzpfaden `createdAt` und
  `updatedAt` später von ISO-Strings auf `Date` umstellen; aktuell funktioniert der Insert so, aber intern wären `Date`
  -Werte semantisch und typseitig sauberer.

## Lead Detail Panel Follow-up

- Der Button `Vollprofil geplant` im Lead-Detail-Panel bleibt vorerst als Platzhalter sichtbar.
- Später eine echte Vollprofil-Ansicht bzw. Zielaktion definieren und den Button dann mit konkreter Funktion oder klarer
  Navigation ersetzen.
- Bis dahin keine halbfertige Detail-Ansicht bauen, sondern den offenen Umfang explizit dokumentiert lassen.

## HTTP-Konstanten projektweit durchziehen

Seit Ordner 03b gibt es in `packages/common/src/constants/http/` neben `HttpResponseCode` auch `HttpMethod`,
`HttpHeaderName` und `MediaType`. Neuer Code nutzt sie verbindlich (`apps/workspace/src/server/AGENTS.md`, Abschnitt
„HTTP-Konstanten“). Der Bestand arbeitet noch mit String- und Zahl-Literalen. Ziel ist ein einmaliger, eigenständiger
Refactor über beide Apps, damit die Konstanten nicht nur existieren, sondern überall genutzt werden.

- **Konstanten ergänzen, bevor umgestellt wird:** Weitere tatsächlich genutzte Werte als Const-Eintrag samt Test
  aufnehmen, z. B. `HttpHeaderName.ContentLength`, `.RetryAfter`, `.Location`, `.XForwardedFor`, `.XRealIp`.
  `request.headers.get()` ist nicht case-sensitiv; die Schreibweise im Const-Objekt einheitlich festlegen.
- **Client-Services** (`fetch`-Aufrufe) auf `HttpMethod`, `HttpHeaderName.ContentType`, `MediaType.Json` und
  `HttpResponseCode` umstellen, u. a.:
  - `apps/workspace/src/components/workspace/leads/form/lead-form-dialog/leads-service.ts`
  - `apps/workspace/src/components/workspace/leads/table/services/leads-bulk-edit-service.ts`
  - `apps/workspace/src/client/leads/outreach/lead-outreach-generation-service.ts`,
    `lead-outreach-provider-status-service.ts`
  - `apps/web/src/client/contact/services/contact-form-service.ts`,
    `apps/web/src/client/linkedin-post/services/linkedin-post-generator-service.ts`
- **Routen und Server-Dateien** (Header-Lesen, Statuscodes, externe Requests), u. a.:
  - `apps/web/src/app/api/public/contact/route.ts`, `apps/web/src/app/api/public/generator/linkedin-post/route.ts`
  - `apps/web/src/server/services/mail/providers/resend-provider.ts`
  - `apps/web/src/server/linkedin-post/handlers/generate-linkedin-post.command-handler.ts`,
    `apps/web/src/server/linkedin-post/services/usage-limit/linkedin-post-generator-usage-key-service.ts`
  - `packages/common/src/constants/leads/import/service/import-leads-service.constants.ts`
- **Tests mitziehen:** Route- und Service-Tests beider Apps, die `method: "POST"`, `"Content-Type"`,
  `"application/json"` oder Statuscodes wie `toBe(409)` als Literal verwenden, auf die Konstanten umstellen (betrifft
  u. a. `leads-route.test.ts`, `lead-id-route.test.ts`, `contact/route.test.ts`, `members-routes.test.ts`,
  `roles-routes.test.ts`, `leads-service.test.ts`, `contact-form-service.test.ts`).
- **Vollständigkeit prüfen:** Vor dem Abschluss per Suche sicherstellen, dass keine Literale übrig sind, z. B.
  `grep -rnE '"(GET|POST|PUT|PATCH|DELETE)"|"Content-Type"|"application/json"|toBe\((2|4|5)[0-9]{2}\)|status: [0-9]{3}'`
  über `apps/*/src` und `packages/*/src`.
- **Regel verankern:** Den Abschnitt „HTTP-Konstanten“ nach dem Refactor zusätzlich in `apps/web/src/server/AGENTS.md`
  bzw. die Root-`AGENTS.md` heben, damit er für beide Apps gilt; optional eine ESLint-Regel (`no-restricted-syntax` auf
  die Literale) ergänzen, damit Neuzugänge automatisch auffallen.
- **Gate:** `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` sowie beide App-Builds grün. Reiner Refactor ohne
  Verhaltensänderung.
- Nicht als Teil laufender Feature-Tasks umsetzen; bis dahin gilt die Bestandsregel (beim fachlichen Ändern einer Datei
  im selben Change mit umstellen).
