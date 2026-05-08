# Todo

## Cleanup Agents.md files

- check and cleanup AGENTS.md files

## Lead DTO / Form Contracts Follow-Up

- `AddLeadFormValues` und die übrigen Lead-Form-State-Typen in `src/common/contracts/leads/forms/` weiter sauber
  strukturieren und bei Bedarf in weitere fachliche Teiltypen aufteilen.
- Prüfen, ob für weitere Lead-Formen ein konsistentes `forms/`, `requests/` und `results/`-Layout im
  Common-Contract-Layer
  sinnvoll ist.
- Bestehende Lead-API-Endpunkte schrittweise überarbeiten und korrigieren, damit alle Bodies, Responses und
  Handler-Inputs
  konsistent auf Shared DTOs und die gleiche Contract-Struktur umgestellt sind.
- Das ist ein separater Struktur-Schritt und kein Teil des laufenden Feature-Flows.

## Zod Issue Typen Follow-Up

- Die verbliebenen `ZodIssue`-Verwendungen im Repo schrittweise auf das aktuelle Zod-Pattern mit
  `z.core.$ZodIssue` umstellen.
- Betroffene Stellen dabei gezielt aktualisieren und die jeweiligen Tests mitziehen.
- Das ist eine separate technische Bereinigung und kein Teil des aktuellen Leads-Refactors.

## Stack Rework

- Das Contact-DB-MVP ist abgeschlossen.
- Folgearbeit nur noch entlang von [docs/stack-rework-mvp-plan.md](/abs/path/C:/Users/MoritzDesktop/IdeaProjects/invessiv_website/docs/stack-rework-mvp-plan.md) schneiden.
- Naechster konkrete Slice: verbleibende Raw-Neon-Nutzung um `getDatabaseClient()` pruefen und bereinigen.

## I18n Dictionary Rework

- `src/i18n/dictionaries/marketing/home.ts` und ggf. weitere verbleibende Dictionary-`*.ts`-Dateien auf das JSON-Schema umstellen.
- Zielstruktur pro Dictionary: `<sinnvollerName>.de.json` und `<sinnvollerName>.en.json`.
- Vor einer Umstellung prüfen, welche Loader-, Typisierungs- und Importpfade in `src/i18n/get-dictionary.ts` sowie den aufrufenden Modulen angepasst werden muessen.
- Dieses Thema jetzt nicht im laufenden Contact-Form-Task umsetzen, sondern als separates Rework behandeln.

## Default-Locale Redirect Rework

- `src/proxy.ts` spaeter so umbauen, dass locale-lose oeffentliche Seiten generisch auf die Default-Locale weitergeleitet werden.
- Ziel: statt einzelner harter Redirect-Ziele wie `/imprint -> /de/imprint` eine zentrale `DEFAULT_LOCALE` plus kontrollierte Liste lokalisierbarer Public Routes nutzen.
- Beispiel: `/` -> `/de`, `/imprint` -> `/de/imprint`, `/privacy` -> `/de/privacy`, `/terms` -> `/de/terms`.
- Nicht blind alle Pfade prefixen: `_next`, `api`, Assets aus `public`, `favicon.ico`, `robots.txt`, `sitemap.xml`, Clerk-/Webhook-/Systemrouten muessen ausgespart bleiben.
- Bestehendes Verhalten fuer `/projects` und `ENABLE_MARKETING_PROOF` beim Rework explizit mit Tests absichern.

## Src-Struktur Rework

- Die Ordnerstruktur in `src` insgesamt neu schneiden.
- In `src/app` soll unter dem aktuellen `[locale]` ein Ordner `(marketing)` eingefuehrt werden.
- Alles, was aktuell direkt unter `src/app/[locale]` fuer den Marketing-Bereich liegt, soll nach `src/app/[locale]/(marketing)` verschoben werden.
- Der `api`-Ordner in `src/app` bleibt bestehen.
- Zusaetzlich soll es in `src/app` einen separaten Bereich wie `management` oder `dashboard` geben.
- Neben `src/app` soll es einen gemeinsamen Ordner wie `src/lib` oder `src/shared` geben.
- In diesen gemeinsamen Ordner soll sinnvoll strukturiert alles verschoben werden, was aktuell neben `src/app` liegt, mit Ausnahme von `server`.
- Die Struktur von Sections klarer trennen: eine Section bleibt ein eigener Feature-Ordner, z. B. fuer `contact-section` mit section-spezifischer Logik und Zusammensetzung.
- Zusaetzlich soll es innerhalb solcher Bereiche einen klaren Unterordner fuer Komponenten geben, wenn mehrere Teilkomponenten zu einer Section gehoeren.
- Dabei zwischen section-spezifischen Teilkomponenten und wirklich wiederverwendbaren Elementen unterscheiden.
- Wirklich wiederverwendbare Elemente wie Feldhuellen, Actions, Shells oder Status-Bausteine sollen nicht implizit im Section-Ordner versteckt bleiben, sondern in einen passenden gemeinsamen Komponentenbereich verschoben oder dort neu geschnitten werden.
- Dieses Thema jetzt nicht im laufenden Task umsetzen, sondern als separates Struktur-Rework behandeln.

