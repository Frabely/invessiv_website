# Rückfragen pro Feedbackpunkt und reversible Ergebnisse

Stand: 19.10.2026. Status: **28.1 umgesetzt (Abnahmereste siehe Task 78); 28.2 und 28.3 im Review**.

Dieser Plan ist die eigenständige fachliche Umsetzungsspezifikation; der zugehörige Chat ist nicht erforderlich.
Task 78, der Serverteil aus Task 79 sowie UI und Ablösung der globalen Rückgabe aus Task 80 sind umgesetzt. Alle Pfade
in diesem Dokument beziehen sich auf die Repository-Wurzel, sofern sie nicht ausdrücklich als relative
Dokumentverweise geschrieben sind.

### Teilschritte

Die Umsetzung ist in drei Task-Pläne geschnitten (Neuschnitt 18.10.2026, mit dem Owner abgestimmt). Alle drei
werden nacheinander auf **einem** Branch `feat/crm-feedback-rueckfragen` umgesetzt. Jeder Teil hinterlässt einen
eigenständig deploybaren Stand und ist – in dieser Reihenfolge – auch einzeln mergebar. Die Task-Pläne nennen
Dateien, Abläufe und Tests konkret; die fachlichen Regeln stehen weiterhin in den Abschnitten 1–7 dieser README.

| Teil | Task | Plan                                                                           | Inhalt                                                            | Sichtbar nach Merge     | Status    |
| ---- | ---- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ----------------------- | --------- |
| 28.1 | 78   | [78-ergebnishistorie-und-noch-offen.md](78-ergebnishistorie-und-noch-offen.md) | Ergebnishistorie, „Noch offen“ zurücksetzbar, Historie im Cockpit | ja, Cockpit             | läuft     |
| 28.2 | 79   | [79-rueckfragen-server.md](79-rueckfragen-server.md)                           | Rückfragen-Tabelle, Commands, Routen, Sperren, Chat-Ereignisse    | nein (kein UI-Einstieg) | im Review |
| 28.3 | 80   | [80-rueckfragen-ui-und-abloesung.md](80-rueckfragen-ui-und-abloesung.md)       | Cockpit- und Portal-UI, globale Rückgabe entfernt, E2E, Doku      | ja, Cockpit und Portal  | im Review |

**Abweichungen von der ursprünglichen Fassung (18.10.2026, verbindlich):**

- **Kein Feature-Schalter.** Jeder Teil ist ab Merge verfügbar. Teil 28.2 bleibt unsichtbar, weil keine Oberfläche
  auf die neuen Routen zeigt; Teil 28.3 schaltet die Funktion durch Auslieferung frei.
- **Kein Backfill.** Bestehende Runden haben keine Rückfragen. Für die Ergebnishistorie genügt der Ausgangsstand
  (`baseline`), den jeder Ergebnis-Schreibweg vor der ersten Änderung eines bereits bewerteten Punkts in derselben
  Transaktion anlegt. Unveränderte Punkte zeigen ihr aktuelles Ergebnis ohnehin direkt; ein vorab angelegter
  Ausgangseintrag würde keine zusätzliche Information liefern.

## 0. Einstieg ohne Gesprächskontext

### Ausgangslage und Problem

Kunden reichen eine Feedbackrunde mit mehreren Punkten ein. Intern kann jeder Punkt bisher nur eines der Ergebnisse
`implemented`, `not_implemented` oder `additional_service` erhalten. Für die letzten beiden gibt es eine
Ergebnisbegründung, die der Kunde erst nach Abschluss der Runde sieht. „Noch offen“ ist bislang lediglich die Anzeige
für `result = null`; nach der ersten Ergebniswahl lässt sich dieser Zustand weder im Select noch über die API
wiederherstellen. Eine Rückfrage zu einem einzelnen Punkt existiert nicht. Die bisherige globale Rückgabe öffnet
stattdessen die ganze Runde erneut zur Bearbeitung und greift in deren Sammelaufgabe ein.

Das neue Feature trennt **Klärung während der Bearbeitung** von **abschließendem Ergebnis**. Rückfragen sind sofort
beim nächsten Laden im Portal sichtbar, Ergebnisse weiterhin erst nach Rundenabschluss. Rückfragen sind keine
weitere Ergebnisart, keine neue Feedbackrunde und kein vollständiger Nachrichten-Chat.

### Verbindliche Lese- und Änderungsstellen

Vor Beginn Root- und Scope-`AGENTS.md` lesen; insbesondere `apps/workspace/plans/crm/AGENTS.md`, Portal-/CRM-UI,
Server/Shared, `packages/common` und DB-Regeln. Für Frontend-Arbeiten gelten `frontend-design`, für neue UI-Texte
`copywriting`; der spätere Code-Review folgt `invessiv-workspace-review`.

| Verantwortung                              | Bestehende Anknüpfungspunkte                                                                                                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Rundenstatus und Übergänge                 | `packages/common/src/constants/crm/feedback-round-statuses.ts`, `feedback-round-transitions.ts` im selben Ordner                                                                                                                     |
| Punkt und DB-Constraints                   | `packages/db/src/record-configuration/crm/feedback-round-items.ts`; neue Tabellen im selben Scope und Barrel                                                                                                                         |
| Aktuelle DTOs                              | `packages/common/src/contracts/crm/feedback-round-item.dto.ts`, `packages/common/src/contracts/portal/portal-feedback-item.dto.ts`                                                                                                   |
| Ergebnisänderung und Abschluss             | `apps/workspace/src/server/workspace/crm/command-handler/set-feedback-item-result.command-handler.ts`, `change-feedback-round-status.command-handler.ts` im selben Ordner                                                            |
| Geteilte Persistenz und Entwurfsänderungen | `apps/workspace/src/server/shared/services/feedback/feedback-round-item-service.ts`, `feedback-round-write-service.ts` im selben Ordner                                                                                              |
| Portalautorisierung und Mapping            | `apps/workspace/src/server/portal/services/feedback/portal-feedback-service.ts`, `portal-feedback-mapping-service.ts` im selben Ordner                                                                                               |
| Validierung                                | `apps/workspace/src/server/workspace/crm/services/feedback/feedback-round-schemas.ts`, `apps/workspace/src/server/portal/services/feedback/portal-feedback-schemas.ts`                                                               |
| Interne UI                                 | `apps/workspace/src/components/workspace/crm/feedback-rounds/`: `feedback-item-row`, `feedback-item-result-select`, `feedback-round-detail`, `feedback-result-progress`, `feedback-complete-dialog`, `feedback-round-status-actions` |
| Portal-UI                                  | `apps/workspace/src/components/portal/feedback/`: `feedback-page-view`, `feedback-reader`, `feedback-round-step`, `feedback-item-list`, `feedback-round-notice`                                                                      |
| API-Clients                                | `apps/workspace/src/client/crm/feedback-rounds-api-service.ts`, `apps/workspace/src/client/portal/portal-feedback-api-service.ts`                                                                                                    |
| API-Pfade und Zugriffskatalog              | `apps/workspace/src/common/constants/feedback/feedback-api-paths.ts`, `apps/workspace/src/common/patterns/portal/portal-api-endpoints.ts`, `apps/workspace/src/common/constants/auth/crm-endpoint-access-rules.ts`                   |
| Chat                                       | `apps/workspace/src/server/shared/services/message/announce-system-message.ts`, `packages/common/src/constants/crm/system-message-keys.ts`                                                                                           |
| Übersetzungen                              | Unter `apps/workspace/src/i18n/dictionaries/`: `workspace/crm/feedback-rounds`, `portal/feedback`, `workspace/crm/messages`, `portal/messages`, jeweils `de.json` und `en.json`                                                      |

