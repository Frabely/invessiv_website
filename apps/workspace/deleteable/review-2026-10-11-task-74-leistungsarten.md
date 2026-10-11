# Review Task 74 – Leistungsarten und Zuweisung

Stand: 11.10.2026, Branch `feat/crm-leistungsanfragen-1-katalog`, HEAD `f325a246bf0032279c4f910af9d2f03b8c56abeb`. Geprüft wurde der aktuelle Arbeitsbaum einschließlich staged, unstaged und neuer Dateien. Maßstab: Task 74 einschließlich des Nachtrags „Stunden frei oder am Projekt“, die Entscheidungen und scoped Projektregeln.

**Gesamturteil:** Die regulären Abläufe sind weitgehend wie geplant umgesetzt. Vor Freigabe sollten insbesondere die Retry-Sicherheit und der blockierte Verkauf freier Stunden behoben werden. Weitere Fehler betreffen konkurrierende Änderungen und eine UI-Abnahmeanforderung. Es wurden keine Codeänderungen vorgenommen.

## Findings

### F01 · P1 · Wiederholen nach verlorener Antwort schreibt Stunden oder Zusatzrunde doppelt

- **Fundstelle:** `apps/workspace/src/server/workspace/crm/services/project-line-item-assignment-service.ts:43` (`insertLineItem`), `:106`, `:116`; `packages/common/src/contracts/crm/create-project-line-item-request.dto.ts`; `apps/workspace/src/client/shared/versioned-json-mutation-service.ts` (`send`); `apps/workspace/src/hooks/workspace/use-versioned-mutation.ts` (`submit`).
- **Problem und Auswirkung:** Die Leistung bekommt bei jedem POST eine neue zufällige ID. Diese ID als Idempotenzschlüssel der Buchungen verhindert keine Wiederholung desselben Requests. Beispiel: 5:00 werden erfolgreich verbucht, die Antwort geht verloren, der Dialog meldet einen Fehler und erlaubt erneutes Speichern. Danach existieren zwei Leistungen, 10:00 Gutschrift und bei aktivem Haken 10:00 Zuweisung. Bei einer Zusatzrunde entstehen entsprechend zwei Rundenschritte und zwei bestätigte Leistungen. Die Transaktion schützt vor Teilbuchungen, nicht vor diesem Retry.
- **Empfehlung:** Einen pro Zuweisungsversuch stabilen, vom Client wiederverwendeten Idempotenzschlüssel einführen und transaktional eindeutig speichern. Wiederholungen liefern die bereits angelegte Leistung; eine bewusst neue Zuweisung bekommt einen neuen Schlüssel. Integrationstest für identische parallele und sequenzielle Requests sowie einen Retry nach verlorener Erfolgsantwort ergänzen.