## AGENTS.md Struktur-Rework

- Die `AGENTS.md`-Dateien im Projekt sauber auf Root, `src/app`, `src/components`, `src/i18n` und `src/server` verteilen.
- Die Inhalte in den Bereichsdateien auf die jeweils passende Domäne verschlanken und doppelte Regeln aus den Unterordnern entfernen.
- Die Root-`AGENTS.md` als globale Übersicht und Verweis auf die Bereichsdateien behalten.
- Dieses Thema nicht implizit nebenbei weiter umbauen, sondern als eigenes Struktur-Rework behandeln.

## Const-Objekt-Pattern für alle String-Konstanten

Das in `src/common/constants/leads/` etablierte Muster (`const Foo = { Bar: "bar" } as const` + abgeleiteter Type + `FOO_VALUES`-Array) muss projektweit umgesetzt werden.

- `src/common/constants/contact/` vollständig prüfen und umstellen — `CONTACT_REQUEST_KINDS`, `CONTACT_LEAD_STATUS_VALUES`, `CONTACT_BUDGET_KEYS`, `CONTACT_GOAL_KEYS` usw. (Einstieg: bestehender Eintrag zu `CONTACT_REQUEST_KINDS` in "Contact Form Follow-Up")
- Alle weiteren `src/common/constants/**`-Dateien prüfen; jedes `as const`-Array, das string-Literale als Union-Typ exponiert, auf das Const-Objekt-Pattern umstellen
- Andere Ordner auf vergleichbare String-Literal-Arrays oder manuelle Union-Typen prüfen, insbesondere:
  - `src/lib/`
  - `src/server/db/record-configuration/` (inline-ENUMs in Drizzle-Spalten ohne zugehörige Konstante)
  - `src/i18n/` (falls Key-Listen als Array modelliert sind)
- Nicht als Teil laufender Feature-Tasks umsetzen; als eigenständiges Konsolidierungs-Rework behandeln

## Contact Form Follow-Up

- Die Form-Bezeichnungen im Code sind an mindestens einer Stelle vertauscht: Form 2 soll fachlich die E-Mail-Form sein, Form 3 der Call-Pfad. Das spaeter gezielt konsistent bereinigen, aber nicht im laufenden Schritt mit umbauen.
- Pruefen, ob `CONTACT_REQUEST_KINDS` statt als `as const`-Array kuenftig besser als `const`-Objekt mit abgeleiteter Liste modelliert werden sollte, um lesbarere Zugriffe wie `ContactRequestKind.ProjectRequest` zu ermoeglichen, ohne ein echtes TypeScript-`enum` einzufuehren.
- `src/server/services/contact/*` als verbleibende technische Hilfen schrittweise in eine saubere Contact-Domaenenstruktur ueberfuehren.
- `src/features/contact/*` den Altbestand vollstaendig in `client/` und `shared/` schneiden.
- Die Contact-Testlandschaft schichtbezogen statt komponentenuebergreifend neu ordnen.
- Die bestehende Contact-Ordnerstruktur zwischen `features/contact`, `server/services/contact` und der Route langfristig bereinigen.
- Alte gemischte Services weiter in klarere Handler- und Infrastruktur-Grenzen zerlegen, falls nach dem aktuellen Upgrade noch noetig.
- Den verbleibenden Contact-Altbestand konsistent in die Zielstruktur ueberfuehren, aber als separates Nachfolge-Rework behandeln.
- `src/server/services/contact/contact-lead-metadata.ts` als komplette Datei spaeter gezielt reviewen, besonders die Typen, Prepared-Write-Strukturen und die Trennung zwischen fachlichem Modell und DB-Insert-Vorbereitung.
- In `src/server/services/contact/contact-lead-metadata.ts` und angrenzenden Persistenzpfaden `createdAt` und `updatedAt` spaeter von ISO-Strings auf `Date` umstellen; aktuell funktioniert der Insert so, aber intern waeren `Date`-Werte semantisch und typseitig sauberer.

## CRM DB felder für Stueer

- vier Felder einbauen: Land, B2B/B2C, Firma ja/nein, USt-IdNr.

## Hero visual Verbesserung

- im hero visual die maus als "Lampe" anzeigen und beim visual shatten einfügen abhängig von der maus position