Neue gemeinsam genutzte Darstellung gehört nach `apps/workspace/src/components/shared/feedback/`;
Portal-Komponenten importieren keine internen Workspace-Komponenten. Neue Interaktionslogik wird in passenden
Portal-/Workspace-Hooks gekapselt. Die Liste ist ein Einstieg, keine Beschränkung auf diese Dateien.

## 1. Ziel und festgelegtes Verhalten

Rückfragen werden direkt an einzelnen Feedbackpunkten gestellt und im Cockpit sowie Kundenportal angezeigt.
Die Runde bleibt währenddessen in ihrem bisherigen Bearbeitungsstatus; andere Punkte können weiterbearbeitet werden.

| Aktion                           | Ergebnis                                                         |
| -------------------------------- | ---------------------------------------------------------------- |
| Rückfrage stellen                | Punkt zeigt „Rückfrage“, Frage wird im Portal sichtbar           |
| Kunde antwortet                  | Rückfrage gilt als beantwortet; Punkt ist wieder „Noch offen“    |
| Intern mit Hinweis schließen     | Rückfrage ist ohne Kundenantwort beendet; Punkt ist wieder offen |
| Weitere Rückfrage stellen        | Neuer Eintrag; bisheriger Verlauf bleibt erhalten                |
| Ergebnis auf „Noch offen“ setzen | Aktives Ergebnis wird entfernt und intern historisiert           |

Festgelegt sind separate Textantworten, erhaltener Verlauf und höchstens eine gleichzeitig offene Rückfrage pro Punkt.
Neue Anhänge an Fragen oder Antworten sind zunächst ausgeschlossen; vorhandene Punkt-Anhänge bleiben sichtbar.
Der ursprüngliche Feedbacktext wird durch eine Antwort nicht geändert.

Die globale Aktion „Zurück an den Kunden“ wird durch Rückfragen pro Punkt ersetzt. „Gespräch anfordern“ bleibt eine
separate Aktion für die Besprechung der ganzen Runde.

### Verhältnis zu bisherigen Entscheidungen

Die bestehenden Feedbackentscheidungen in `../00-entscheidungen.md`, Abschnitt „Feedbackrunden“, erlauben noch die
globale Rückgabe. Dieser Plan beschreibt die abgestimmte Ablösung. Bei der späteren Implementierung werden die
zentralen Entscheidungen, betroffenen Scope-Regeln und bisherigen Planverweise entsprechend aktualisiert.
Bestehende Ergebnisarten und deren Veröffentlichung erst nach Rundenabschluss bleiben erhalten.

## 2. Datenmodell und Schnittstellen

### Additive Erweiterung

Das vorhandene Datenmodell wird nicht vollständig umgebaut. Zwei neue Tabellen ergänzen die bestehenden Punkte:

- `feedback_round_item_clarifications`: Verknüpfung zum Punkt, Frage, Antwort bzw. Schließungshinweis,
  Autorbezüge, Zeitpunkte, Version und Zustand `open`, `answered` oder `closed`. Eine partielle Eindeutigkeitsregel
  verhindert mehrere offene Rückfragen am selben Punkt.
- `feedback_round_item_result_history`: interne Historie gesetzter, geänderter und zurückgenommener Ergebnisse
  einschließlich Begründung, ausführendem Akteur und Zeitpunkt. Einträge werden durch spätere Ergebnisänderungen
  nicht überschrieben.

Der aktuelle Ergebnisstand bleibt in der bestehenden Punkttabelle. Eine zusätzliche persistierte
Punktstatus-Spalte ist unnötig: Die Anzeige ergibt sich aus offener Rückfrage und aktuellem Ergebnis.

Vorhandene Ergebnisse werden erst bei ihrer ersten Änderung als Ausgangsstand (`baseline`) übernommen, in derselben
Transaktion wie die Änderung. Frühere, bisher nicht gespeicherte Änderungen lassen sich nicht rekonstruieren. Ein
separater Backfill entfällt (siehe „Teilschritte“).

Fragen, Antworten und Schließungshinweise sind nach dem Absenden unveränderlich. Korrekturen erfolgen durch
Schließen und gegebenenfalls eine neue Rückfrage. Die Ergebnishistorie bleibt ausschließlich intern sichtbar.
Fragen, Antworten und Schließungshinweise verwenden die bestehende Grenze von 2.000 Zeichen und müssen nach dem
Trimmen Text enthalten. Neue Tabellen erhalten die projekttypischen Fremdschlüssel, Constraints und benannten
Constraint-Konstanten; fachliche DB-Defaults werden nicht eingeführt.

### API und Contracts

- Interne Commands zum Stellen und Schließen einer Rückfrage, Portal-Command zum Beantworten.
- Der bestehende Ergebnis-Command akzeptiert zusätzlich `result: null` für „Noch offen“. Dabei werden die aktiven
  Ergebnisfelder einschließlich Begründung und Bearbeiter zurückgesetzt; die Historie bewahrt den vorherigen Stand.
- Eine Rückfrage zu einem bereits bewerteten Punkt nimmt dessen Ergebnis innerhalb derselben Transaktion zurück.
- Beide Punkt-DTOs erhalten den Rückfragenverlauf; der Portal-Punkt erhält zusätzlich seine Version für Konfliktschutz.
  Die Ergebnishistorie wird nur im internen DTO ausgegeben.
- Jede Rückfragenänderung erhöht auch die Punktversion. Diese schützt den Punkt als Ganzes gegen veraltete
  Ergebnis-, Frage- und Antwortaktionen. Die bearbeitbare Rückfragenzeile hat zusätzlich ihre eigene Version.
- Neue Contracts und Const-Objekte liegen gemäß Export-Regel unter `common`. Gemeinsame Persistenzlogik liegt im
  bestehenden geteilten Feedback-Servicebereich; Portal- und Workspace-Handler behalten getrennte Autorisierung.
- Verläufe werden für die geladenen Punkte gesammelt abgefragt, ohne eine zusätzliche Query pro Punkt.

