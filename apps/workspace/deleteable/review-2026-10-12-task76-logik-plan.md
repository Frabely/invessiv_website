# Review Task 76 – Logik und Planerfüllung

> **Behebungsstand 12.10.2026:** F01–F04 sind umgesetzt und durch Regressionstests geprüft. Der ursprüngliche
> Review bleibt unten als Dokumentation erhalten; aktuelle Details und Prüfergebnisse stehen im Nachtrag am Ende.

Stand: 12.10.2026, Branch `feat/crm-leistungsanfragen-3-portal`, HEAD `7b471164519cb844328072fc6bfc87f0b17fd924`. Geprüft wurde das lokale Changeset einschließlich staged Änderungen, Löschungen und neuer, noch ungetrackter Dateien.

Scope: fachliche Logik und Umsetzung von `plans/crm/13c-portal-leistungsanfragen/76-portal-leistungsanfragen.md`, einschließlich dokumentierter Nachträge in Task 74 und README. Dateistruktur, Dateigröße, Typablage, Duplikate und allgemeiner Aufbau der Dateiinhalte bleiben ausdrücklich für den nächsten Review-Schritt zurückgestellt. Kein Produktivcode geändert.

## Gesamturteil

T1–T3 sind weitgehend umgesetzt. Die Rechte- und Kundengrenzen, das schmale Portal-DTO, strikte Eingaben, Mengenprüfung, Statusübergänge, transaktionale Events und die Serialisierung von Anfragen derselben Firma sind im geprüften Code nachvollziehbar. Zwei relevante Funktionsprobleme bleiben: ein Formularwechsel während des Sendens und offene Anfragen außerhalb des Historienfensters. Dazu kommen zwei kleinere Abweichungen vom zugesagten Verhalten. T4 ist vorhanden, aber noch nicht abgenommen; das Browser-Merge-Gate bleibt offen.

## Findings

### F01 · P2 · Formularwechsel während des Sendens umgeht den Idempotenzschutz

- **Fundstelle:** `apps/workspace/src/components/portal/service-requests/portal-service-request-form/portal-service-request-form.tsx:94`, `:145`, `:154`, `:160`; `apps/workspace/src/components/portal/service-requests/portal-service-request-dialog/portal-service-request-dialog.tsx:100`, `:194`, `:242`, `:244`.
- **Problem und Auswirkung:** Während der POST läuft, ist nur der Sende-Button gesperrt. „Andere Leistung wählen“ und die Tabs bleiben bedienbar und unmounten das Formular. Öffnet der Kontakt dieselbe Katalogleistung erneut und sendet sie, entsteht ein neuer Idempotenzschlüssel; bei Standard- und Stundenleistungen können deshalb zwei Anfragen samt Events entstehen. Die spätere Antwort des ersten Formulars ruft weiterhin den Dialog-Callback auf und setzt `sent = true`, auch wenn inzwischen ein anderes Formular offen ist: Dessen Eingaben verschwinden zugunsten einer Bestätigung für die vorherige Anfrage.
- **Empfehlung:** Den laufenden Sendevorgang im Dialog absichern: Wechsel und Schließen währenddessen verhindern oder Anfrageidentität und Pending-State über Formularwechsel hinweg erhalten sowie veraltete Callbacks prüfen. Ein verzögerter POST mit Tab-/Auswahlwechsel muss genau diesen Ablauf abdecken. Die vorhandenen Dialogtests verwenden sofort aufgelöste Antworten und prüfen ihn nicht.

### F02 · P2 · Alte offene Anfragen verschwinden und können nicht mehr zurückgezogen werden

