# Review: Leistungsanfragen gegen master

- **Stand:** 13.10.2026, Branch `feat/crm-leistungsanfragen-3-portal`, HEAD `289950a7`; lokaler `master` `f325a246`. `master` ist Vorfahr von HEAD, der Branch enthält neun zusätzliche Commits und 475 geänderte Dateipfade. Kein Fetch durchgeführt.
- **Arbeitsbaum:** vor dem Review sauber. Keine Produktivdateien, Tests, Skills oder Pläne geändert; einzige dauerhafte Ausgabe ist dieser Bericht.
- **Soll:** Task 74, Task 75, Task 76 und README unter `apps/workspace/plans/crm/13c-portal-leistungsanfragen/`, einschließlich der dort festgehaltenen Nachträge und bereits umgesetzten Review-Korrekturen.
- **Gesamturteil:** Vor dem Merge nacharbeiten. Acht belegte Findings: **1 × P1, 6 × P2, 1 × P3**. Die zentralen Schreibwege sind transaktional und die Firmenfilter serverseitig vorhanden; die verbleibenden Probleme liegen vor allem in Angebotsübernahme, Wiederholung nach Transportfehlern und der Konsistenz zwischen Rechteprüfungen und UI.

## Abdeckung und Architektur

Alle geänderten Pfade wurden inventarisiert. Vollständig gelesen und im Zusammenspiel verfolgt wurden die neuen Anfrage-Commands und Queries beider Welten, deren Access-/Mapping-/Schema-Services, die vier API-Routen und beide Client-Services, die Zuweisung von Projektleistungen einschließlich Stundenledger und zusätzlicher Feedbackrunde, die Annahme-/Angebots-/Portalformular-Patterns und die wesentlichen Dialog-, Eingangs- und Dashboard-Komponenten. Dazu gehören die beteiligten View-Models, CRM-/Portal-Gates, Kundencontainer-Leser, die Migration `0058`, das Anfragemodell, die bestehenden Projektregeln und die drei zentralen neuen DB-Integrationssuiten. Die zwei neuen Browserabläufe wurden gelesen; gemeinsame UI-Änderungen wurden anhand ihres Codes beziehungsweise Diffs und fokussierter Tests geprüft.

Die Trennung Portal/Workspace, die gemeinsame Ereignis- und Rundenlogik unter `server/shared`, die zentralisierte Zuweisung sowie die getrennten Client-Services passen zur Architektur. Die Extraktion von Projekt-/Vorlagen-Inserts und Leistungsfeldern vermeidet größere Fachlogikduplikate. Kein belegter firmenübergreifender Zugriff oder Preis-Leak über die neuen Portal-DTOs gefunden. Die Request-Sperre verhindert doppelte Annahme; Fehler nach neu angelegten Projekten/Vorlagen führen über `AcceptanceFailure` zum Rollback. Die dokumentierte Zusammenlegung der ausschließlich vor dem Merge verwendeten Migrationen wurde als vereinbarte Ausgangslage bewertet, nicht erneut als Finding gemeldet.

**Prüfgrenze:** Das ist eine Prüfung der zentralen Feature-Flows und ihrer Abhängigkeiten, keine Behauptung einer vollständigen manuellen Prüfung jeder Zeile aller 475 Dateien. Insbesondere sämtliche kosmetischen CSS-/Dictionary-Änderungen, verschobene Altpläne, alle extrahierten E2E-Fixtures und jede einzelne neue Testdatei wurden nicht vollständig manuell gelesen. Kein Browser-/A11y-Smoke und keine echten DB- oder externen Schreibprüfungen ausgeführt. Generierte Ausgaben, Dependencies, Binär- und Secret-Dateien wurden nicht als Review-Quellen gelesen.

## Findings

### F01 · P1 · Ersatzvorlage überschreibt den gespeicherten Angebotspreis

