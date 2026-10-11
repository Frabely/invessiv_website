# Review: Stunden im CRM und Portal — Logik und fachliche Umsetzung

**Stand:** 11.10.2026, Branch `feat/crm-stunden-3-portal`, HEAD `78501d429d1182f6ae35f041d6785a7553e3c288`. Vergleich gegen `4c496a79`, den Stand vor dem Stunden-Feature. Arbeitsbaum vor dem Review sauber. Nur dieser Bericht wurde angelegt; keine Produktivdateien, Tests oder Daten geändert.

**Auftrag:** Gesamten fachlichen Stunden-Branch gegen `27-kontingent-und-zuweisung.md`, `72-zeitbuchungen-und-aufgaben.md`, `73-stunden-im-portal.md` und deren README prüfen. Ausschließlich Logik, fachliches Verhalten, inhaltliche Richtigkeit und konkrete Abnahmelücken. Struktur, Dateigröße, Aufteilung und Auslagerungen sind ausdrücklich Gegenstand der zweiten Runde.

**Gesamturteil:** Der fachliche Kern ist weitgehend schlüssig, aber die Umsetzung ist noch nicht durchgehend sauber. Sieben P2-Findings und drei P3-Findings; kein belegtes P0-/P1-Finding. Insbesondere Leerzustand, Konfliktprognose und Aufgaben-Abkürzung führen in erlaubten Zuständen zu falscher Anzeige oder nicht ausführbaren Aktionen. Der CRM-E2E ist nach dem Umbau der Eingabe nicht mehr ausführbar, sobald die benötigte Testsitzung konfiguriert ist.

## Abdeckung und Planabgleich

Der Branch wurde vollständig inventarisiert. Fachlich geprüft wurden die relevanten Laufzeitketten und ihre Abnahmeabsicherung; dies ist kein Volltextaudit jeder der rund 277 geänderten Dateien:

- **CRM-Schreibwege:** Kauf/Korrektur, Zuweisung/Freigabe, Zeitbuchung anlegen/ändern/löschen; zugehörige API-Routen, Client-Service, Schemas, Zugriffsprüfung, Idempotenz, Versionierung und transaktionale Activities.
- **Berechnungen und Lesen:** gemeinsamer Balance-Service, Kunden-/Projektstunden, Aufgabenzeiten, Kunden- versus Projektbindung, Keyset-Paging und DTO-/Antwortmapping.
- **CRM-Oberfläche:** Stunden-Sektion, Projektstunden, Aufgaben-Abkürzung und Erledigt-Hinweis, Eingabe- und Löschdialoge, Prognose, Listen und Historien; Anbindung an Cockpit und Projekt-Canvas.
- **Portal:** Dashboard-Anbindung, Widget-Sichtbarkeit, Dialog, Summen/Käufe/Buchungsliste, URL-Filter, Paging-Hook, Client/API, Reader- und Rechteprüfung, Statussichtbarkeit, Aufgabentitel und Portal-DTOs.
- **Daten und Abnahme:** Migrationen 0056/0057 und drei Stundenmodelle, einschlägige Permissions/Rollen, Seed und Constraint-Smoke, fachliche DB-Integrationstests sowie CRM-/Portal-E2E. Die großen bestehenden Katalog-, Dashboard-, Fixture- und Infrastrukturdateien wurden hinsichtlich ihrer Änderungen und relevanten Aufrufer geprüft; angrenzende Planung außerhalb der vier angeforderten Dokumente nur inventarisiert.
- **Texte:** relevante Stunden-Dictionaries in DE/EN und fachliche Aussagen in den vier Plänen abgeglichen. Kein Design-, CSS- oder allgemeines Architekturreview.

