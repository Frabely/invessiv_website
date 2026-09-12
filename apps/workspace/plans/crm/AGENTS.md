# AGENTS.md — Umsetzung CRM & Kundenportal

Diese Datei regelt die Umsetzung des CRM-Plans unabhängig vom Zielordner. Spezifischere
`AGENTS.md` am Zielcode haben Vorrang.

## Verbindliche Quellen

1. `00-entscheidungen.md` enthält alle Entscheidungen.
2. `core-features.md` ist die Funktionsübersicht.
3. Die 20 nummerierten Ordner enthalten Merge-Gates und Abnahmekriterien.

Frühere Planstände mit 16 Merge-Einheiten und 34 Tasks sind vollständig ersetzt. Keine erinnerte
Altentscheidung darf übernommen werden, wenn sie nicht in den aktuellen Dateien steht.

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
- Portalautorisierung leitet den Kunden aus serverseitig validierter Mitgliedschaft ab.
- Sichtbarkeitsfilter stehen in der Query, nicht im Rendering; Fremdzugriff antwortet 404.
- Zugangsdaten haben keinen Portalpfad und werden in Listen nie entschlüsselt.
- Externer Text wird weder als HTML noch ungefiltertes Markdown gerendert.
- Blob-Löschung erfolgt vor dem endgültigen Entfernen der DB-Zuordnung und ist wiederholbar.
- Logs, Analytics, Activities und Jobfehler enthalten keine Secrets und keine unnötige PII.

## Architektur und Migration

- Client-`fetch` → Route Handler → Command/Query Handler; keine Server Actions.
- Result-Unions statt Exceptions für erwartete Fachfehler.
- Exportierte Typen, Konstanten und Patterns liegen vor Nutzung in `common`.
- String-Unions als Const-Objekt plus abgeleitetem Typ, niemals `enum`.
- DB-Zugriff über kanonische Drizzle-Modelle; Mapping in eigenen getesteten Services.
- Texte vollständig in DE/EN-Dictionaries; Pfade aus typisierten Konstanten.
- Expand → Dual-Write → Backfill → Read-Cutover → Cleanup über getrennte Releases.
- Bereits registrierte Migrationen werden nie verändert oder erneut erwartet.
- Outbox-Eintrag und fachlicher DB-Write entstehen in derselben Transaktion.

## Definition of Done je Einheit

- Alle Punkte der Ordner-README erfüllt und im PR-Testplan genannt.
- Neue Fehlerpfade, Berechtigungen, Empty-States und Nebenläufigkeitskonflikte getestet.
- Portalrelevante Einheit enthält Cross-Customer-Negativtests mit echten Sessions.
- `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes und
  `pnpm --filter @invessiv/workspace build` sind grün.
- PR dokumentiert Security/Privacy, Monitoring, Rollback und bei UI-Änderungen Screenshots.