Alle Ergebnis-Schreibwege verwenden dieselbe Historisierung. Dazu gehören auch bestehende automatische
Ergebnisrücknahmen beim Bearbeiten eines zuvor global zurückgegebenen Feedbackentwurfs.

## 3. Abläufe, Berechtigungen und Darstellung

### Cockpit

- Jeder bearbeitbare Punkt erhält „Rückfrage stellen“. Der Dialog zeigt die Frage und weist bei vorhandenem Ergebnis
  auf dessen Rücknahme hin. Das bisherige Ergebnis bleibt intern nachvollziehbar.
- Bei offener Rückfrage erscheinen Status „Rückfrage“, Fragetext und „Rückfrage schließen“. Ein abschließendes
  Ergebnis kann erst nach Antwort oder Schließung gesetzt werden.
- „Noch offen“ bleibt nach jeder Ergebniswahl auswählbar. Änderungen erscheinen zusätzlich in einer einklappbaren
  internen Ergebnishistorie.
- Fragen und Antworten stehen chronologisch beim Punkt; ältere Einträge sind einklappbar.
- Fortschritt und Abschlussdialog unterscheiden erledigte Punkte, offene Punkte und offene Rückfragen.
  Offene Rückfragen verhindern den Rundenabschluss.

### Kundenportal

- Rückfragen sind bereits während der laufenden Runde sichtbar, unabhängig von der bisherigen Sperre für
  abschließende Ergebnisse.
- Berechtigte Kundenkontakte können die offene Frage am Punkt beantworten. Nach dem Absenden erscheint die Antwort
  im Verlauf; der Kunde muss die Runde nicht erneut einreichen.
- Ein Hinweis über der Punktliste nennt die Anzahl offener Rückfragen und führt zu den betroffenen Punkten.
- Abschließende Ergebnisse bleiben weiterhin bis zum Rundenabschluss verborgen. Interne Ergebnishistorie und
  interne Bearbeiter-IDs werden nicht ausgeliefert. Der öffentliche Verlauf unterscheidet Team und Kundenseite.
- Bei intern geschlossener Rückfrage bleiben Frage und Schließungshinweis sichtbar; das Antwortformular entfällt.

### Schreibregeln und Nebenläufigkeit

- Stellen, Schließen und Zurücksetzen sind nur in `submitted`, `in_discussion` und `in_progress` erlaubt.
  Abgeschlossene oder freigegebene Runden bleiben unveränderlich.
- Intern gelten die bestehenden Projekt-Schreibrechte. Kundenantworten erfordern die bestehenden Portal-Feedback-
  Lese- und Schreibrechte sowie Projektzugriff; die Owner-Ansicht bleibt schreibgeschützt. Jeder entsprechend
  berechtigte Kundenkontakt darf antworten, nicht ausschließlich der ursprüngliche Verfasser.
- Alle Schreibwege sperren zuerst die Runde und anschließend den Punkt. Der Abschluss einer Runde wird gegen
  parallele Ergebnis- und Rückfragenänderungen abgesichert.
- Veraltete Formulare erhalten einen Konflikt mit aktuellem, berechtigungsgerecht gefiltertem Stand und behalten
  den eingegebenen Text. Eine gleichzeitige Antwort und interne Schließung können nicht beide erfolgreich sein.
- Wiederholte Übermittlungen derselben Aktion erzeugen weder doppelte Verlaufseinträge noch doppelte Chatmeldungen.
  Neue Rückfragen erhalten eine stabile, vom Client erzeugte Kennung. Identische Wiederholungen nach bereits
  erfolgreicher Verarbeitung werden ohne erneute Nebenwirkungen bestätigt; abweichende veraltete Schreibversuche
  erhalten einen Konflikt.
- Fremde Kunden-, Projekt-, Punkt- oder Rückfragen-IDs werden serverseitig gefiltert und ohne Informationsleck
  abgewiesen. Die Kundenzuordnung stammt aus dem Portal-Akteur, nicht aus einem vertrauenswürdigen Request-Feld.
- Rückfragen ändern weder den Rundenstatus noch die Sammelaufgabe und erzeugen keine zusätzliche Runde.

Alle neuen Texte werden parallel in DE/EN gepflegt. Bestehende Controls, Dialoge und Font-Awesome-Icons werden
verwendet; nach Aktionen wird der Fokus sinnvoll am betroffenen Punkt gehalten. Eigene Schreibaktionen aktualisieren
die Ansicht; andere geöffnete Ansichten sehen Änderungen beim erneuten Laden. Eine neue Echtzeit-Infrastruktur ist
nicht Teil dieses Features.

## 4. Globale Rückgabe, Chat und Bestandskompatibilität

- Die globale Aktion „Zurück an den Kunden“ entfällt einschließlich ihrer neuen API-Übergänge. Der Rundenstatus
  `open` bleibt für initiale Entwürfe und bereits zurückgegebene Runden erhalten.
- Bereits global zurückgegebene Runden bleiben bearbeitbar und können normal erneut eingereicht werden.
  Historische Hinweise und Chatübersetzungen bleiben lesbar; gespeicherte Systemnachrichten verlieren ihre Texte nicht.
- Fragen und Antworten erzeugen einfache Systemnachrichten über die vorhandene Chat-Infrastruktur: Projekt,
  Runde und Punktnummer, ohne Frage- oder Antworttext und ohne neue klickbare Verlinkung.
- Internes Schließen erzeugt keinen zusätzlichen Chateintrag; Schließungshinweis und Status sind am Punkt sichtbar.
- Ein Chatfehler darf die eigentliche Aktion nicht zurückrollen. Der bestehende Savepoint-/Logging-Mechanismus
  wird wiederverwendet; keine Kundeninhalte in Logs oder Activity-Metadaten schreiben.
- Neue Nachrichten benötigen lediglich zusätzliche Ereignisschlüssel, Parameter und Übersetzungen in den bestehenden
  Portal- und CRM-Chat-Dictionaries. Ein Umbau des Chats ist nicht vorgesehen. Damit bleibt der Zusatzaufwand gering.
- Keine neuen E-Mails, Einzelaufgaben, Portal-Permissions oder allgemeinen Ungelesen-Zustände. Die bestehenden
  Ungelesen-Regeln des Feedbackeingangs werden nicht umdefiniert.

## 5. Umsetzung, Tests und Abnahme

### Geplante Reihenfolge

1. **Task 78 (28.1):** Ergebnishistorie samt Migration, Historisierung aller Ergebnis-Schreibwege, „Noch offen“ als
   zurücksetzende Ergebniswahl und einklappbare Historie im Cockpit.
2. **Task 79 (28.2):** Rückfragen-Tabelle, Contracts, gemeinsame Persistenz, getrennte interne und Portal-Commands,
   API-Routen, Berechtigungsregistrierung, Konfliktbehandlung, Abschluss-/Ergebnissperre und Chatereignisse – ohne UI.