| Plan                            | Fachliches Ergebnis                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 27 — Kontingent und Zuweisung   | Ledger, Vorzeichen, Kauf-/Zuweisungsgrenzen und Berechnungen sind schlüssig. Kundenlock serialisiert Ledger-Schreiber; projektgebundenes Lesen liefert keine Kunden-Gesamtsummen/Kaufhistorie. Offen: F01, F05, F07, F08.                                                                                                                                                                    |
| 72 — Zeitbuchungen und Aufgaben | Berechenbare Zeit und Kulanz werden korrekt unterschieden. Überziehung ist erlaubt; kein automatischer Ausgleich zwischen Projekten. Projekt und Ausführender bleiben fest; Änderungen/Löschung prüfen Versionen; neue Verknüpfungen zu abgebrochenen Aufgaben werden abgelehnt. Offen: F02, F03, F04, F06, F09.                                                                             |
| 73 — Stunden im Portal          | Firmenbegrenzung, getrennte Rechte für Stand und Detail, Owner-Lesesicht, explizites Portal-Mapping und Aufgabentitel-Gates sind schlüssig. Verborgene Projekte werden aggregiert; Kulanz allein und vollständig korrigierte Käufe zählen als Inhalt. Die drei früheren Portal-Findings zu Filter und Reihenfolge sind behoben. Offen: F04, F10 und die unten dokumentierte HTTP-Abweichung. |
| README / Abnahme                | Fachliche Hauptinvarianten sind umgesetzt und durch vorhandene Tests teilweise abgesichert. Vollständige Merge-Gates nicht neu ausgeführt; CRM-E2E und Teile der Szenarioabdeckung erfüllen die Vorgaben noch nicht.                                                                                                                                                                         |

**Akzeptierte Änderungen berücksichtigt:** Die vom Nutzer aufgehobene 24-Stunden-Grenze wird nicht als Fehler gewertet. Der aktuelle technische Maximalwert ist 600000 Minuten pro Zeitbuchung und zwischen Konstante, Schema, Modell und Migration konsistent. Die direkt angepasste ursprüngliche Migration ist aufgrund der ausdrücklich bestätigten ausschließlich lokalen Dev-Ausführung zulässig. Die wiederverwendbare Eingabe liegt in `packages/ui` und ist über den Package-Export angebunden. „Rest danach“ wird auch vor einer Eingabe angezeigt.

## Findings

### F01 · P2 · Vorhandener Verbrauch wird als leeres Kontingent dargestellt

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/hours/customer-hours-section/customer-hours-section.tsx:55`, Empty-State ab Zeile 113.
- **Problem und Auswirkung:** Ohne Kauf-/Zuweisungszeilen wird bei `purchasedMinutes === 0` die gesamte Kundensektion als leer behandelt. Zeitbuchungen ohne Zuweisung sind aber erlaubt. Bei beispielsweise 60 berechenbaren Minuten verschwinden Verbrauch, Kundenrest −1:00 und Projektzeilen hinter „Noch keine Stunden gutgeschrieben“. Auch reine Kulanzbuchungen werden verborgen; die Cockpit-Kennzahl kann gleichzeitig einen anderen Zustand zeigen.
- **Empfehlung:** Leerzustand auch gegen Verbrauch und Kulanz prüfen; bei vorhandenen Buchungen Stand und Projekte anzeigen. Regression für berechenbare Buchung und Kulanz jeweils ohne Ledger ergänzen.

### F02 · P2 · „Rest danach“ vermischt nach Versionskonflikt unterschiedliche Datenstände

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/hours/time-entry-form-dialog/time-entry-form-dialog.tsx:107`; beteiligt: `apps/workspace/src/common/patterns/crm/hours/time-entry-form-request.ts:26` und `apps/workspace/src/hooks/workspace/use-versioned-mutation.ts`.
- **Problem und Auswirkung:** Ein 409 aktualisiert `mutation.current`, aber nicht die Projektbalance aus den Props. Beispiel: 3:00 zugewiesen, alte Buchung 1:00, alter Rest 2:00; eigene Eingabe 2:00. Ein anderer Benutzer ändert die Buchung auf 0:45. Nach dem Konflikt zeigt die Prognose `2:00 + 0:45 − 2:00 = 0:45`, tatsächlich bleiben nach der eigenen Änderung 1:00. In anderen Konstellationen kann die Anzeige eine Überziehung verdecken. Der vorhandene Konflikttest prüft die Konfliktmeldung, nicht diesen Rest.
- **Empfehlung:** Referenzbuchung und Projektbalance als zusammengehörigen Stand aktualisieren, vorzugsweise aktuelle Projektzahlen nachladen. Einen Konflikttest mit verändertem Umfang beziehungsweise Berechenbarkeit und konkreter Rest-Assertion ergänzen.