- **Fundstelle:** `apps/workspace/src/server/portal/query-handler/get-portal-services.query-handler.ts:48`; `apps/workspace/src/components/portal/dashboard/widgets/portal-service-request-widget/portal-service-request-widget.tsx:36`; `apps/workspace/src/components/portal/service-requests/portal-service-request-list/portal-service-request-list.tsx:100`.
- **Problem und Auswirkung:** Die Query begrenzt sämtliche Status auf die 20 zuletzt angelegten Anfragen. Bleibt eine Anfrage offen, während anschließend 20 andere angelegt und zurückgezogen oder intern entschieden werden, fällt die offene aus der Liste. Das Widget zählt dann zu wenige oder gar keine offenen Anfragen; der Kontakt kann die alte Anfrage im Portal nicht mehr zurückziehen. Sie zählt serverseitig weiterhin zum offenen Limit und blockiert bei einer Zusatzrunde weiterhin das Projekt. Der Hinweis auf die letzten 20 Anfragen bietet keinen Weg zu ihr.
- **Empfehlung:** Alle offenen Anfragen sichtbar halten und nur die abgeschlossene Historie begrenzen, oder einen erreichbaren Nachladeweg anbieten; den Widget-Zähler unabhängig vom Historienausschnitt berechnen. Dies ist eine Lücke im Zusammenspiel der Plananforderungen selbst: Die Implementierung folgt zwar `HistoryShown`, erfüllt damit aber nicht dauerhaft „offene Anfrage zurückziehen“ und den offenen Widget-Zähler. Testfall: eine alte offene Anfrage plus 20 neuere abgeschlossene/ zurückgezogene Anfragen.

### F03 · P3 · Gleichzeitige firmenübergreifende Schlüsselkonflikte liefern 500 statt Validation

- **Fundstelle:** `apps/workspace/src/server/portal/command-handler/create-portal-service-request.command-handler.ts:58`, `:62`, `:155`; `packages/db/src/record-configuration/crm/service-requests.ts:132`; `apps/workspace/src/lib/portal/portal-service-request-api-error.ts:58`.
- **Problem und Auswirkung:** Die Sperre serialisiert nur innerhalb derselben Firma, der Idempotenzschlüssel ist jedoch global eindeutig. Senden zwei Firmen gleichzeitig denselben gültigen Schlüssel, können beide Vorprüfungen noch keine Zeile sehen. Ein Insert gewinnt; der andere scheitert am Unique-Index und wird als `internal`/500 übersetzt. Task 76 T2 Schritt 3 verspricht für den fremden Schlüssel `validation`. Das erfordert einen gezielt gleichen Schlüssel und ist bei unabhängig erzeugten UUIDs kein realistischer Zufall; die Kundentrennung wird dadurch nicht aufgehoben.
- **Empfehlung:** Den Insert-Konflikt gezielt behandeln und den bestehenden Schlüssel anschließend nach derselben Firmenregel bewerten, etwa mit `onConflictDoNothing` und erneuter Abfrage. Der Integrationstest prüft bislang nur den sequenziellen firmenübergreifenden Konflikt.

### F04 · P3 · Owner-Widget behält einen aktiven Anfrage-Button

- **Fundstelle:** `apps/workspace/src/components/portal/dashboard/widgets/portal-service-request-widget/portal-service-request-widget.tsx:45`; `apps/workspace/src/components/portal/dashboard/portal-dashboard/portal-dashboard.tsx:353`; `apps/workspace/src/components/portal/dashboard/portal-dashboard/portal-dashboard.test.tsx:652`.
- **Problem und Auswirkung:** Das Widget reicht `onOpenAction` auch bei `canRequest = false` unverändert an `Widget` weiter. Der Owner bekommt damit den aktiven Button „Leistung anfragen“, obwohl Task 76 T3 ausdrücklich einen deaktivierten Button mit CRM-Verweis verlangt. Erst im Formular ist Senden deaktiviert. Die Schreibgrenze ist geschützt; betroffen sind die Planerfüllung und die Handlungsbezeichnung. Der Owner-Test prüft Hinweis und CRM-Link, aber nicht den Buttonzustand. Diese Abweichung steht nicht in der README-Liste.
- **Empfehlung:** Den Anfrage-CTA wie geplant deaktivieren; falls das Lesen von Katalog und Anfragen über denselben Einstieg gewollt ist, einen passenden lesenden Einstieg anbieten und die Planabweichung ausdrücklich dokumentieren.

## Abgleich mit dem Plan