3. **Task 80 (28.3):** Cockpit und Portal (Rückfragen, Antwort-/Schließungsformulare, Verläufe, Statusanzeigen,
   Fortschritt, DE/EN), globale Rückgabe entfernen, E2E-Kernablauf, Dokumentation und Bereinigung. Historisch
   benötigte Leser und Übersetzungen bleiben bestehen.

Die additive Schemaerweiterung kommt in jedem Teil vor neuen Lesern und Schreibern derselben Migration. Kein Teil
liefert einen unvollständigen sichtbaren Flow aus: 28.1 ist vertikal vollständig, 28.2 hat keinen UI-Einstieg,
28.3 macht Rückfragen sichtbar.

### Verbindliche Testfälle

- Mehrere nacheinander gestellte Rückfragen mit vollständig erhaltenem Verlauf; zweite gleichzeitig offene Frage
  wird auch auf DB-Ebene verhindert.
- Kundenantwort und internes Schließen setzen den Punkt wieder auf offen; interne Schließung erfordert einen Hinweis.
- Rückfrage bzw. Zurücksetzen nach allen drei Ergebnisarten bewahrt die bisherige interne Begründung.
- Keine vorzeitige Veröffentlichung interner Ergebnisse oder Ergebnishistorie.
- Fremde Kunden-, Projekt-, Punkt- und Rückfragen-IDs, fehlende Rechte und Owner-Schreibversuche werden abgewiesen.
- Parallele Antworten, Antwort gegen Schließung, doppelte Übermittlungen sowie Rückfrage gegen Rundenabschluss.
- Rundenabschluss bleibt bei offenen Punkten oder Rückfragen gesperrt; andere Punkte bleiben bearbeitbar.
- Bestehende zurückgegebene Runden funktionieren nach dem Update weiterhin; historische Chatmeldungen bleiben lesbar.
- Chatfehler verhindern weder Frage noch Antwort; Wiederholungen erzeugen keine doppelten Meldungen.
- Leere Eingaben, Textlängen, Fehlerzustände, Versionskonflikte, Fokusführung und DE/EN sind abgedeckt.

DB-Smokes prüfen Constraints, erlaubte Zustandskombinationen, fehlende fachliche Defaults und die Migration.
UI-Tests prüfen Status, Formulare, Konflikte und Verläufe. Ein E2E-Kernablauf verbindet Cockpit und Portal:

**Frage stellen → beantworten → Ergebnis setzen → zurücksetzen → erneut setzen → Runde abschließen.**

