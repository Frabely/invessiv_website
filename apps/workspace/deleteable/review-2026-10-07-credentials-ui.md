# Review — Task 18: Credentials intern

**Stand:** 07.10.2026, Branch `feat/crm-credentials-1-intern`, HEAD `97989d1eabedf03cdceaa989bf6dc0f707b61c66`. Geprüft wurde das lokale Changeset inklusive unversionierter Dateien gegen `18-credentials-ui.md` und die README von Ordner 19. Keine Codeänderungen.

**Gesamturteil:** Drei P2-Findings und ein P3-Finding. Vor dem Merge insbesondere den Verlust bearbeiteter Notizen und die Aktualisierung der API-Liste beheben. Kein belegter P0-/P1-Befund in den geprüften Pfaden; dies ersetzt keine Prüfung gegen PostgreSQL und echte Browsersessions.

## Umfang und Zusammenspiel

- Vollständig geprüft: neue Credentials-Handler, Access-/Mapping-/Schema-Services, Event-/Limit-Services, drei API-Routen und Response-Helfer; Client-Service, drei Hooks, View-Model, Form-/Filter-/Gruppierungs-Patterns, Contracts und Konstanten; Credentials-Komponenten inklusive CSS, DE-/EN-Dictionaries und zugehörige Tests; Migration `0054`, Tabellenmodell, Constraint-Namen, Credentials-Seed und Rekey-Skript.
- Einbindung geprüft: CRM-Page, Cockpit-Dialog/-View, Endpunkt-Konstanten und Access-Regeln, Dictionary-Loader, extrahierter `crmTargetExists` samt bestehendem Dateien-Service. Bei den großen bestehenden Seed-/Smoke-Skripten wurden die Änderungen und ihre Aufruf-/Cleanup-Kontexte geprüft; eine erneute Vollprüfung aller fremden Fixture- und Constraint-Blöcke gehört nicht zur Abdeckung.
- Angrenzende Schutzmechanismen geprüft: `canOn`, `accessScope`, `crmAccessCondition`, API-Autorisierung, Versionsmutations-Hooks, JSON-Transport, Security-Event-Service, Crypto-Service, Env-Lader, geteilte Dialoge und CollapsibleSection.
- Geltende Root-/Workspace-/Scope-Regeln und Planvorgaben berücksichtigt. Secret-Dateien, Dependencies, generierte Dateien und Binärartefakte wurden nicht als Review-Quellen gelesen.

**Architektur:** Der vertikale Aufbau ist überwiegend konsistent mit dem Dateien-Modul. Listen selektieren keine Chiffrate; Mapper kopieren benannte Metadaten. Rechte werden vor dem Mapping in SQL eingegrenzt und im Schreibpfad am konkreten Scope geprüft. Projektwechsel prüfen das neue Ziel. Reveal-Timestamp und Audit entstehen innerhalb derselben Transaktion; die Nutzerzeilensperre serialisiert Aufdeckungen. Die vorgezogene Ablage unter `server/shared` ist ausdrücklich im Plan erlaubt. Migration und Modell stimmen bei Spalten, Nullability, Defaults, Fremdschlüsseln, CHECKs und Indizes im statischen Vergleich überein. Die Extraktion von `crmTargetExists` vermeidet ein Duplikat zum Dateien-Modul.

## Findings