- **Fundstelle:** `apps/workspace/src/common/patterns/crm/service-requests/service-request-accept-form.ts:91` (`applyServiceRequestTemplate`); Aufruf in `apps/workspace/src/components/workspace/crm/service-requests/service-request-accept-dialog/service-request-accept-dialog.tsx` (`selectTemplate`), Auswahl in `service-request-template-fields/service-request-template-fields.tsx`.
- **Problem und Auswirkung:** Ist die ursprüngliche Katalogvorlage nach einem Angebot archiviert oder wählt das Team für eine Freitextanfrage eine bestehende Vorlage, muss es im Annahme-Dialog eine Vorlage auswählen. Diese Auswahl ersetzt über `createLineItemFieldsFormValues` auch den bereits aus `offeredPriceCents` übernommenen Preis. Reproduziert: gespeichertes Angebot **990 €**, Ersatzvorlage **125 €** → Formular und anschließender Annahme-Request buchen **125 €**, ohne bewusste Preisänderung. Der Server übernimmt die gesendeten Leistungsfelder und erkennt die Abweichung nicht.
- **Empfehlung:** Bei einer angebotenen Anfrage die Angebotswerte beim Vorlagenwechsel erhalten. Nur Herkunft sowie gewünschte Titel-/Beschreibungsvorbelegung ersetzen; eine Änderung der angebotenen Konditionen separat und ausdrücklich behandeln. Regression für archivierte Vorlage und Freitext → bestehende Vorlage ergänzen.

### F02 · P2 · Bearbeiteter Retry bestätigt alte statt neuer Anfrageinhalte

- **Fundstelle:** `apps/workspace/src/components/portal/service-requests/portal-service-request-form/portal-service-request-form.tsx:103`, `:130`, `:162`, `:168`, `:171`; `apps/workspace/src/server/portal/command-handler/create-portal-service-request.command-handler.ts:47`, `:85`; Transportfehler in `apps/workspace/src/client/shared/versioned-json-mutation-service.ts:34`.
- **Problem und Auswirkung:** Wird eine Anfrage erfolgreich gespeichert, ihre HTTP-Antwort geht aber verloren, zeigt das Formular einen Fehler und lässt seine Felder weiter bearbeiten. Ein erneuter Submit sendet die geänderten Werte mit demselben Schlüssel; der Server bestätigt ausschließlich die schon gespeicherte Zeile, ohne den Inhalt zu vergleichen. Beispiel: zuerst 5 Stunden, nach dem Fehler auf 10 geändert → Erfolgsmeldung, aber weiterhin nur 5 Stunden gespeichert. Bei Freitext wird sogar der neue Titel angekündigt, obwohl die alte Anfrage bestätigt wurde. Der vorhandene Retry-Test prüft unveränderte Eingaben und deckt das nicht ab.
- **Empfehlung:** Einen begonnenen Versuch samt Payload für unklare Transportfehler festhalten und genau diesen wiederholen beziehungsweise vor einer Änderung seinen gespeicherten Stand klären. Alternativ abweichende Payloads für einen belegten Schlüssel erkennen und erklären. Nicht einfach nach einem Transportfehler einen neuen Schlüssel erzeugen: Das könnte eine zweite Anfrage anlegen.

### F03 · P2 · Eigenständige Anfrage-Rechte führen vom Eingang in ein gesperrtes Cockpit

- **Fundstelle:** `apps/workspace/src/app/[locale]/(app)/crm/service-requests/page.tsx:41`; `apps/workspace/src/components/workspace/crm/service-requests/service-request-inbox-table/service-request-inbox-table.tsx:62`; Ziel-Gate `apps/workspace/src/app/[locale]/(app)/crm/page.tsx:78` und `apps/workspace/src/lib/auth/permissions.ts:71`; Kundencontainer in `apps/workspace/src/server/workspace/crm/query-handler/get-customer-cockpit-by-id.query-handler.ts`.
- **Problem und Auswirkung:** Eine gültige kundengebundene Rolle mit `service_requests.read/write`, aber ohne `customers.read`, `projects.read` und `project_line_items.read`, darf Eingang und Sidebar sehen. Jede Anfrage verlinkt jedoch ausschließlich ins CRM-Cockpit; dessen Bereichs-Gate lehnt dieselbe Rolle mit 404 ab. Damit kann sie trotz Schreibrecht weder Angebote noch Ablehnungen bearbeiten. Bei ausschließlich globalen Anfrage-Rechten fehlt darüber hinaus ohne Kundenleserecht oder Scope-Bindung die Kundencontainer-Sichtbarkeit im Cockpit-Leser.
- **Empfehlung:** Den vollständigen Weg Eingang → autorisierte Anfrageansicht → Aktion für eigenständige Anfrage-Rechte ermöglichen, mit minimalem Kundencontainer und weiterhin getrennten Stammdatenrechten. Bereichs-Gate und Kundencontainer gemeinsam prüfen; nur den Link oder nur das Gate zu ändern genügt nicht. Seitentest mit einer Rolle, die ausschließlich Anfrage-Rechte besitzt.