Vor Merge gelten die vollständigen Repository-Gates: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`,
betroffene DB-Smokes und `pnpm --filter @invessiv/workspace build`. Die Abnahme umfasst beide Themes, mobile und
Desktop-Darstellung sowie Keyboard-/Fokus-Smoke. Der spätere PR dokumentiert Migration, Security/Privacy,
Monitoring und Rollback. Ein Rückbau darf keine gespeicherten Rückfragen oder Ergebnisverläufe löschen.

## 6. Umfang und Aufwandseinordnung

Der Rückfragenverlauf benötigt gegenüber einem überschreibbaren Frage-Antwort-Paar vor allem das Laden und Anzeigen
mehrerer Einträge sowie zusätzliche Tests. Berechtigungen, Antwortformular, Benachrichtigungen und Konfliktschutz
brauchen beide Varianten. Ein vollständiger Umbau des Feedbackmodells ist dafür nicht erforderlich.

Zusätzlich zum Rückfragenverlauf gehört die **interne Ergebnishistorie** zum festgelegten Funktionsumfang. Deshalb enthält
dieser Plan eine zweite Tabelle samt Historisierung der bisherigen Ergebnis-Schreibwege. Dieser Umfang
geht über ein reines Rückfragenfeld hinaus und ist bei der späteren Aufwandsschätzung zu berücksichtigen.

Nicht vorgesehen sind Anhänge an Antworten, Änderungen bereits abgesendeter Nachrichten, ein allgemeiner Chat pro
Feedbackpunkt, klickbare Chat-Verlinkungen, automatische neue Aufgaben oder das Wiederöffnen abgeschlossener Runden.

## 7. Verbindliche technische Ausgestaltung

Die folgenden Festlegungen schließen die technischen Lücken der fachlichen Beschreibung. Abschnitt 8 präzisiert
die Auslieferung der Schritte aus Abschnitt 5. Es bestehen keine offenen Produktentscheidungen; routinemäßige
Implementierungsdetails richten sich nach den aufgeführten Repository-Mustern.

### 7.1 Zustände und Übergänge eines Punktes

Die Rückfragenzustände erhalten ein Const-Objekt mit abgeleitetem Typ und Wertearray in `packages/common`.
`result` bleibt ausschließlich das bestehende abschließende Ergebnis oder `null`.

| Ausgangslage                               | Aktion                              | Zulässigkeit und gespeicherter Folgezustand                                 |
| ------------------------------------------ | ----------------------------------- | --------------------------------------------------------------------------- |
| Keine offene Rückfrage, Ergebnis beliebig  | Frage stellen                       | Neue offene Rückfrage; vorhandenes Ergebnis atomar historisieren und leeren |
| Offene Rückfrage vorhanden                 | Weitere Frage oder Ergebnisänderung | Ablehnen; zunächst antworten oder schließen                                 |
| Offene Rückfrage vorhanden                 | Kunde antwortet                     | Genau diese Rückfrage wird `answered`; Ergebnis bleibt `null`               |
| Offene Rückfrage vorhanden                 | Intern schließen                    | Genau diese Rückfrage wird `closed`; Ergebnis bleibt `null`                 |
| Keine offene Rückfrage, Ergebnis vorhanden | „Noch offen“                        | Ergebnis zurücknehmen; Verlauf behalten                                     |
| Keine offene Rückfrage, Ergebnis `null`    | „Noch offen“                        | Erfolgreiche unveränderte Antwort; kein neuer Historieneintrag              |
| Keine offene Rückfrage                     | Ergebnis setzen/ändern              | Bestehende Ergebnisregeln anwenden und Änderung historisieren               |

Fragen und Antworten sind in denselben drei laufenden Rundenstatus erlaubt wie Ergebnisänderungen. In `open`,
`completed` und `approved` sind diese neuen Aktionen gesperrt. Im Status `open` gilt ausschließlich der bestehende
Entwurfsablauf. Wiederholungen bereits erfolgreich ausgeführter Aktionen sind keine neuen Änderungen; dafür gilt 7.4.

Eine gemeinsame seiteneffektfreie Ableitung liefert intern „Rückfrage“, falls eine offene Rückfrage existiert,
ansonsten das Ergebnis oder „Noch offen“. Sie wird in Zeile, Fortschrittsanzeige und Abschlussprüfung konsistent
verwendet. „Rückfrage“ wird nicht als auswählbares Ergebnis in `FeedbackItemResult` ergänzt. Im Portal wird nur eine
offene Rückfrage als Handlungsstatus angezeigt; es wird kein internes Ergebnis vorzeitig aus diesem Status abgeleitet.

### 7.2 Tabellen, Integrität und Historie

**Rückfragentabelle:** UUID `id`, `item_id` als Fremdschlüssel, `question`, `status`, `requested_by_member_id`,
`requested_at`, `answer`, `answered_by_portal_membership_id`, `answered_at`, `close_note`, `closed_by_member_id`,
`closed_at`, `version`, technische Zeitstempel. Zusätzlich werden für Anlage, Antwort und Schließung die in 7.4
benötigten Command-Kennungen und jeweiligen ursprünglichen Punktversionen gespeichert. Die Anlagekennung ist zugleich
die Rückfragen-ID; dafür wird keine zweite Kennung erzeugt.

- `open`: Antwort- und Schließungsfelder sind leer.
- `answered`: Nichtleere Antwort und Antwortzeitpunkt vorhanden, Schließungsfelder leer.
- `closed`: Nichtleerer Schließungshinweis, Bearbeiter und Schließungszeitpunkt vorhanden, Antwortfelder leer.
- Frage und Anfrager sind bei Anlage Pflicht. Statusabhängige Feldkombinationen, Textlängen, Version und maximal
  eine offene Rückfrage je `item_id` sind durch DB-Constraints abgesichert.
- Die spätere Entfernung einer Portalmitgliedschaft darf eine beantwortete Rückfrage nicht ungültig machen:
  Kunden-Autorbezug ist nullable mit `ON DELETE SET NULL`, Zeitpunkt und Text bleiben erhalten. Interne
  Mitgliedsbezüge folgen dem bestehenden Muster der Ergebnis-Bearbeiterreferenz und verhindern verwaiste Fremdschlüssel.
- Keine Trigger für die tabellenübergreifende Bedingung „offene Rückfrage bedeutet `result = null`“: Diese wird durch
  gemeinsame Schreiblogik unter Sperren und Integrationstests abgesichert.

**Ergebnishistorie:** UUID `id`, `item_id`, `item_version`, Ereignisart `baseline`, `set` oder `reset`,
Ergebnis-Snapshot einschließlich Begründung und ursprünglicher Ergebnis-Metadaten, Akteurseite und Autorbezug,
Ereigniszeitpunkt sowie technische Erfassungszeit. Bei normalen Ergebnisänderungen kommen Command-Kennung und
ursprüngliche Request-Punktversion hinzu. Alle Ereignisarten und Akteurseiten werden typisiert modelliert.

- Ein Eintrag beschreibt den **Folgezustand** des aktiven Ergebnisses; `reset` enthält leere Ergebnisfelder.
  Der vorherige Zustand ist durch den vorausgehenden Eintrag erhalten. Gibt es für einen bereits bewerteten Punkt
  noch keinen Verlauf, wird dessen Ausgangsstand vor der ersten Änderung in derselben Transaktion ergänzt.
  Nach einem Rollback mit zwischenzeitlichen Ergebnisänderungen wird auch bei bestehendem Verlauf ein neuer
  Ausgangsstand gesichert, wenn der letzte Snapshot vom aktuellen Ergebnis einschließlich Begründung,
  Bearbeiter oder Ergebniszeitpunkt abweicht. Reine Versionslücken ohne Ergebnisänderung erzeugen keine Baseline.
- Eindeutigkeit je `(item_id, item_version)` verhindert doppelte Ausgangsstände/Ereignisse. Punktversionen im
  Verlauf dürfen Lücken haben, weil etwa Antwort- oder Anhangsaktionen kein Ergebnis ändern.
- Nur eine tatsächliche Änderung des Ergebnisses oder seiner Begründung erzeugt ein neues Ereignis. Identische
  Werte werden nicht erneut gesetzt; Bearbeiter, Zeitpunkt und Version bleiben dabei unverändert.
- Ein `baseline` dokumentiert den beobachteten vorhandenen Stand, nicht den Beginn einer nachträglich erfundenen
  vollständigen Historie. Originalergebniszeit und Erfassungszeit bleiben unterscheidbar.
- Der Verlauf wird nach Punktversion aufsteigend angezeigt. Rückfragen werden nach Anfragezeit und ID stabil
  sortiert. Texte enthalten keine HTML-/Markdown-Auswertung.
- Beide Tabellen hängen per `ON DELETE CASCADE` am Punkt. Die Historien sind während dessen Existenz unveränderlich;
  sie begründen kein zusätzliches Archiv gelöschter Entwurfspunkte. Bestehende fachliche Entwurfs-Löschungen und
  berechtigte Datenschutzlöschungen bleiben möglich. Dieser Bestandsfall wird separat getestet.

Die neuen Modelle werden im CRM-Barrel exportiert; Constraint-Namen, Modell und Migration stimmen überein.
Technische IDs und Versionen werden beim Anlegen explizit gesetzt. Autoren werden nicht als neue Namens-Snapshots
vervielfältigt; intern wird der aktuelle Anzeigename bzw. eine lokalisierte Rollen-/Entfernt-Kennung dargestellt.

### 7.3 API-Verträge und Fehler

In der Tabelle ist `{version}` immer die **Punktversion**, nicht die Version der Runde oder Rückfragenzeile.
Die Pfade beschreiben die Zielrouten; der Client baut sie ausschließlich über die vorhandenen typisierten
Endpoint-Konstanten und Pfadhelfer. IDs werden wie bei den bestehenden Feedback-Routen validiert/normalisiert.

| Route                                                                                                       | Methode und Body                                                                      |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `/api/workspace/crm/feedback-round-items/[itemId]/clarifications`                                           | `POST { commandId, version, question }`; `commandId` ist die UUID der neuen Rückfrage |
| `/api/workspace/crm/feedback-round-items/[itemId]/clarifications/[clarificationId]/close`                   | `POST { commandId, version, note }`                                                   |
| `/api/portal/[customerId]/feedback-rounds/[roundId]/items/[itemId]/clarifications/[clarificationId]/answer` | `POST { commandId, version, answer }`                                                 |
| Bestehende interne Route `/api/workspace/crm/feedback-round-items/[itemId]/result`                          | Weiterhin `PATCH`, ergänzt um `commandId` und `result: null`                          |

Neue Command- und Request-Contracts erhalten jeweils eigene fachlich benannte Dateien. `commandId` ist eine UUID,
`version` eine positive ganze Zahl. Unbekannte Body-Felder werden entsprechend den bestehenden strikten Schemas
abgewiesen. Für `result = null` muss die normalisierte Begründung ebenfalls `null` sein; alle aktiven Ergebnisfelder
werden geleert. Für `not_implemented` und `additional_service` bleibt eine nichtleere Begründung Pflicht.
Für `implemented` bleibt die bestehende API-Behandlung optionaler Begründungen kompatibel; die aktuelle UI sendet
wie bisher `null` und erhält kein zusätzliches Freitextfeld für dieses Ergebnis.

Erfolgreiche neue Punktaktionen liefern HTTP 200 mit dem vollständigen aktualisierten Punkt-DTO der jeweiligen Welt.
Intern wird das bestehende Antwortmuster der Ergebnisroute fortgeführt. Die Portalroute erhält eine passende
Punkt-Antwortabbildung; eine auf Runden-DTOs zugeschnittene bestehende Antwortfunktion wird nicht unverändert mit
Punktdaten aufgerufen.

Fehlerzuordnung, jeweils über benannte Fehler-/HTTP-Konstanten und lokalisierte Texte:

- Ungültiger Body: 400 mit Feldfehlern; unbekannte oder fremde Entitäten: 404.
- Abweichende Punktversion: 409 mit `VersionConflictDto` über dem aktuellen Punkt-DTO. Im Portal enthält auch
  dieser Fehlerkörper weder Ergebnishistorie noch unveröffentlichte Ergebnisdaten.
- Bereits vorhandene offene Rückfrage, inzwischen beantwortete/geschlossene Frage oder gesperrte Runde:
  fachlicher 409-Fehler; aktuelle Anzeige neu laden und Eingabetext erhalten. Für fehlende Ergebnisse bleibt
  beim Rundenabschluss der bestehende Fehler `ResultsIncomplete` erhalten.
- Wiederverwendete Command-Kennung mit abweichender Aktion oder Nutzlast: eigener Konfliktcode, keine Mutation.
- Unerwartete Persistenzfehler: bestehender interner Fehlerpfad; keine Inhalte in Logs ausgeben.

Die neuen fachlichen Codes werden in den bestehenden internen bzw. Portal-Fehlerkatalog aufgenommen, nicht als
untypisierte Strings eingeführt. CRM-Endpunktregeln und API-Operationen werden registriert. Der Portalpfad führt
wie bisher über `withPortalActor`; die kundenbezogene URL ist nur Routinginput und ersetzt nie die Actor-Prüfung.

### 7.4 Transaktionen, Versionen und Wiederholungen

Verbindlicher Ablauf je neuer Mutation:

1. Schema validieren, aktuelle Zugriffsrechte und Entitätszuordnung prüfen. Alle IDs müssen auf dieselbe erlaubte
   Kunden-/Projekt-/Runden-/Punktkette zeigen. Rechte werden auch bei Wiederholungen erneut geprüft.
2. Runde zuerst sperren: intern `FOR SHARE`, im vorhandenen Portalrahmen `FOR UPDATE`. Danach Punkt `FOR UPDATE`
   lesen, anschließend gegebenenfalls die Rückfragenzeile. Den Punkt unter dieser Sperre frisch lesen und keine
   vorher ohne Punktsperre geladene Kopie als Grundlage verwenden.
3. Bereits verarbeitete Command-Kennung prüfen. Gleiche Aktion, gleicher Akteur, ursprüngliche Version und gleiche
   normalisierte Nutzlast bedeuten eine Wiederholung: aktuellen berechtigten Punkt zurückgeben, ohne erneut zu
   schreiben. Das gilt auch dann, wenn inzwischen eine weitere Frage gestellt oder die Runde abgeschlossen wurde.
4. Für neue Aktionen erlaubten Rundenstatus, angegebene Punktversion und Rückfragenzustand prüfen. Die
   Rückfragenzeilen-Version kommt aus dem frisch gesperrten Datensatz; sie ist kein zusätzlicher Clientparameter.
5. Mutation, erforderliche Ausgangshistorie, Ergebnisänderung und neues Historienereignis in derselben Transaktion
   ausführen. Jede tatsächliche neue Frage, Antwort oder Schließung erhöht die Punktversion **genau einmal**.
   Eine Frage mit Ergebnisrücknahme benötigt keinen zweiten Punkt-Write. Bei Antwort/Schließung steigt zusätzlich
   die Rückfragenversion; die Rundenversion wird durch Punktaktionen nicht verändert.
6. Neue Chatmeldung ausschließlich für eine erstmals gespeicherte Frage/Antwort im bestehenden Savepoint schreiben.
   Dann den aktualisierten Punkt über den zur Welt gehörenden Mapper ausgeben.

Versionierte Updates laufen ausschließlich über `updateVersioned` bzw. den bestehenden
`updateLockedVersioned`-Wrapper. Ein zusätzlicher Lock ersetzt nicht den atomaren Versionsvergleich. Erkennt der
Wrapper einen Konflikt, dürfen keine vorherigen Inserts oder Historieneinträge der Aktion committed werden;
der Mutationsblock wird vollständig zurückgerollt, danach wird der Konfliktstand gelesen.

Für Idempotenz werden keine dritte allgemeine Command-Tabelle und keine Outbox neu eingeführt. Die Frage speichert
ihre Anlagekennung, Antwort und Schließung ihre jeweiligen Command-Kennungen und ursprünglichen Requestversionen.
Ergebnishistorieneinträge speichern die Kennung der Ergebnisänderung. Dadurch sind auch spätere Wiederholungen nach
zwischenzeitlichen weiteren Aktionen erkennbar. Die Kennungen werden innerhalb des Punktes aktionsübergreifend
geprüft; die zur Frage gehörende atomare Ergebnisrücknahme darf dieselbe Kennung als korreliertes Ereignis tragen.

Der Client erzeugt eine Kennung pro expliziter Aktion und behält sie bei Netzwerk-Retries. Nach einer echten
Versionskonflikt-Auflösung oder Änderung des Textes ist das erneute Absenden eine neue Aktion mit neuer Kennung.
Ein unverändertes No-op-Ergebnis schreibt keinen Command-Eintrag; ein späterer veralteter Retry darf dann regulär
einen Versionskonflikt liefern, erzeugt aber keine Nebenwirkung.

Die Abschlussprüfung nimmt wie bisher die Rundensperre `FOR UPDATE` und prüft **beides**:
kein Punkt ohne Ergebnis und keine offene Rückfrage. Damit ist auch ein inkonsistenter Alt-/Defektzustand nicht
abschließbar. Ein punktbezogener Schreibpfad wertet nach Erhalt der Rundensperre den aktuellen Status aus und kann
nicht nach einem gleichzeitig abgeschlossenen Round-Write weiterarbeiten.

### 7.5 DTO-Sichtbarkeit und UI-Einbindung

Ein öffentlicher Rückfragen-Contract enthält ausschließlich `id`, `status`, `question`, `requestedAt`, `answer`,
`answeredAt`, `closeNote` und `closedAt`; fehlende Antwort-/Schließungswerte sind `null`. Für diesen öffentlichen
Verlauf genügen lokalisierte Rollenbezeichnungen „Unser Team“/„Kunde“ und Zeitpunkte. Autor-IDs, Command-Kennungen,
Requestversionen und interne Historie werden nicht darin übertragen.

`FeedbackRoundItemDto` und `PortalFeedbackItemDto` erhalten `clarifications`; das interne DTO zusätzlich
`resultHistory`, das Portal-DTO `version`. Der interne Historien-Contract trägt Ergebnis-Snapshot, Ereignisart,
Punktversion, Zeitpunkt und berechtigungsgerecht aufgelöste Akteurbezeichnung. Portal-Mapper laden/liefern diese
Historie nicht. Der bestehende Ergebnisfilter für `completed`/`approved` bleibt sowohl bei Reads als auch bei
Erfolg-/Konfliktantworten aktiv. Neue Pflichtfelder werden in allen Fixtures und Query-/Command-Antworten ergänzt.

Der Portal-Reader ist bisher weitgehend lesend. Er wird gezielt um Antwortaktionen erweitert, ohne die Runde in den
Entwurfseditor (`FeedbackEditor`) umzuschalten. `FeedbackReader` und `FeedbackRoundStep` reichen Runde, aktuelle
Punktversion und serverseitige Antwort-Capability bis zur Punktliste durch. In der Capability müssen Leserecht,
`portal.feedback.submit`, Projektzugriff, Nicht-Owner und erlaubter Rundenstatus zusammenkommen;
die konkrete offene Frage wird im Command erneut geprüft. Ein Kontakt ohne Schreibrecht sieht den Verlauf ohne Formular.

- Interne Rückfrage-/Schließdialoge verwenden die vorhandenen `FormDialog`-/Versioned-Mutation-Muster.
  `FeedbackTextDialog` darf nur nach Prüfung seiner generischen Fehler-/DTO-Schnittstelle wiederverwendet werden;
  keine Abhängigkeit des Portals von einer CRM-Komponente schaffen.
- Der gemeinsame öffentliche Verlauf ist eine darstellende Komponente unter `components/shared/feedback/`.
  Antwort- und Schreibaktionen verbleiben in den jeweiligen Bereichen und Hooks.
- Nach einer lokalen Antwort wird der aktualisierte Punkt sofort übernommen und die Route aktualisiert.
  Entwürfe an anderen Punkten werden nach Punkt-ID erhalten; ein Refresh oder Konflikt darf nicht ungefragt
  die Texte sämtlicher anderer Antwortfelder verwerfen. Gleichermaßen werden verschiedene Kunden durch bestehende
  Kunden-Keys und Runden/Punkte durch deren IDs getrennt.
- Im Konflikt bleibt der Text erhalten. Ist die Frage inzwischen geschlossen/beantwortet, wird erneutes Absenden
  gesperrt und der aktuelle Verlauf gezeigt, statt die Antwort einer neueren Frage zuzuordnen.
- Offene Fragen sind standardmäßig aufgeklappt; abgeschlossene Frage-Antwort-Paare und die interne Ergebnishistorie
  können eingeklappt werden. Anker zu offenen Punkten verwenden stabile Punkt-IDs statt Positionsnummern und setzen
  den Fokus auf deren Überschrift. Status wird als Text und nicht ausschließlich durch Farbe dargestellt.
- Nach Antwort/Schließung wird Erfolg in der vorhandenen Live-Region gemeldet. Keine neue globale Navigation oder
  Umsortierung der Punkte; bestehende Bereichs-, Datei- und Zeitformatierung bleibt erhalten.

### 7.6 Chat, Fortschritt und bestehende Schreibpfade

Es werden genau zwei neue Systemereignisse ergänzt: Rückfrage gestellt und Rückfrage beantwortet. Sie verwenden
die bestehende Kundenkonversation und `announceSystemMessage`. Parameter sind `projectTitle`, `roundNumber` und
neu `itemNumber` (`position + 1` zum Ereigniszeitpunkt). Das bestehende Chat-Lese-/Senderechteverhalten wird nicht
erweitert. Keine Frage, Antwort oder Ergebnisbegründung wird in Nachrichtentext/-metadaten kopiert. Fehlgeschlagene
Meldungen werden wie bisher protokolliert; dieses Feature führt keinen nachträglichen Zustelljob ein.

Fortschritt zählt einen Punkt nur mit Ergebnis und ohne offene Rückfrage als erledigt. Zusätzlich wird die Anzahl
offener Rückfragen angezeigt; die Gesamtzahl bleibt die Zahl der Feedbackpunkte. Die Inbox-Ungelesen-Regel
(`submitted` und `read_at = null`) und Sammelaufgaben bleiben unverändert. Kundenantworten setzen weder
`submitted_at` noch `read_at` zurück. Ihre Meldung erfolgt über Chat und Punktverlauf.

Bei der Bereinigung der globalen Rückgabe werden die beiden internen Übergänge von `submitted`/`in_discussion`
nach `open`, die auswählbare Zielaktion, ihr Request-Zweig, Client-Aufrufer und nicht mehr verwendete Handlerzweige
entfernt. Alte Tabs erhalten beim Versuch einer neuen globalen Rückgabe einen gültig übersetzten Fehler mit
Neuladehinweis. Der allgemeine Rundenstatus `open`, historische `customer_notice`-Anzeige sowie
`FeedbackRoundReturned` und dessen Chatübersetzungen bleiben erhalten.

## 8. Auslieferung, Bestandsdaten und Arbeitsübergabe

### 8.1 Release-Schnitt

Es gibt **keinen Feature-Schalter** und **keinen Backfill** (Entscheidung 18.10.2026, siehe „Teilschritte“). Die drei
Teile werden nacheinander auf `feat/crm-feedback-rueckfragen` umgesetzt; jeder Teil ist für sich deploybar und ab
seinem Merge aktiv:

1. **28.1 (Task 78):** Additive Migration der Ergebnishistorie, danach Historisierung aller bestehenden
   Ergebnis-Schreibwege einschließlich der automatischen Entwurfsrücknahme, „Noch offen“ im Cockpit und
   einklappbare Historie. Der bestehende Ergebnisrequest ohne `commandId` bleibt für bereits geöffnete alte Tabs
   gültig; solche Requests erhalten serverseitig eine neue Kennung und behalten ihre bisherige Konfliktsemantik.
2. **28.2 (Task 79):** Additive Migration der Rückfragen, Commands und Routen samt Sperren für Ergebnisänderung und
   Rundenabschluss bei offener Rückfrage. Keine Oberfläche zeigt auf die neuen Routen; in Produktion entstehen bis
   28.3 keine Rückfragen.
3. **28.3 (Task 80):** Cockpit- und Portal-UI, Entfernung der globalen Rückgabe, E2E und Dokumentation.

Keine vorhandenen Tabellen, Spalten oder alten Chat-Schlüssel werden entfernt. Migrationsnummern werden beim
Implementieren aus `packages/db/migrations/` ermittelt; die Task-Pläne nennen nur den Stand vom 18.10.2026.

### 8.2 Rollback und Beobachtbarkeit

Rollback heißt Revert des betroffenen Teils plus Deploy; Migrationen bleiben stehen, gespeicherte Rückfragen,
Antworten und Historieneinträge werden nie gelöscht. Zulässig sind:

- **Revert von 28.1:** Die Historientabelle bleibt ungenutzt bestehen. Ergebnisse werden danach wieder ohne Historie
  geschrieben; ein späteres erneutes Ausrollen legt bei der nächsten Änderung einen neuen Ausgangsstand an.
- **Revert von 28.2:** Nur sicher, solange 28.3 nicht ausgeliefert war (dann existieren keine Rückfragen).
- **Revert von 28.3:** Nicht empfohlen, weil er die globale Rückgabe zurückbrächte und offene Rückfragen nicht
  mehr beantwortbar wären. Bei Fehlern in 28.3 wird vorwärts korrigiert (Fix-Forward). Die Server-Sperren aus 28.2
  bleiben in jedem Fall aktiv, sodass offene Rückfragen weder überschrieben noch übergangen werden.

Neue API-Operationen laufen durch die bestehenden privaten Fehler-/Monitoring-Wrapper (`privateFeedbackRoundResponse`
bzw. `privatePortalFeedbackResponse`) mit benannten `CrmOperation`-Einträgen. Inhalte bleiben ausschließlich in ihren
fachlichen Tabellen; keine Frage-, Antwort- oder Begründungstexte in Logs, Activities, Analytics oder Chat-Metadaten.

### 8.3 Konkrete Test-Anknüpfungspunkte und Abschlusscheckliste

Bestehende Tests werden erweitert statt parallele isolierte Ersatz-Testsysteme aufzubauen:

- `apps/workspace/src/server/tests/workspace/crm/feedback-round-processing.integration.test.ts`: Ergebnisrücknahme,
  Historisierung, offene Rückfragen und Abschluss unter realen PostgreSQL-Sperren.
- `apps/workspace/src/server/tests/portal/feedback/`: Kunden-/Projektgrenzen, Antwortrechte, Owner-Lesemodus und
  konkurrierende berechtigte Kundenkontakte; gemeinsame Fixtures unter `server/tests/shared/services/feedback/`.
- Bestehende API-Routentests in `server/tests/workspace/crm/api/` und `server/tests/portal/api/`: genaue neue Bodies,
  Punkt-Response, Konfliktkörper und alte Ergebnisrequests ohne `commandId`.
- Schema-/Mapper-Tests unter `server/tests/{workspace/crm,portal}/services/feedback/`: insbesondere keine internen
  Ergebnisdaten in Portal-Erfolg, Portal-Read oder Portal-Konfliktantworten.
- Co-locatete Feedback-UI-Tests: bedienbare „Noch offen“-Option nach allen Ergebnissen, neue Rückfrage trotz
  bisherigem Ergebnis, Wiederholung/Schließung, Leser mit und ohne Antwortrecht, Fokus, Textentwürfe an mehreren
  Punkten und längere Verläufe. Neues Antwortformular auch in `submitted`, `in_discussion` und `in_progress` testen.
- `apps/workspace/e2e/portal-feedback.e2e.ts`: bestehende Kernabläufe erhalten und den Flow aus Abschnitt 5 ergänzen.
- `packages/db/scripts/smoke-crm-constraints.ts` mit neuen Modulen unter `packages/db/scripts/crm-smoke/` und
  optionale Feedback-Seeds (`packages/db/scripts/crm-fixture/seed-feedback-rounds.ts`): neue Tabellen, fehlende
  Defaults, Constraints, Zustandskombinationen, doppelte offene Frage, Autorentfernung und Kaskade.

DB-Integrationstests laufen nur mit `CRM_DB_INTEGRATION=true`, das `apps/workspace/vitest.config.ts` im Modus
`crm-integration` setzt (`pnpm db:smoke:crm` an der Wurzel bzw. `pnpm --filter @invessiv/workspace db:smoke:crm`).
Ein grüner Standard-Unit-Testlauf darf nicht als ausgeführter DB-Nebenläufigkeitstest ausgewiesen werden. Neue
Integrationstestdateien außerhalb der in `db:smoke:crm` gelisteten Ordner werden dort ergänzt. Secret-Werte aus
lokalen Env-Dateien gelangen weder in Plan noch Logs.

Zusätzlich zu Abschnitt 5 müssen folgende Abnahmen explizit erfüllt sein:

- [x] Replays einer alten Frage nach deren Beantwortung und einer inzwischen neuen Frage erzeugen keine neue Frage
      und nehmen kein zwischenzeitlich gesetztes Ergebnis erneut zurück.
- [x] Geänderte Nutzlast mit gleicher Command-Kennung scheitert; eine neue explizite Aktion kann mit neuer Kennung
      nach einem Versionskonflikt gesendet werden.
- [x] Fehler nach Historien-Insert, vor finalem Update oder beim Antwort-Update hinterlassen keine teilweise Mutation.
- [x] Erste Ergebnisänderung eines bewerteten Punkts, weitere Änderungen und automatischer Legacy-Entwurfsreset
      erzeugen einen konsistenten Verlauf mit genau einem Ausgangseintrag. Bestehende Entwurfs-Löschungen folgen der
      dokumentierten Kaskade.
- [x] Anzahl erledigter/offener Punkte und Rückfragen ist nach Antwort/Schließung/Zurücksetzen korrekt; die
      Sammelaufgabe sowie die bestehende Ungelesen-Zählung ändern sich dadurch nicht.
- [ ] Jeder der drei Teile ist für sich deploybar; Rollback-Regeln aus 8.2 stehen im PR.
- [x] Zentrale Entscheidungen, relevante Scope-Dokumentation und diese Plan-Checkliste sind mit dem tatsächlichen
      Ergebnis synchronisiert. Fachlich benötigte neue Dateien sind eingebunden; kein ungenutzter Ersatzcode bleibt.

Prüfstand dieses Dokuments: Die eigenständige Umsetzbarkeit wurde anhand der genannten bestehenden Handler,
Punkt-/Runden-Modelle, Portal-Mapping-/Autorisierungswege, UI-Reader, API-Clients und Testorte nachgeschärft.
Der aktuelle Umsetzungs- und Prüfstand für Teil 28.1 steht im Task-78-Dokument. Teil 28.2 ist umgesetzt und im Review;
Details zu Migration, Prüfungen und Umsetzung stehen im Task-79-Dokument. Teil 28.3 ist umgesetzt und im Review; den
Stand nennt das Task-80-Dokument.
