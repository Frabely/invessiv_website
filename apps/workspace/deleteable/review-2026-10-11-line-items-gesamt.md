# Line Items und Vorlagen – Gesamtprüfung

Stand: 11.10.2026, Commit `ad17f3c9c0d360e17b837208ab17545db3e78f12`; vor den beauftragten Korrekturen. Der vorhandene Strukturbericht bleibt erhalten. Dieser Bericht ergänzt die beiden Task-74-Berichte.

Geprüft wurden Katalog- und Projektformulare samt Form-Patterns, Client-Mutationspfad, API-Routen, Zugriffsregeln, Create-/Update-Handler, Query-Handler, Mapper, Zod-Schemas, Zuweisungsservice, Stundenledger, Zusatzrundenservice, Drizzle-Modelle, Migration 0058 und die einschlägigen Tests. Angrenzend geprüft: Projektänderung, manuelle Stundenzuweisung und Onboarding-Leistungssnapshot. Keine produktive Datenbank geprüft oder verändert. Kein vollständiges Review aller angrenzenden CRM-Features.

## Gesamturteil

Die fachliche Trennung ist sinnvoll: Vorlagen sind ein veränderlicher Katalog; Projektleistungen sind eigenständige Snapshots. Die Herkunft synchronisiert keine Änderungen. Stunden und Zusatzrunden entstehen zusammen mit der Leistung in einer Transaktion. Zugriffsprüfungen sind serverseitig vorhanden, und Stunden- bzw. Projektrechte werden zusätzlich geprüft. Nullable neue DB-Spalten sind eine bewusste Rollout-Regel; Modell und Migration 0058 stimmen darin überein. `projectMode` steuert erst spätere Portal-Anfragen und verbietet bewusst keine interne Zuweisung einer Standardleistung.

Es bestehen jedoch Fehler bei Wiederholungen und konkurrierenden Änderungen sowie ein unbedienbarer UI-Pfad. Dazu kommen die im Strukturbericht belegten Duplikate. Die gültige Modellierung rechtfertigt keine Zusammenlegung unterschiedlicher Konstantenkataloge oder bloße Umbenennung des View-Models in einen Service.

### G01 · P1 · Eine wiederholte Zuweisung bucht erneut

- **Fundstelle:** `project-line-item-assignment-service.ts`, `insertLineItem`; Create-DTO und Projektformular.
- **Problem:** Jeder HTTP-Versuch erzeugt eine neue Leistungs-ID. Die Ledger-Idempotenz mit dieser ID schützt nur innerhalb derselben Zuweisung. Bei verloren gegangener Erfolgsantwort erzeugt der nächste Versuch eine zweite Leistung und erneut Stunden oder eine Zusatzrunde.
- **Empfehlung:** Im Dialog einen stabilen Request-Schlüssel erzeugen und ihn serverseitig vor allen Effekten wiederfinden. Bestehenden Primärschlüssel nutzen; Projektzugriff vor einer Replay-Antwort prüfen. Replays müssen auch nach Vorlagenarchivierung möglich sein.

### G02 · P2 · Projekt und aktive Vorlage werden außerhalb der Transaktion geprüft

- **Fundstelle:** `create-project-line-item.command-handler.ts`; `assignHours`.
- **Problem:** Ein paralleles Archivieren des Projekts oder Templates kann nach dem Lookup und vor dem Insert erfolgen. Die Zuweisung verwendet dann einen veralteten Projektstatus bzw. eine inzwischen archivierte Vorlage. Die Kundensperre schützt keine Projektstatusänderung.
- **Empfehlung:** Projektstatus und Vorlage innerhalb der Transaktion unter passenden Zeilensperren lesen. Fremdschlüsselverträgliche Sperren und bestehende Sperrreihenfolgen berücksichtigen.

### G03 · P2 · Eine geänderte Vorlagenart löst einen unerwarteten Effekt aus

- **Fundstelle:** Create-DTO, `createProjectLineItem`, `applyLineItemTemplateToFormValues`.
- **Problem:** Der Client sendet nur die Vorlagen-ID. Wird eine ausgewählte Standardvorlage mit Einmalpreis während des offenen Dialogs zur Zusatzrunde geändert, fügt der Server überraschend eine Runde hinzu und bestätigt den Verkauf. Der Benutzer hat diesen Effekt im Dialog nicht gesehen.
- **Empfehlung:** Den ausgewählten Vorlagenstand im Request mitführen und bei Änderung einen verständlichen Konflikt liefern. Die tatsächliche Art weiter serverseitig bestimmen.

### G04 · P2 · Freie Stunden an geschlossenen Projekten sind im Formular unerreichbar

- **Fundstelle:** `project-line-item-effect-fields.tsx`, Blocker-Early-Return; Projektformular.
- **Problem:** Bei `ProjectClosed` verschwinden Menge und Zuweisungscheckbox. Der Standard ist Zuweisung aktiviert; der Benutzer kann sie nicht abwählen. Der laut Plannachtrag erlaubte Verkauf in den freien Bestand ist nur per API erreichbar.
- **Empfehlung:** Den Sperrgrund anzeigen und die Checkbox bedienbar lassen. Nur die aktive Projektzuweisung sperren.

### G05 · P3 · Nicht erlaubte Vorlagen bleiben auswählbar