### F03 · P2 · Aufgaben bieten neue Zeitbuchungen auf geschlossenen Projekten an

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/projects/customer-projects-section/customer-projects-section.tsx:150`, Weitergabe an Aufgaben ab Zeile 251; Vergleich: `apps/workspace/src/components/workspace/crm/hours/project-hours-section/project-hours-section.tsx:84` und `apps/workspace/src/server/workspace/crm/command-handler/create-time-entry.command-handler.ts:68`.
- **Problem und Auswirkung:** Die Aufgaben-Abkürzung prüft das Schreibrecht, aber nicht den Projektstatus. Auf archivierten oder abgebrochenen Projekten lässt sich deshalb über eine nicht abgebrochene Aufgabe „Zeit buchen“ öffnen; auch der Erledigt-Hinweis kann diese Aktion anbieten. Der vollständig ausgefüllte Dialog scheitert zwangsläufig mit `PROJECT_CLOSED`. Die normale Stunden-Sektion unterdrückt dieselbe Aktion bereits korrekt.
- **Empfehlung:** Erlaubnis zum Anlegen von Schreibrechten zum Bearbeiten/Löschen unterscheiden. Den Projektstatus auch für die Aufgaben-Abkürzung prüfen, ohne dadurch erlaubte Änderungen/Löschungen alter Buchungen zu sperren. Canvas-Test für beide geschlossenen Status ergänzen.

### F04 · P2 · Ungültige Kalenderwerte im Cursor führen zu 500 statt 422

- **Fundstelle:** `packages/common/src/patterns/crm/hours/time-entry-cursor.ts:22`; SQL-Casts in `apps/workspace/src/server/shared/services/hours/time-entry-page-service.ts:24`; Aufrufer: CRM-Listenhandler Zeile 43 und `apps/workspace/src/server/portal/query-handler/list-portal-time-entries.query-handler.ts:34`.
- **Problem und Auswirkung:** Der Decoder prüft nur die Form. Beispielsweise wird `2026-13-40~2026-10-08T09:15:30.123Z~33333333-3333-4333-8333-333333333333` als Cursor akzeptiert. Beim berechtigten Listenaufruf scheitert anschließend der PostgreSQL-Cast auf `date`; die Route behandelt das als internen Fehler. Unmögliche Uhrzeiten im Timestamp haben denselben Effekt. Betrifft sowohl CRM als auch Portal; kein belegter Fremdzugriff.
- **Empfehlung:** Reale Kalendertage und gültige UTC-Zeitstempel vor den SQL-Casts prüfen und ungültige Cursor mit dem vorgesehenen Validierungsfehler ablehnen. Decoder- und Routentests für unmögliche Monate, Tage und Uhrzeiten ergänzen.

### F05 · P2 · Abgelehnte Korrektur kann den Dialog ohne erreichbare Buchungsart zurücklassen

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/hours/hour-purchase-dialog/hour-purchase-dialog.tsx:103`, bedingte Auswahl Zeile 131.
- **Problem und Auswirkung:** Der Nutzer wählt bei freien Stunden „Korrektur“. Ein anderer Nutzer weist inzwischen den gesamten freien Bestand zu; die Korrektur wird mit `BELOW_ALLOCATED_HOURS` und `freeMinutes: 0` abgelehnt. Nach Übernahme der aktuellen Balance verschwindet die Auswahl der Buchungsart, während der Zustand weiterhin `Correction` ist und das Eingabemaximum null beträgt. Im geöffneten Dialog kann der Nutzer weder korrigieren noch zurück zur möglichen Gutschrift wechseln; nur Schließen und erneutes Öffnen hilft.
- **Empfehlung:** Einen Wechsel zur Gutschrift auch bei freiem Bestand null ermöglichen und die nun unmögliche Korrektur erklären. Regression für Ablehnung mit aktualisiertem Bestand null ergänzen.