### F01 · P2 · Versionskonflikt verwirft die bearbeitete aufgedeckte Notiz

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/credentials/credential-form-dialog/credential-form-dialog.tsx:98` (`onConflictAction`), außerdem `:153` (`submittedValues`) und `:350` (Notiz-Eingabe).
- **Problem und Auswirkung:** Eine bestehende Notiz aufdecken, bearbeiten und innerhalb der 30 Sekunden speichern, nachdem jemand parallel z. B. den Titel geändert hat. Der Notizentwurf lebt ausschließlich in `noteReveal`; die Konfliktbehandlung rebasiert dagegen `values` mit weiterhin `noteMode = Keep` und ruft anschließend `noteReveal.hide()` auf. Dadurch geht der Entwurf verloren. Beim erneuten Speichern fehlt die Notiz im Request oder der Dialog schließt ohne Request, obwohl der Konflikthinweis ausdrücklich erhaltene Eingaben verspricht. Dies verletzt `apps/workspace/src/components/workspace/crm/AGENTS.md`, Abschnitt „Verbindlich“: Konflikte behalten die Eingaben, nichts wird still verworfen.
- **Empfehlung:** Den noch gültigen Notizentwurf bei einem Konflikt unter derselben begrenzten Lebensdauer erhalten und gegen die neue Version erneut nutzbar machen. Das Verbergen bei Timeout, Tab-Wechsel und Unmount weiter sicherstellen. Einen Test „aufgedeckte Notiz bearbeitet → 409 → Retry enthält Notiz“ ergänzen.

### F02 · P2 · Schließen nach fehlgeschlagenem Write lädt die Credentials-Liste nicht neu

- **Fundstelle:** `apps/workspace/src/hooks/workspace/crm/use-customer-credentials.ts:36` (Ladeeffekt), `apps/workspace/src/components/workspace/crm/credentials/customer-credentials-section/customer-credentials-section.tsx:90` (`close`) und `:96` (`changed`); Zusammenspiel mit `apps/workspace/src/hooks/workspace/use-versioned-mutation.ts:34`.
- **Problem und Auswirkung:** Ein anderer Nutzer löscht einen Eintrag, während die Liste offen ist. Der eigene Löschversuch erhält `not_found`; beim Schließen ruft der Versionshook nur `router.refresh()` auf. Die Liste liegt jedoch in Client-State und lädt ausschließlich bei geändertem Kunden, Filter, `revision` oder `attempt`. Der RSC-Refresh verändert keinen dieser Werte; der gelöschte Eintrag bleibt sichtbar und weitere Aktionen laufen wieder auf 404. Dasselbe betrifft den veralteten Listenstand nach einem abgebrochenen Bearbeitungskonflikt. Der vorhandene Test prüft nur den Refresh-Aufruf, nicht einen zweiten Listenrequest.
- **Empfehlung:** Fehler-/Konfliktabschlüsse explizit mit der API-Liste synchronisieren: neu laden oder den aktuellen Eintrag übernehmen bzw. bei bestätigtem `not_found` entfernen. Einen Test mit unverändertem Kunden/Filter und aktualisierter Listenantwort ergänzen.

### F03 · P2 · Passwortanzeige erhält bedeutungsvolle Leerzeichen nicht

- **Fundstelle:** `apps/workspace/src/components/shared/credentials/credential-secret-field/credential-secret-field.module.css:36` (`.plain`) und `:42`; Renderer in `credential-secret-field.tsx:96`, Eingabevertrag in `credential-schemas.ts:28`.
- **Problem und Auswirkung:** Passwörter dürfen ausdrücklich führende, nachgestellte und mehrere aufeinanderfolgende Leerzeichen enthalten und werden ungetrimmt gespeichert. Die Passwortanzeige verwendet ein normales Text-`span`; `white-space: pre-wrap` gilt ausschließlich für Notizen. Dadurch werden mehrere Leerzeichen zusammengezogen und Rand-Leerzeichen visuell nicht zuverlässig dargestellt. Beispielsweise erscheint `a  b` wie `a b`; manuelles Übertragen des angezeigten Passworts kann scheitern. Der Kopierbutton erhält weiterhin den richtigen Originalwert.
- **Empfehlung:** Auch Geheimniswerte mit einer whitespace-erhaltenden Darstellung rendern und einen Browserfall mit Rand- und Doppel-Leerzeichen prüfen.

### F04 · P3 · Fokusziel fehlt nach Löschen oder Verschieben einer Zeile

- **Fundstelle:** `apps/workspace/src/components/workspace/crm/credentials/customer-credentials-section/customer-credentials-section.tsx:90` (`close`) und `:96` (`changed`).
- **Problem und Auswirkung:** Beim Öffnen wird nur das konkrete Button-Element gespeichert. Nach erfolgreichem Löschen oder Projektwechsel verschwindet dieses Element durch das Neuladen bzw. den Wechsel der Gruppe. `close()` fokussiert nur ein noch verbundenes Element und hat keinen Ersatz; selbst ein zunächst zurückgegebener Fokus geht beim anschließenden Entfernen verloren. Für Tastaturnutzer fehlt danach eine stabile Fortsetzung in der Sektion. Der geteilte Dialog stellt keinen fachlichen Ersatzfokus bereit.
- **Empfehlung:** Nach Listenabgleich einen stabilen Fokus setzen, etwa auf die nächste Zeile oder den Sektionstoggle; falls vorhanden auf „Zugang hinzufügen“. Löschen und Projektwechsel mit echter Tastaturbedienung prüfen.

## Prüfungen und Grenzen

- **Grün:** fokussierte Workspace-Tests, **8 Dateien / 88 Tests** (Reveal-Hook, Sektion, Formular, Patterns, Credentials-Konstanten, Routen und Mapper). Der erste Start scheiterte an Sandbox-`EPERM`; der genehmigte Lauf außerhalb der Sandbox war erfolgreich.
- **Grün:** `pnpm --filter @invessiv/workspace typecheck` und `pnpm --filter @invessiv/db typecheck`.
- **Workspace-Lint:** keine Fehler; eine Warnung in der unveränderten Datei `src/server/tests/workspace/crm/command-handler/update-project.command-handler.test.ts:189` (`_omitted` ungenutzt).
- Die Findings wurden anhand der konkreten Daten-/Renderpfade abgesichert. Keine neuen Tests oder Fixes im Review angelegt; die vorhandenen grünen Tests decken F01–F04 nicht ab.
- Nicht ausgeführt: Migrationen, DB-Smokes, Seeds, Rekey, echte DB-Integrationstests, App-Build, Browser-E2E und die vollständigen Monorepo-Gates. Insbesondere Migration-Idempotenz, paralleles Reveal-Limit und Rollback bei fehlgeschlagenem Audit-Insert sind noch nicht durch diesen Review-Lauf empirisch bestätigt. Der bestehende Limit-Test arbeitet sequenziell; ein zusätzlicher Paralleltest und ein Audit-Rollback-Test wären sinnvolle Absicherungen.
- Rekey wurde statisch auf Zeilensperren, atomare Feldumschreibung, unveränderte Version/Zeitstempel und Wiederholbarkeit geprüft; Abbruch/Wiederaufnahme nicht praktisch ausgeführt. Produktionsschlüssel und Offline-Sicherung bleiben ein externer Betriebsschritt.
- Browserabhängige Punkte wie Passwortmanager-Verhalten, Clipboard, tatsächliche Fokusfolge, Dark/Light-Kontrast und mobile Darstellung bleiben offen. Eine `autocomplete`-Attributprüfung beweist keine unterdrückte Speicheraufforderung im realen Browser.

## Vorschläge zur Skill-Verbesserung

Keine neue allgemeine Regel erforderlich. Entwurfsverlust, Cache-/Client-State-Synchronisierung, Fokus nach Mutationen sowie parallele Audit-/Limitpfade sind bereits durch die bestehenden Prüfschwerpunkte abgedeckt. Der Skill bleibt unverändert.

## Korrekturen nach dem Review (07.10.2026)

- **F01 behoben:** Konflikte verwerfen nur unveränderte oder noch ladende Reveals. Ein bearbeiteter Notizentwurf bleibt im Reveal-Hook unter seiner ursprünglichen Deadline erhalten, auch wenn die frische Version keine Notiz mehr enthält. Timeout und Hintergrundwechsel verwerfen ihn weiterhin; späte Konfliktantworten stellen abgelaufene Entwürfe nicht wieder her.
- **F02 behoben:** Jeder Dialogabschluss lädt die API-Liste erneut. Der Request-Key enthält auch Revision und Wiederholungsversuch, sodass veraltete Zeilen während des Abgleichs ausgeblendet werden.
- **F03 behoben:** Geheimniswerte verwenden grundsätzlich `white-space: pre-wrap`. Ein lokaler Chromium-Test mit führenden, doppelten und nachgestellten Leerzeichen bestätigt, dass jedes Zeichen seine Layoutbreite behält.
- **F04 behoben:** Der Fokus wird nach dem Listenabgleich zurückgegeben. Bei ersetzten Zeilen wird eine verfügbare Aktion mit derselben Beschriftung gesucht; andernfalls erhält der stabile Abschnittsschalter den Fokus.
- **Validierung:** 9 betroffene Testdateien mit 99 erfolgreichen Tests, Workspace-Typecheck grün, Workspace-Lint ohne Fehler (bestehende `_omitted`-Warnung unverändert). Ergänzte Regressionen prüfen Notizkonflikte samt Deadline und Hintergrundwechsel, späte Reveal-Antworten, Listenabgleich nach Fehlern/Konflikten sowie Fokus nach Löschen und Gruppenwechsel.
- App-Build, vollständige Monorepo-Gates und Browser-E2E des CRM wurden für die Korrekturen nicht ausgeführt.