### F04 · P2 · Zusatzrunde wird je nach UI mit unterschiedlichen Rechten gesperrt

- **Fundstelle:** `apps/workspace/src/lib/workspace/crm/project-line-items-view-model.ts:61`; `apps/workspace/src/server/workspace/crm/services/project-line-item-assignment-service.ts:223` und `:207`; Gegenpfad `apps/workspace/src/server/workspace/crm/query-handler/list-service-request-assignment-projects.query-handler.ts:39`; eigentliche Schreibprüfung in `project-line-item-assignment-service.ts:141`.
- **Problem und Auswirkung:** Mit `project_line_items.read/write`, `projects.write` und Katalogleserecht, aber ohne `projects.read`, darf der Server eine Zusatzrunde zuweisen. Der normale Leistungsbereich erhält jedoch `candidate.project = null` und meldet deshalb `MissingProjectPermission`; seine Vorlagenoption bleibt deaktiviert. Die Annahme einer Leistungsanfrage ermittelt die Spur dagegen mit `projects.write` und erlaubt denselben Vorgang. Es handelt sich nicht um ein fehlendes Schreibrecht, sondern um eine zusätzliche Leseschranke nur in einer Oberfläche.
- **Empfehlung:** Die benötigten Spurdaten für die Zuweisungsprüfung nach derselben Autorisierung laden, die der Command verwendet, ohne das vollständige Projekt-DTO freizugeben. Oder ein zusätzlich benötigtes Leserecht bewusst in sämtlichen Pfaden einheitlich durchsetzen. Regression für diese Rechtekombination in beiden View-Models.

### F05 · P2 · Projekt-Titellimit widerspricht Anfrageformular und Vorbelegung

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/service-requests/service-request-project-fields/service-request-project-fields.tsx:80`; `apps/workspace/src/common/patterns/crm/service-requests/service-request-accept-form.ts:72`, `:109`, `:124`; Serverregel `apps/workspace/src/server/workspace/crm/services/project-schemas.ts:24`.
- **Problem und Auswirkung:** Anfragetitel dürfen 200 Zeichen lang sein. Sie werden unverändert als Titel eines neuen Projekts vorbelegt; dessen Eingabe verwendet ebenfalls das 200-Zeichen-Anfragelimit und die Clientvalidierung prüft nur auf Leertext. Das Projektschema akzeptiert dagegen höchstens 160 Zeichen. Reproduziert mit einer gültigen 200-Zeichen-Freitextanfrage: Clientvalidierung `true`, Serverschema `false` am Pfad `project.project.title`. Der sichtbare, scheinbar gültige Standardablauf endet mit einem generischen Validierungsfehler.
- **Empfehlung:** Das Projekt-Titellimit zentral definieren und in Projektschema, Eingabefeld und Clientvalidierung verwenden. Zu lange Vorbelegungen sichtbar am Projektfeld zur Kürzung auffordern; den Anfragetitel erhalten. Grenzfälle 160/161/200 prüfen.

### F06 · P2 · Angebot hält Preisart und Intervall nicht fest

- **Fundstelle:** `apps/workspace/src/server/workspace/crm/command-handler/change-service-request-status.command-handler.ts:63`; `apps/workspace/src/components/workspace/crm/service-requests/service-request-offer-dialog/service-request-offer-dialog.tsx` (Preisfeld); `apps/workspace/src/common/patterns/crm/service-requests/service-request-accept-form.ts:51`; `apps/workspace/src/lib/workspace/crm/describe-service-request-offer.ts`.
- **Problem und Auswirkung:** Standardleistungen dürfen einmalig, als Satz oder wiederkehrend monatlich/jährlich bepreist sein. Das Angebot speichert nur Centbetrag und gegebenenfalls Stunden, zeigt bei Standardleistungen aber nicht die dazugehörige Preisart beziehungsweise das Intervall. Bei der späteren Annahme stammen diese Konditionen aus der inzwischen aktuellen Vorlage. Wird eine angebotene monatliche Leistung vor der Zusage auf jährlich oder einmalig geändert, übernimmt der Dialog den alten Betrag mit der neuen Preisart; der gespeicherte Angebotsstand kann den Unterschied weder rekonstruieren noch anzeigen. Bei angebotenen Freitextleistungen fehlt eine Konditionsquelle vollständig.
- **Empfehlung:** Ein internes Angebot als zusammengehörige Konditionen aus Betrag, Preisart und gegebenenfalls Intervall erfassen, anzeigen und für die Annahme vorbelegen. Das Portal bleibt ohne diese Preisfelder. Test: Angebot erfassen → Katalogintervall ändern → Annahme behält ursprüngliche Konditionen.

### F07 · P2 · Statusfeld der Projektleistung erneut in den Annahme-Dialog kopiert

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/projects/project-line-item-form-dialog/project-line-item-form-dialog.tsx:310`; `apps/workspace/src/components/workspace/crm/service-requests/service-request-accept-dialog/service-request-accept-dialog.tsx:248`.
- **Problem und Auswirkung:** Beide Dialoge enthalten denselben Block aus `FormField`, `CustomSelect`, Status-Cast und Mapping von `PROJECT_LINE_ITEM_STATUS_VALUES` auf dieselben Dictionary-Labels. Beide verstecken das Feld bei automatisierten Leistungsarten. Die gemeinsame Identitäts-/Preisextraktion lässt diesen wiederkehrenden Renderer zurück; bereits jetzt reichen die beiden Fassungen die Control-Attribute unterschiedlich weiter. Das verletzt Root-`AGENTS.md`, Abschnitt „Keine Logik-Duplikate“, und verteilt Änderungen an demselben Leistungsfeld auf zwei Implementierungen.
- **Empfehlung:** Das Statusfeld als gemeinsame CRM-Komponente unter `components/workspace/crm/shared/line-item-status-field/` extrahieren. Labels, Wert und Änderungsaktion als Props; der bestehende Fachunterschied zwischen Katalogstatus und Projektleistungsstatus bleibt erhalten.

