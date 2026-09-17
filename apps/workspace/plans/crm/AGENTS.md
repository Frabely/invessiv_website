# AGENTS.md — Umsetzung CRM & Kundenportal

Diese Datei regelt die Umsetzung des CRM-Plans unabhängig vom Zielordner. Spezifischere
`AGENTS.md` am Zielcode haben Vorrang.

## Verbindliche Quellen

1. `00-entscheidungen.md` enthält alle Entscheidungen.
2. `core-features.md` ist die Funktionsübersicht.
3. Die 35 aktiven geordneten Ordner enthalten Merge-Gates und Abnahmekriterien; der aufgelöste Ordner 03a zählt nicht
   als eigene Merge-Einheit.

Frühere Planstände mit 16 Merge-Einheiten und 34 Tasks sind vollständig ersetzt. Keine erinnerte
Altentscheidung darf übernommen werden, wenn sie nicht in den aktuellen Dateien steht.

**Ordnernummer ≠ Task-Nummer.** Die Ordnernummer (01–03, 03b–03d, 04–06, 06b, 07, 07a–07c, 08–20, 20a, 21–22,
22a, 23) ist die
Merge-Reihenfolge und kann sich beim
Neuschnitt verschieben. Die Task-Nummer ist die Identität und bleibt: Task 08 heißt überall Task 08
und liegt in Ordner 06. Querverweise im Plan nennen deshalb immer die **Task**-Nummer, Reihenfolge-
und Abhängigkeitsaussagen die **Ordner**-Nummer.

## Mergebarer Master ist Pflicht

- Ein Ordner entspricht einem Branch `feat/crm-<ordner-slug>`, einem PR und einem Merge.
- Nach jedem Ordner sind Migration, Tests und App-Build grün; `master` ist produktiv deploybar.
- Kein Ordner darf eine UI auf unvollständige Handler, fehlende Tabellen oder spätere Ordner zeigen.
- Reine Fundamente bleiben unsichtbar. Sichtbare Funktionen werden vertikal vollständig geliefert.
- Feature-Flags sind serverseitig typisiert und standardmäßig aus, bis der Flow im selben Ordner
  vollständig implementiert ist.
- Additive Schemaänderungen werden vor neuen Lesern/Schreibern ausgeliefert. Entfernen oder
  Verengen erfolgt frühestens in einem späteren, eigenständig sicheren Cleanup-Release.
- Zielkorridor je Ordner sind 50–100 geänderte Dateien inklusive Tests. Ab 120 Dateien muss der
  Review-Scope vor Beginn geprüft und nach Möglichkeit vertikal geteilt werden.
- 200 geänderte Dateien sind die harte Obergrenze. Ein Ordner, der sie voraussichtlich überschreitet,
  wird vor der Umsetzung neu geschnitten; ein Überschreiten darf nicht erst im Review auffallen.
- Unter 50 Dateien ist zulässig, wenn die Einheit fachlich vollständig und eigenständig wertvoll ist.
  Unabhängige Features werden nicht künstlich gekoppelt, nur um eine Dateizahl zu erreichen.

## Arbeitsweise

- Vor jeder Einheit deren `README.md`, dann `00-entscheidungen.md` und scoped Regeln am Zielcode lesen.
- Beim Start `offen` auf `läuft`, vor Übergabe auf `im Review` und erst nach tatsächlichem Merge auf
  `gemerged` setzen — sowohl in der Root-Tabelle als auch in der Ordner-README.
- Migrationsnummern im Repository ermitteln, nie aus dem Plan übernehmen.
- Keine stillschweigende Abweichung und kein Auto-Commit.
- Bestehende Nutzeränderungen unangetastet lassen.

## Harte Sicherheitsgrenzen

- Auth- oder DB-Fehler öffnen niemals Zugriff.
- Portalautorisierung leitet den Kunden aus serverseitig validierter Mitgliedschaft ab. Kein
  Portal-Handler nimmt eine `customerId` aus der Anfrage — die Signatur muss das unmöglich machen.
- Portal-Handler liegen unter `src/server/portal/`, nie unter `src/server/workspace/`. Kein Handler
  wird von beiden Welten benutzt, auch nicht mit einem Parameter, der entscheidet, wer fragt.
- `proxy.ts` lässt `/api/*` grundsätzlich durch. Portal- und Cron-Routen bringen ihre Prüfung selbst
  mit.
- Nie ein Abgleich über eine E-Mail-Adresse als Autorisierung — weder im Portal noch intern.
- Sichtbarkeitsfilter stehen in der Query, nicht im Rendering; Fremdzugriff antwortet 404.
- **Zugriffsbereiche (ab Ordner 07b):** Jede CRM-Query filtert über `accessScope`/`crmAccessCondition`, jeder
  CRM-Schreibpfad prüft `canOn`, jeder CRM-Endpunkt steht in `CRM_ENDPOINT_ACCESS_RULES`. Jede neue CRM-Permission
  wird bei Einführung als `scopable` oder workspace-weit eingeordnet; jede neue besitzbare Entität deklariert
  `requiredPermission`. Jede CRM-Einheit enthält Negativtests für fremden Kunden und fremdes Projekt.