### F02 · P2 · Freie Stunden können im Dialog an geschlossenen Projekten nicht verkauft werden

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/projects/project-line-item-effect-fields/project-line-item-effect-fields.tsx:61`; `apps/workspace/src/components/workspace/crm/projects/project-line-item-form-dialog/project-line-item-form-dialog.tsx:181`, `:222`; `apps/workspace/src/common/patterns/crm/project-line-item-form.ts:63`.
- **Problem und Auswirkung:** Nach Wahl einer Stunden-Vorlage ist `allocateHoursToProject` immer `true`. Für ein archiviertes oder abgebrochenes Projekt entsteht `ProjectClosed`. Die Effekt-Komponente gibt dann ausschließlich den Sperrtext zurück und rendert weder Menge noch den Haken zum Freilassen der Stunden. Der Nutzer kann den Haken deshalb nicht ausschalten und den Sperrgrund nicht aufheben. Der Server unterstützt den Verkauf freier Stunden korrekt, aber der ausdrücklich vereinbarte Ablauf aus dem Nachtrag ist über die UI unerreichbar.
- **Empfehlung:** Bei `ProjectClosed` den Haken und die Mengeneingabe erreichbar halten oder serverseitig eine zulässige Standardauswahl vorgeben. Nur die Projektzuweisung sperren. Einen Dialogtest „geschlossenes Projekt → Haken aus → freie Stunden verkaufen“ ergänzen; der vorhandene Integrationstest prüft nur einen direkt übergebenen Request mit `false`.

### F03 · P2 · Eine parallele Archivierung wird beim Zuweisen von Stunden übersehen

- **Fundstelle:** `apps/workspace/src/server/workspace/crm/command-handler/create-project-line-item.command-handler.ts:45`, `:78`; `apps/workspace/src/server/workspace/crm/services/project-line-item-assignment-service.ts:82`; Gegenpfad: `apps/workspace/src/server/workspace/crm/command-handler/update-project.command-handler.ts` (`lockPreviousState`).
- **Problem und Auswirkung:** Der Projektstatus wird vor Beginn der Transaktion gelesen und anschließend unverändert an den Service übergeben. Liest die Zuweisung `active` und archiviert ein zweites Teammitglied das Projekt vor dem Insert, werden trotzdem Gutschrift und Projektzuweisung geschrieben. Die Kundensperre schützt den Stundenbestand, aber weder aktualisiert sie den Projektstatus noch sperrt sie den Projekt-Editor. Damit greift die vereinbarte `PROJECT_CLOSED`-Regel beim tatsächlich geschlossenen Projekt nicht.
- **Empfehlung:** Für eine Projektzuweisung das Projekt innerhalb der Transaktion unter einer mit dem Projekt-Editor kompatiblen Sperre lesen und den aktuellen Status dort prüfen. Dabei eine konsistente Sperrreihenfolge zum Kunden beachten. Ein Nebenläufigkeitstest muss Archivierung/Abbruch zwischen ursprünglichem Lesen und Zuweisung abdecken. Verkäufe freier Stunden bleiben wie vereinbart erlaubt.

### F04 · P2 · Ein offener Standard-Dialog kann unbemerkt eine Zusatzrunde verkaufen

- **Fundstelle:** `apps/workspace/src/server/workspace/crm/command-handler/create-project-line-item.command-handler.ts:62`; `apps/workspace/src/server/workspace/crm/services/project-line-item-assignment-service.ts` (`assignFeedbackRound`, `assign`); `apps/workspace/src/common/patterns/crm/project-line-item-form.ts` (`toCreateProjectLineItemRequest`); `apps/workspace/src/server/workspace/crm/command-handler/update-line-item-template.command-handler.ts`.
- **Problem und Auswirkung:** Der Dialog entscheidet über Felder und Wirkung anhand der geladenen Vorlagen-Art; der Request übermittelt aber weder die erwartete Art noch eine Vorlagenversion. Konkreter Ablauf: Nutzer A öffnet eine Standard-Vorlage mit Preisart `one_time`; Nutzer B ändert dieselbe Vorlage auf `feedback_round`. A speichert seine gewöhnliche geplante Position mit Menge `null`. Dieser Request ist auch für die neue Art gültig: Der Server fügt eine Runde hinzu und setzt die Leistung auf `confirmed`, obwohl A weder den Zusatzrunden-Hinweis gesehen noch diesen Verkauf gewählt hat. Umgekehrt wird eine im Dialog angekündigte Zusatzrunde nach Wechsel auf `standard` ohne Rundenschritt gespeichert.
- **Empfehlung:** Die erwartete Vorlagenversion oder mindestens die erwartete Art mitgeben und vor den Effekten serverseitig abgleichen; bei Änderung einen Konflikt mit erneuter Auswahl verlangen. Aktiven Status und Art innerhalb der Schreibtransaktion konsistent lesen. Regressionstest für eine Artänderung bei bereits offenem Dialog ergänzen. Preis und Beschreibung dürfen weiterhin wie geplant individuell überschrieben werden.

### F05 · P3 · Nicht erlaubte Stunden-Vorlagen bleiben in der Auswahl uneingeschränkt wählbar

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/projects/project-line-item-form-dialog/project-line-item-form-dialog.tsx:118`, `:289`.
- **Problem und Auswirkung:** Alle Vorlagenoptionen enthalten nur Titel, Preis und Wert. Auch ohne `hours.manage` kann der Nutzer eine Stunden-Vorlage auswählen; erst danach sieht er den Sperrhinweis und einen deaktivierten Speichern-Button. Task 74 T3 und dessen jsdom-Abnahme verlangen dagegen eine bereits in der Auswahl deaktivierte Stunden-Vorlage mit textlichem Grund. Die serverseitige Berechtigungsprüfung verhindert die Buchung, die zugesagte Orientierung in der Auswahl fehlt jedoch.
- **Empfehlung:** Unveränderliche Berechtigungssperren bereits in der Vorlagenauswahl darstellen und Auswahl verhindern; die bestehenden serverseitigen Gründe verwenden. Die Auswahl muss den bei F02 zulässigen Verkauf freier Stunden weiter ermöglichen. Diese konkrete UI-Abnahme durch einen Dialogtest absichern.

## Architektur und Zusammenspiel

Positiv: Die Zuweisung bündelt Leistung und Effekte in einer Transaktion; Stunden verwenden die bestehende Kundensperre und Activity-Services. Zusatzrunden verwenden die Projektsperre, gemeinsame Positions-/Blocker-Patterns und `updateLockedVersioned`. Updates sperren Status und Preisart der Automatik-Leistungen; die Menge ist nicht Bestandteil des Update-Schemas. Alte nullable Arten werden als Standard gelesen, alte Sätze ohne Menge bleiben Konditionswerte. Neue Template-Regeln sind in Schema und DB-Modell nachvollziehbar abgebildet; DE und EN enthalten die neuen Felder und Fehlertexte.