| Teil              | Ergebnis                                                                                                                                                                                                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T1 Katalog/Rechte | Beide Rechte in Permission-Katalog, Gruppen und Migration 0060; `portal_standard` übernimmt sie im Code über seine vorhandene Ableitung. Owner-Leseliste enthält ausschließlich das neue Leserecht. Einladungsvorschau hat ein Label in dem tatsächlich verwendeten Shell-Dictionary. DB-Katalogstand in diesem Review nicht erneut geprüft.     |
| T2 Server         | Lesen, Anlegen und Zurückziehen mit den vorgesehenen Gates und Firmenfiltern; keine Preis-/Personen-/Versionsfelder im Portal-Mapping. Eigene Kundenzeile serialisiert offene Grenze und Zusatzrunden-Duplikate. Rückzug sperrt die Anfragezeile und verwendet den gemeinsamen Übergang sowie versionierten Schreibweg. F03 bleibt als Randfall. |
| T3 Portal         | Echtes Widget, Katalog und Freitext, Projekt-/Mengenfragen, Bestätigung, Statusliste, Rückzugsbestätigung, Feedback-Verweis und DE/EN vorhanden. Kein verbleibender Mock-Registry-Eintrag oder Mock-Komponentenimport gefunden. F01, F02 und F04 bleiben.                                                                                        |
| T4 E2E            | Test und Fixture sind vorhanden und decken Kataloganfrage, Freitext, Stunden, Firmenisolation, fehlende Rechte, anonymen POST und Rückzug ab. Laut README noch kein erfolgreicher Browserlauf; in diesem Review ebenfalls nicht ausgeführt. Daher keine vollständige Abnahme.                                                                    |

Die in der README dokumentierten Abweichungen sind fachlich nachvollziehbar und keine zusätzlichen Findings: Stunden ohne bestimmtes Projekt folgen dem ausdrücklich abgestimmten Task-74-Nachtrag; `internal` ergänzt technische Fehler; 401 für anonyme Zugriffe folgt dem vorhandenen Portal-Gate; Vorschau-Label im Shell-Dictionary und direkte Fehlertexte verwenden bestehende Schnittstellen; `projectTitle` bevorzugt das tatsächlich zugewiesene sichtbare Projekt.

## Abdeckung und Zusammenspiel

Vollständig fachlich gelesen: neue Portal-Commands und Query, Service-/Schema-/Mapping-Module, Formular- und Projektwunsch-Patterns, neue DTOs und Fehler-/Limitkonstanten, Client-API-Service, Picker/Formular/Dialog/Liste/Widget, Dashboard-Orchestrator, Dashboard- und Feedback-Seiten sowie beide API-Routen. Dazu die neuen Dialog-, Mapping-, API- und Integrationstests sowie der neue Feature-E2E-Test. Relevante bestehende Bausteine wurden verfolgt: Portal-Rechtefilter und Projektsichtbarkeit, Projektwahl, Service-Request-State, DB-Constraints, interne Annahme, gemeinsame Events und Zusatzrunden-Blocker.

Die weiteren Änderungen an Permission-Definitionen/Systemrollen, Registry, Query-/Endpoint-Helfern, Dictionary-Anbindung, Feedback-Anbindung und E2E-Fixture wurden fachlich mit dem Diff abgeglichen. Umfangreiche bestehende E2E-Support-Dateien und unveränderte CRM-Bereiche wurden nicht als vollständiger Datei-/Architekturreview geprüft. CSS, Layoutqualität und allgemeiner Dateiinhalt sind nicht Gegenstand dieses Schritts. Das Zusammenspiel der Schreibwege ist grundsätzlich stimmig; die gemeinsamen Events bleiben in derselben Transaktion, Portal und CRM verwenden dieselben Übergänge und Rundenregeln.

## Prüfungen und Grenzen

- Eigener fokussierter Testlauf: **14 Dateien / 155 Tests grün**, für Form-/Projektwunsch-Patterns, Query-/Endpoint-/Widget-Konstanten, Client, API-Routen, Mapping, Dialog, Dashboard und Quota-Notice.
- Ergänzender eigener Lauf: **18 Dateien / 146 Tests grün**, für bestehende App-Routentests, Portal-Dictionary-Parität und Quota-Notice. Darunter die geänderte Feedback-Page-Prüfung. Die Quota-Notice-Tests wurden in beiden Läufen ausgeführt; die Zahlen sind keine Summe verschiedener Tests.
- Der erste Vitest-Start scheiterte in der Sandbox an `spawn EPERM`; nach Freigabe außerhalb der Sandbox liefen die Tests erfolgreich.
- Keine neuen Tests und keine Fixes angelegt. Findings F01–F04 sind aus den konkreten Codepfaden abgeleitet; ihre zusätzlichen Reproduktionsfälle wurden nicht als neue Tests ausgeführt.
- DB-Integration, Migration/DB-Smokes, vollständige Monorepo-Gates und Build in diesem Review nicht erneut ausgeführt. Die README berichtet vorherige erfolgreiche Läufe; das ist keine eigene Verifikation.
- Browser-E2E und Sichtprüfung bleiben offen. Die README nennt den Blob-/Development-OIDC-Fehler im globalen Setup als bisherigen Blocker; dieser Review hat den Fehler nicht neu reproduziert. Ein erfolgreicher echter Browserlauf ist insbesondere für URL-Navigation plus Refresh und die aktualisierte Anfrage-Liste notwendig, weil die Dashboard-Unit-Tests den Router mocken.
- Keine Secrets, Dependency-Inhalte oder produktiven Daten untersucht; keine externen Daten verändert.