- **Fundstelle:** `project-line-item-form-dialog.tsx`, `templateOptions`; `CustomSelect`.
- **Problem:** Stunden ohne Stundenrecht und blockierte Zusatzrunden werden ohne Grund in der Auswahl angeboten. Erst nach dem Auswählen ist erkennbar, dass Speichern gesperrt ist. Die im Plan geforderte deaktivierte Stundenoption fehlt.
- **Empfehlung:** Optionen mit einem fachlichen Grund deaktivieren; `ProjectClosed` darf die Stundenoption wegen des freien Verkaufs nicht deaktivieren. Tastaturbedienung muss die gesperrten Optionen überspringen.

## Struktur und DB

Die gemeinsamen Snapshotfelder, Preisart-/Intervallumschaltung, Meldungen und Formularrahmen sind in beiden Dialogen weitgehend dupliziert. Die beiden Serverschemas duplizieren dieselben Snapshotgrenzen und Intervallregel. Die zentrale Zeitkonstante und verständliche Blockerauswahl fehlen. Diese Befunde stehen bereits ausführlich im Strukturbericht und gehören zur beauftragten Korrektur.

Keine weitere belastbare Modell-/Migrationsabweichung gefunden: Herkunft hat `SET NULL`, Projektleistungen kaskadieren mit dem Projekt, Stundenmenge ist genau für Stunden erlaubt und begrenzt, NULL-Vorlagen lesen mit definierten Fallbacks. Fachliche Effekte werden vom Schreibpfad gesichert; die DB allein kann Transaktions- und Berechtigungsregeln nicht ausdrücken. Keine Änderung an bereits committeter Migration 0058 erforderlich.

## Prüfgrenzen

Echte DB-Integration und Constraints-Smokes benötigen ein explizites Entwicklungsziel und wurden im Review nicht ausgeführt. Vorhandene Integrationstests decken erfolgreiche Stunden-/Rundeneffekte und einige Ablehnungen ab, aber keine Request-Replays oder konkurrierende Vorlagen-/Statusänderungen. Der Onboarding-Snapshot zeigt bewusst nur Titel und Beschreibung, keine Preise. Weitere Portal-Leistungsanfragen gehören zu Folgeaufgaben.

## Vorschläge zur Skill-Verbesserung

Keine Ergänzung nötig. Idempotenz, konkurrierende Änderungen, Duplikate und FE-/BE-/DB-Zusammenspiel sind bereits ausdrücklich enthalten.

## Beauftragte Umsetzung nach dem Review

G01–G05 wurden behoben. Der neue Dialog erzeugt seinen Request-Schlüssel einmal beim Öffnen und sendet den ausgewählten Vorlagenstand. Der Create-Handler prüft Replays vor dem aktiven Vorlagenstand und liest Projekt sowie Vorlage innerhalb der Transaktion unter Zeilensperren. Stundencheckbox und Menge bleiben an geschlossenen Projekten bedienbar; der freie Verkauf bleibt erlaubt. Gesperrte Optionen zeigen ihren Grund, verweigern die Auswahl und werden bei Pfeiltastennavigation übersprungen.

Vorlagen- und Projektformular nutzen gemeinsame Snapshotfelder, Meldungen, Layout und den vorhandenen `FormDialog`. Snapshotgrenzen und Intervallkonsistenz werden serverseitig gemeinsam definiert. Die Prüfung der Zuweisungsmöglichkeiten liegt im bestehenden Assignment-Service; das View-Model bereitet dessen Ergebnis für die Oberfläche auf. `MINUTES_PER_HOUR` liegt zentral unter `packages/common/src/constants/time/time-units.ts`. Exportierte Assignment-Contracts liegen einzeln in `common/contracts/crm`; Feldlabels und Platzhalter des gemeinsamen Formularcontracts haben eigene benannte Typen.

Die getrennten Konstanten für Leistungsart, Projektmodus und Formularvalidierung bleiben bestehen: Sie sind eigenständige Konzepte und duplizieren keine bestehenden API-Fehlercodes. Die VALUES-Namen entsprechen der bestehenden Großschreibkonvention. Bestehende Migrationen wurden nicht verändert, neue Migrationen waren nicht erforderlich.

**Validierung:** Monorepo-Typecheck, Monorepo-Lint, vollständige Monorepo-Tests und Workspace-Produktionsbuild erfolgreich. Der vollständige Testlauf enthielt 5.131 bestandene Tests; zusätzlich bestanden drei neue Tests des vollständigen Zuweisungsdialogs. Beide PostgreSQL-Line-Item-Suiten bestanden mit 19 Tests, einschließlich paralleler Stunden- und Runden-Replays. Der Entwicklungs-DB-Smoke bestand mit allen 278 Constraintprüfungen. Testfixtures wurden von den bestehenden Cleanup-Pfaden entfernt. Kein Browser-E2E-Lauf.

**Verbleibende Grenzen:** Request-Schlüssel und ausgewählter Vorlagenstand sind aus Kompatibilitätsgründen für ältere API-Clients optional. Der neue Dialog sendet beide immer; ältere Clients ohne diese Angaben erhalten den neuen Retry-/Auswahlstand-Schutz nicht vollständig. Bereits bestehende Lintwarnungen in unberührten Tests und die Turbopack-Warnung zum breiten Env-Dateimuster bleiben außerhalb dieses Scopes.