### F08 · P3 · Neue Browsertests umgehen die verbindlichen HTTP-Konstanten

- **Fundstelle:** `apps/workspace/e2e/portal-services.e2e.ts:57`, `:61`, `:74`, `:75`; `apps/workspace/e2e/workspace-service-requests.e2e.ts:160`, `:170`, `:223`.
- **Problem und Auswirkung:** Die neuen Tests benutzen unter anderem `401`, `404`, `422`, `200`, `"PATCH"` und `"cache-control"` als Literale. `apps/workspace/src/server/AGENTS.md`, Abschnitt „HTTP-Konstanten (verbindlich)“, verlangt diese Konstanten ausdrücklich auch für neue Tests; zusätzlich fordert `plans/crm/AGENTS.md` zentrale Statuscodes. Dadurch wird der bereits zentralisierte HTTP-Vertrag in den neuen Prüfungen erneut separat gepflegt.
- **Empfehlung:** `HttpResponseCode`, `HttpMethod` und `HttpHeaderName` in beiden neuen Browsertests verwenden.

## Prüfungen

| Prüfung                                                                                                                                       | Ergebnis                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace: `vitest run service-request portal-service-request project-line-item-form line-item-template-form portal-dashboard --reporter=dot` | 38 Dateien / **238 Tests bestanden**; drei Dateien / **39 DB-Integrationstests übersprungen**, da kein Integrationsmodus aktiviert wurde |
| UI: `vitest run custom-select tab-list data-table button widget --reporter=dot`                                                               | sechs Dateien / **28 Tests bestanden**                                                                                                   |
| Common: `vitest run service-request extra-feedback-round project-line-item-value portal-services-dto permissions system-role --reporter=dot`  | zwölf Dateien / **50 Tests bestanden**                                                                                                   |
| `pnpm --filter @invessiv/workspace typecheck`                                                                                                 | bestanden                                                                                                                                |
| Zwei zusätzliche Ausführungen der vorhandenen Formularhelfer/Serverschemas, ohne neue Dateien                                                 | F01 und F05 reproduziert; nach Korrektur der temporären CommonJS-Loaderkonfiguration erfolgreich                                         |