- Zugangsdaten haben keinen Portalpfad und werden in Listen nie entschlüsselt.
- Externer Text wird weder als HTML noch ungefiltertes Markdown gerendert.
- Blob-Löschung erfolgt vor dem endgültigen Entfernen der DB-Zuordnung und ist wiederholbar.
- Logs, Analytics, Activities und Jobfehler enthalten keine Secrets und keine unnötige PII.

## Architektur und Migration

- Client-`fetch` → Route Handler → Command/Query Handler; keine Server Actions.
- Versionierte Writes ausschließlich über `updateVersioned` (Task 01): atomares
  `UPDATE … WHERE id = $1 AND version = $2`, niemals SELECT-dann-UPDATE. Jede 409-Antwort trägt
  `VersionConflictDto` mit `currentVersion` und `current`.
- Result-Unions statt Exceptions für erwartete Fachfehler. Die Route mappt Fehlercodes auf HTTP über
  eine nicht-exportierte Message-Map; Statuscodes aus `HttpResponseCode`, nie nackte Zahlen.
- Endpunkte im Client über `WorkspaceApiEndpoint`, keine URL-Literale.
- Pfade ausschließlich aus `SITE_ROUTES` und `createLocalePathname`, nie aus String-Literalen
  zusammengebaut. Kein `` `/${locale}/pfad` `` in Route- oder Komponentencode.
- Exportierte Typen, Konstanten und Patterns liegen vor Nutzung in `common`.
- String-Unions als Const-Objekt plus abgeleitetem Typ, niemals `enum`.
- DB-Zugriff über kanonische Drizzle-Modelle; Mapping in eigenen getesteten Services.
- Texte vollständig in DE/EN-Dictionaries; keine Inline-Strings und keine
  `locale === "de" ? … : …`-Branches. Von der Locale ableitbare Werte gehören als
  `Record<Locale, …>` nach `packages/common/src/constants/i18n/`, nicht ins Dictionary.
- **URL-State statt React-State** für Listen, Filter, Sortierung, Seiten, Mehrfachauswahl und
  Panel-Selektion.
- Private Seiten setzen `robots: noindex/nofollow/nocache` und
  `export const dynamic = "force-dynamic"` — interner Bereich **und** alle Portal-Seiten.
- Co-located `*.module.css`. Kein Inline-Styling, keine neuen globalen Komponentenklassen, Farben
  nur über bestehende Theme-Tokens, Zustände über `data-*`-Attribute.
- Migrationen additiv und idempotent: `CREATE … IF NOT EXISTS`, `--> statement-breakpoint` zwischen
  den Statements, ein zweiter Lauf ist folgenlos.
- Expand → Dual-Write → Backfill → Read-Cutover → Cleanup über getrennte Releases. Einzige
  Ausnahme: der direkte Activity-Umzug in Ordner 02, begründet in `00-entscheidungen.md`.
- Bereits registrierte Migrationen werden nie verändert oder erneut erwartet.
- Outbox-Eintrag und fachlicher DB-Write entstehen in derselben Transaktion.
- Vor jedem neuen Baustein die Tabelle „Wiederverwendete Muster" in `00-entscheidungen.md` prüfen.
- `lead_status` bleibt außerhalb der Lead-Konvertierung unangetastet. Task 08 setzt einen erfolgreich konvertierten
  Lead automatisch auf `won`; der technische Marker für konvertierte Leads bleibt trotzdem ausschließlich
  `leads.customer_id IS NOT NULL`.

## Definition of Done je Einheit

- Alle Punkte der Ordner-README erfüllt und im PR-Testplan genannt.
- Neue Fehlerpfade, Berechtigungen, Empty-States und Nebenläufigkeitskonflikte getestet.
- Portalrelevante Einheit enthält Cross-Customer-Negativtests mit echten Sessions.
- Jede neue Liste und Sektion hat einen Empty-State, der erklärt, **wofür** der Bereich gedacht ist —
  nicht nur „keine Daten". Bei Filtern sind „noch nichts angelegt" und „keine Treffer" zwei
  unterscheidbare Zustände.
- Jeder Ordner, der neues Schema anlegt, erweitert `db:seed:crm` um realistische Beispieldaten (Muster:
  `packages/db/scripts/seed-leads-fixture.ts`). Das Skript bleibt optional aufrufbar, damit
  Empty-States weiterhin prüfbar sind.
- Drizzle-Modell deckungsgleich zur Migration — Spaltennamen, Typen und Constraints. Das ist ein
  ausdrücklicher Review-Punkt im PR, kein Nebenbei.
- Kein toter Button, keine Route ins Leere, kein Verweis auf Unfertiges.
- `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes und
  `pnpm --filter @invessiv/workspace build` sind grün.
- PR dokumentiert Security/Privacy, Monitoring, Rollback und bei UI-Änderungen Screenshots.