Die wichtigste strukturelle Schwäche liegt an der Grenze zwischen Formular, vorgelagerten Reads und transaktionaler Zuweisung: Wirkung, aktueller Projektstatus und Identität eines wiederholten Vorgangs sind dort nicht ausreichend abgesichert. Die isolierten Formular-/Effekt-Tests ersetzen keinen Test des zusammengesetzten Dialogablaufs.

## Abdeckung und Prüfungen

- Vollständig gelesen: Task 74; die zentralen geänderten Create-/Update-Handler, Schemas, Assignment-Service und dessen Typen, Mapper, Formular-Patterns und zugehörige Form-/View-Model-Contracts, View-Model und neue Blocker-Query, Feedback-Service, gemeinsame Arten-/Blocker-/Wert-/Positions-Patterns, Migration 0058, beide geänderten Drizzle-Modelle, Katalog- und Zuweisungsdialog, Effekt-Komponente, Leistungssektion und vier betroffene DE-/EN-Dictionaries.
- Zusammenarbeit verfolgt: API-POST, Client-Mutationsdienst, Mutationshook, `canOn`, bestehende Stunden-Zuweisung und Ledger, Projekt-Editor, Feedback-Abnahme und Fortschreibung des Projektschritts, lesende Katalog-/Projektleistungsqueries. Die relevanten scoped Regeln und CLAUDE-Verweise wurden berücksichtigt.
- Tests gelesen: neue Arten-Integration, Create-Handler, View-Model, Leistungssektion und Effekt-Komponente. Weitere passende vorhandene Testdateien wurden mit dem fokussierten Testlauf ausgeführt. Seed und übergeordnetes Constraint-Smoke wurden hinsichtlich der neuen Buchungen und Einbindung gezielt geprüft; der neue `line-item-checks.ts` vollständig.
- `pnpm --filter @invessiv/workspace test project-line-item line-item-template extra-feedback line-item-assignment`: **29 Dateien / 164 Tests bestanden**, **2 Dateien / 17 DB-Integrationstests übersprungen**. Der erste Start scheiterte an Sandbox-`spawn EPERM`; Wiederholung außerhalb der Sandbox erfolgreich.
- `pnpm --filter @invessiv/common test line-item extra-feedback hours-constants`: **7 Dateien / 24 Tests bestanden**.
- Keine neuen Tests geschrieben. Die Findings sind durch nachvollzogene Kontroll- und Datenflüsse belegt; die Fehlerabläufe wurden nicht gegen eine echte DB oder im Browser reproduziert.
- Nicht ausgeführt: DB-Smokes, echte DB-Integration, Migrationswiederholung, Browser-E2E, vollständige Monorepo-Gates und Build. Kein erfülltes Merge-Gate behauptet. Schwerpunkt ist Logik und Planumsetzung; kein vollständiges visuelles/A11y-Audit. Umbenennungen erledigter Pläne und Folgepläne 75/76/13d wurden nur zur Scope-Einordnung betrachtet. Secrets, Dependencies und generierte Dateien wurden nicht als Review-Quellen gelesen.

## Offene Workflow-Fragen

- Zusatzrunden werden laut Plan nur bei Abnahme oder 20 Positionen verweigert. Ein archiviertes/abgebrochenes Projekt ohne abgenommene Runde kann deshalb eine bestätigte Zusatzrunde kaufen, die vor Reaktivierung nicht übergeben werden darf. Das folgt dem aktuellen Plan und ist kein eigenständiger Implementierungsfehler; vor Freigabe fachlich prüfen, ob dieser Verkauf gewünscht ist.
- Die vorgesehenen Gegenbuchungen für Stunden bzw. das Entfernen eines noch ungenutzten Rundenschritts lassen die zugehörige bestätigte Verkaufsposition bestehen. Das kann bei einer reinen Bestandskorrektur richtig sein; eine vollständige Stornierung des Verkaufs ist damit nicht modelliert. Dies ist eine offene Produktentscheidung, kein Verstoß gegen die ausdrücklich gesperrten Statuswerte aus Task 74.

## Vorschläge zur Skill-Verbesserung

Keine Ergänzung erforderlich: Retry-Sicherheit, konkurrierende Änderungen, veraltete Client-Zustände und das Verfolgen kompletter Abläufe sind bereits ausdrücklich Bestandteil des Review-Skills. Der Skill bleibt unverändert.