### F06 · P2 · CRM-E2E verwendet nicht mehr vorhandene Eingabefelder und lässt Kernschritte aus

- **Fundstelle:** `apps/workspace/e2e/hours.e2e.ts:36`, weitere Dauer-Selektoren Zeilen 48, 62 und 96; aktuelle Eingabe: `packages/ui/src/components/duration-input/duration-part.tsx:68`. Szenariovorgabe: `72-zeitbuchungen-und-aufgaben.md:262`; Seed: `packages/db/scripts/crm-fixture/seed-hours.ts` (`task_id: null`).
- **Problem und Auswirkung:** Der E2E sucht ein `textbox` für Stunden/Dauer und ruft `.fill()` auf. Die aktuelle Dauerkomponente enthält dafür ausschließlich `div`-Spinbuttons. Mit konfigurierter Clerk-Sitzung wartet der Test bereits bei der ersten Gutschrift auf ein nicht existierendes Element; ohne Konfiguration wird er übersprungen. Zusätzlich fehlen weiterhin die vorgegebenen Schritte Buchung mit Aufgabe, Prüfung konkreter Restwerte und Bearbeitung vor Löschung. Der Stunden-Seed bietet ebenfalls keine Buchung mit Aufgabe.
- **Empfehlung:** E2E auf die tatsächlich bedienbaren Spinbuttons umstellen und den vollständigen Aufgaben-/Änderungs-/Balancefluss prüfen; Seed um mindestens eine gültige Aufgabenverknüpfung ergänzen. Das Merge-Gate erst nach tatsächlichem authentifiziertem Lauf als erfüllt behandeln.

### F07 · P2 · Dialoge erlauben Ledger-Buchungen oberhalb des serverseitigen Einzelbuchungslimits

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/hours/hour-allocation-dialog/hour-allocation-dialog.tsx:64`, Clientvalidierung Zeile 73, „Alles“-Aktion Zeile 145 und Eingabemaximum Zeile 170; Korrekturmaximum in `apps/workspace/src/components/workspace/crm/hours/hour-purchase-dialog/hour-purchase-dialog.tsx:66`. Gegenprüfung: `apps/workspace/src/server/workspace/crm/services/hours/hours-schemas.ts:14`.
- **Problem und Auswirkung:** Freie beziehungsweise freigebbare Minuten sind aggregierte Bestände und dürfen 600000 überschreiten. Nach zwei zulässigen Gutschriften à 600000 Minuten erlaubt der Zuweisungsdialog 1200000 Minuten; „Alles“ setzt genau diesen Wert, die Clientvalidierung akzeptiert ihn. Der Server lehnt ihn dennoch als `VALIDATION_ERROR` ab, weil `MaxLedgerMinutes` pro Zeile gilt. Freigeben und Korrektur haben denselben Grenzfehler. Hoher, aber durch gültige Buchungen erreichbarer Bestand; keine Datenkorruption.
- **Empfehlung:** Für Eingabe und Validierung `min(verfügbarer Bestand, MaxLedgerMinutes)` verwenden. Die Bestandsinformation darf die Gesamtsumme weiter zeigen; „Alles“ muss das Einzelbuchungslimit beachten oder mehrere explizit unterstützte Buchungen auslösen. Regression mit Bestand oberhalb des Limits ergänzen.

### F08 · P3 · Zuweisungshistorie zeigt rund um Mitternacht den falschen Geschäftstag

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/hours/hours-history-list/hours-history-list.tsx:77`; vorhandene Alternative: `apps/workspace/src/lib/i18n/format-moment-day.ts`.
- **Problem und Auswirkung:** `createdAt.slice(0, 10)` entfernt die Uhrzeit vor der Umrechnung nach Europe/Berlin. Eine Zuweisung am 11.10. um 00:30 Uhr Berliner Zeit hat `createdAt = 2026-10-10T22:30:00.000Z` und erscheint als 10.10. Kauf-/Leistungsdaten sind echte DATE-Werte und dürfen dagegen ohne Zeitumrechnung formatiert werden.
- **Empfehlung:** Zuweisungszeitpunkte mit `formatMomentDay(createdAt, locale)` darstellen; einen Test um lokale Mitternacht ergänzen.