Insgesamt **316 Tests bestanden**, 39 übersprungen. Die Workspace-Tests melden React-Warnungen über das Spread einer `key`-Prop in `customer-service-requests-section`; die Tests bestehen dennoch. Das ist kein zusätzlicher Funktionsbefund.

Nicht ausgeführt: vollständige Monorepo-Gates, App-Build, DB-Smokes, DB-Integration und Browser-E2E. Die DB-/E2E-Kommandos legen Fixture-Daten an, führen teilweise Migrationen aus und greifen auf externe Dienste zu. Die README dokumentiert außerdem einen noch offenen Portal-E2E-Lauf wegen lokaler Blob/OIDC-Konfiguration; dieser Umgebungsfehler wurde hier nicht erneut getestet. Die dokumentierten früheren grünen Gates sind kein Nachweis eines in diesem Review ausgeführten Laufs.

## Offene Fragen und verbleibende Risiken

- Bei Legacy-Projekten mit `feedback_round_positions = NULL` behandelt Migration `0044` die Spur bewusst als „keine Runden“, während `included_feedback_rounds` einen alten positiven Wert behalten kann. `addExtraRoundStep` setzt diesen Wert beim ersten Zukauf auf die Länge der neuen Spur, also eins. Ob der alte numerische Umfang als vertragliches Kontingent erhalten werden muss, sollte vor einem Zukauf auf solchen Beständen entschieden werden; wegen der dokumentierten NULL-Semantik kein bestätigtes Finding.
- Für F01–F06 fehlen gezielte Regressionen zu den hier benannten Übergängen beziehungsweise Rechtekombinationen. Grüne Unit-Tests und Typecheck ersetzen diese fachlichen Prüfungen nicht.
- Visuelle Qualität, Themes, Tastaturbedienung und das tatsächliche Zusammenspiel von Next-Navigation und Refresh im Browser bleiben ohne Browserlauf ungeprüft.

## Vorschläge zur Skill-Verbesserung

Keine zusätzliche Regel vorgeschlagen. Die beobachteten Muster werden bereits durch die vorhandenen Vorgaben zu vollständigen Flows, Rechtekonsistenz, Wiederholungen, veralteten Clientständen und Duplikaten abgedeckt. Der Skill bleibt unverändert.

## Nacharbeit vom 13.10.2026

**F01–F08 sind im Arbeitsbaum behoben.** Die vorstehenden Findings dokumentieren den ursprünglichen Review-Stand. Umsetzung, Migrationen, Deployment-Reihenfolge und Rollback stehen im [Plan-Nachtrag](../plans/crm/13c-portal-leistungsanfragen/README.md#review-nacharbeit-vom-13102026).

Angebotsbetrag, Preisart und Intervall werden gemeinsam festgehalten und bleiben beim Vorlagenwechsel erhalten. Ungeklärte Portal-Retries wiederholen denselben eingefrorenen Payload. Eigenständige Anfrage-Rechte ermöglichen den minimalen Cockpit-Container ohne Stammdatenfreigabe. Beide Zusatzrunden-Vorschauen verwenden dieselbe Zuweisungsprüfung. Das Projekttitellimit ist zentral und wird am Feld erklärt; Statusfeld und HTTP-Konstanten sind vereinheitlicht.

Lint, Typecheck, vollständige Monorepo-Tests und Workspace-Build sind grün. Zusätzlich bestehen 48 echte DB-Integrationstests und 313 CRM-Constraint-Prüfungen. Migrationen `0059` und `0060` sind in Development angewendet. Ältere Angebote ohne Konditions-Snapshot bleiben historisch unbekannt; der Annahme-Dialog weist ausdrücklich auf die nötige Prüfung hin.

**Verbleibende Prüfgrenze:** Browser-E2E wurde erneut versucht. Das gemeinsame Setup scheitert an der Vercel-Blob/OIDC-Konfiguration für Development; die beiden Fachtests sowie Browser-/A11y-Smoke bleiben dadurch offen. Das ist kein grüner E2E-Nachweis. Die ursprüngliche offene Frage zum Legacy-Feedbackkontingent bleibt unverändert.