## Vorschläge zur Skill-Verbesserung

Keine zusätzliche Regel erforderlich: Wechsel während asynchroner Mutationen, Pagination/Filter und konkurrierende Schreibwege sind bereits ausdrücklich im Review-Skill enthalten. Der Skill bleibt unverändert.

## Nachtrag: Behebung F01–F04 am 12.10.2026

- **F01 behoben:** Der Dialog hält den Sendezustand und sperrt Tabs, Formularwechsel und Schließen einschließlich
  Escape, Cancel und Backdrop. Wiederholen nach einem Fehler behält denselben Schlüssel. Eine externe Navigation
  kann weiterhin unmounten; spätere Antworten lösen dann keine Bestätigung oder Dashboard-Navigation aus.
- **F02 behoben:** Eine gemeinsame SQL-Abfrage liest alle offenen Anfragen und die letzten 20 abgeschlossenen,
  insgesamt nach Anlagezeit sortiert. Auch alte offene Anfragen bleiben zurückziehbar und im Widget-Zähler enthalten.
  Der Historienhinweis zählt nur abgeschlossene Anfragen und ist in DE/EN angepasst. Plan und Scope-Regeln beschreiben
  die korrigierte Grenze.
- **F03 behoben:** Der Insert fängt den Idempotenz-Unique-Konflikt gezielt ab und prüft anschließend erneut den
  vorhandenen Schlüssel. Für eine fremde Firma kommt `validation`; nur die eingefügte Anfrage bekommt Events.
- **F04 behoben:** Das Owner-Widget hat einen deaktivierten Anfrage-Button und den weiterhin erreichbaren CRM-Link.
  `Widget` unterstützt dafür eine optionale app-neutrale Disabled-Prop; `TabList` unterstützt die Sende-Sperre.

Eigene abschließende Prüfungen:

- `pnpm -r lint`: grün, nur bestehende Warnungen in anderen Dateien und allgemeine Package-Konfigurationshinweise.
- `pnpm -r typecheck`: grün nach Korrektur der Array-Übergabe an Drizzle `notInArray`.
- `pnpm -r test`: grün, **5.285 bestandene Tests** im Monorepo; darunter **3.772** Workspace-Tests. DB-Integrationen
  sind im normalen Unit-Lauf bewusst übersprungen.
- `pnpm test src/server/tests/portal/service-requests/portal-service-requests.integration.test.ts --mode crm-integration`
  in `apps/workspace`: **17 Tests grün** gegen Development, einschließlich alter offener Anfragen und eines durch
  eine Barrier erzwungenen gleichzeitigen firmenübergreifenden Schlüsselkonflikts. Isolierte Fixture-Daten wurden bereinigt.
- `pnpm --filter @invessiv/workspace build`: grün. Der bestehende Turbopack-Hinweis zur breiten dynamischen
  Env-Dateisuche in `packages/db/src/core/env.ts` bleibt bestehen.
- Fokussierte Portal-/UI-Regressionstests für verzögertes Senden, Fehler und Wiederholung, externe Navigation,
  Historienhinweis und deaktivierte Controls sind ebenfalls grün.

Browser-E2E und visuelle Abnahme wurden im Fix-Schritt nicht ausgeführt. Das zuvor dokumentierte offene
Browser-Gate bleibt bestehen. Keine neue Migration, Dependency oder Env-Variable; kein Commit und kein Merge.