### F09 · P3 · Texte versprechen Kontingentänderungen auch bei Kulanz

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/hours/time-entry-delete-dialog/time-entry-delete-dialog.tsx:58`; `apps/workspace/src/i18n/dictionaries/workspace/crm/hours/de.json:161` und `en.json:161`. Weitere Aussagen in beiden Dictionaries: `emptyDescription` und `emptyUnallocated`, Zeilen 116/117, genutzt von `project-hours-section`.
- **Problem und Auswirkung:** Der Löschdialog behauptet bei jeder Buchung, die Dauer werde dem Projekt wieder gutgeschrieben. Bei Kulanz ist diese Dauer nie in Verbrauch oder Rest eingegangen; die Löschung erhöht das Kontingent deshalb nicht. Das gilt auch, wenn ein Versionskonflikt die aktuelle Buchung von berechenbar auf Kulanz geändert hat. Ebenso sagen die Leerzustände pauschal, jede Buchung ziehe Stunden ab und eine Buchung ohne Zuweisung führe sofort ins Minus; für Kulanz stimmt beides nicht.
- **Empfehlung:** Einen für beide Arten korrekten Löschtext verwenden oder die Beschreibung anhand der aktuellen Berechenbarkeit wählen; Aussagen zum Verbrauch ausdrücklich auf berechenbare Buchungen beziehen. DE/EN synchron anpassen und Kulanzfall prüfen.

### F10 · P3 · Erklärung von „Frühere Projekte“ benennt die falsche Statusgruppe

- **Fundstelle:** `apps/workspace/src/i18n/dictionaries/portal/hours/de.json:19` und `en.json:19`; tatsächliche Auswahl: `apps/workspace/src/server/portal/shared/portal-project-condition.ts` und `packages/common/src/constants/portal/portal-visible-project-statuses.ts`.
- **Problem und Auswirkung:** Der Hinweis erklärt die Sammelzeile als abgeschlossene Projekte, die nicht mehr einzeln aufgeführt werden. `Completed` ist jedoch portal-sichtbar und kann weiterhin eine eigene Stundenzeile haben. Aggregiert werden insbesondere archivierte und abgebrochene Projekte mit Stunden. Der Text erklärt die Anzeige deshalb fachlich falsch.
- **Empfehlung:** In beiden Sprachen neutral von Projekten sprechen, die nicht mehr einzeln im Portal angezeigt werden, oder die tatsächliche Auswahl korrekt erklären.

## Frühere Findings und offene Planabweichungen

- Aus dem Review vom 08.10. bleiben dessen F01–F05 und F08 fachlich bestehen; oben mit aktuellen Fundstellen erneut abgesichert. Die damalige E2E-Lücke besteht weiter und hat durch die neue Eingabe einen zusätzlichen konkreten Testbruch. Das damalige Architektur-Finding zum Cursor-Typ ist gemäß Auftrag in dieser Runde nicht bewertet.
- Die drei Portal-Findings vom 09.10. zu Ein-Projekt-Filter, reaktivem URL-/Projektzustand und Reihenfolge sind behoben; entsprechende vorhandene Regressionstests sind grün. Sie werden nicht erneut als offene Fehler gezählt.
- **Anonymer Portal-API-Aufruf:** Task 73 verlangt in seinem E2E-Szenario 404, die bestehende Auth-Abbildung in `portal-api-auth-error.ts:14` und der E2E `portal-hours.e2e.ts:46` liefern beziehungsweise erwarten 401. Fremde Firma und fehlendes Detailrecht ergeben 404. Kein belegtes Kundeninformationsleck; vor Abnahme Plan und bewusst verwendeten Auth-Vertrag vereinheitlichen. Als dokumentierte Akzeptanzabweichung geführt, nicht als zusätzliche Sicherheitslücke.
- **Veraltete Planstände:** README Zeilen 127/227 und Task 72 Zeilen 38/117/147 nennen weiterhin 1440 Minuten und die Ablehnung von 1455. Diese Vorgaben sind durch die ausdrückliche Nutzerentscheidung überholt; Konstante/DB/Schema verwenden nun 600000. Die Planbeschreibung der Eingabe entspricht ebenfalls nicht vollständig der inzwischen ausgelagerten Spinbutton-Komponente. Dokumentation nachziehen, keine Rückkehr zur aufgehobenen 24-Stunden-Grenze.
- **Produktive Beschreibungen:** Die in Task 73 geforderte Prüfung, ob vorhandene Buchungsbeschreibungen kundentauglich sind, wurde nicht anhand produktiver Daten durchgeführt. Der Code kennzeichnet neue Beschreibungen als kundensichtbar und gibt sie gewollt im Portal aus.

## Ausgeführte Prüfungen und Grenzen

- Fokussierte Workspace-Tests für Stunden-UI, Aufgabenanbindung, API-Services, API-Routen, Mapper, Formular-/Paging-Patterns und Hooks: **18 Dateien, 187 Tests grün**.
- Weitere bestehende Workspace-Tests für Portal-Dashboard, Widget-Registry/-Sichtbarkeit, Endpoint-Regeln und Portal-Dictionary: **5 Dateien, 78 Tests grün**.
- Common: Stunden-Patterns, Cursor, Konstanten und Portal-Stunden-DTOs/Error-Codes: **7 Dateien, 44 Tests grün**.
- UI: DurationInput: **1 Datei, 9 Tests grün**. DB-Paket: Stunden-Constraint-Namen: **1 Datei, 5 Tests grün**; dies ist kein echter DB-Constraint-Smoke.
- Insgesamt **32 Testdateien, 323 Tests grün**. Sandbox-`spawn EPERM` beim Common-Lauf wurde durch den freigegebenen Lauf außerhalb der Sandbox aufgelöst; kein fachlicher Testfehler. Die bestätigten Findings beruhen auf den Implementierungen und ihren Aufrufern; keine neuen Reproduktionstests angelegt.
- **Nicht ausgeführt:** Migration/Seed, schreibende DB-Smokes und DB-Integrationstests, authentifizierte Clerk-E2E, vollständiger Monorepo-Test-/Lint-/Typecheck-Lauf, App-Build und Browserprüfung. Die DB-/E2E-Pfade wurden statisch beurteilt; Fremdzugriff und Nebenläufigkeit sind durch dieses Review nicht neu gegen eine echte Datenbank bestätigt. Keine vollständige Merge-Freigabe.
- Struktur, Splitten/Auslagern, allgemeine Dateiinhalte außerhalb der fachlichen Stundenketten und gestalterische Qualität bleiben für Runde zwei. Keine Secrets oder lokalen Secret-Dateien als Reviewquelle verwendet.

## Vorschläge zur Skill-Verbesserung

Keine zusätzliche dauerhafte Anweisung vorgeschlagen. Konfliktkonsistenz, Abgleich von Client- und Servergrenzen, Kalenderwerte und veraltete E2E-Selektoren sind durch die bestehenden fachlichen Prüfschwerpunkte abgedeckt. Skill unverändert.
