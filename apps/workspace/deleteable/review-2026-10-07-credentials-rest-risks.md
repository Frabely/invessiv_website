# Zugangsdaten: verbleibende größere Risiken nach den Korrekturen

**Stand:** 07.10.2026, Branch `feat/crm-credentials-1-intern`, HEAD `97989d1eabedf03cdceaa989bf6dc0f707b61c66`, einschließlich lokaler Implementierung und der zuletzt vorgenommenen Fixes.

**Gesamturteil:** Im gezielten erneuten Durchgang kein neuer belastbarer P0-/P1-Fehler. Die vier vorherigen UI-Findings sind behoben. Eine Freigabe vor Merge setzt weiterhin die ausstehenden Integrations- und Qualitätsprüfungen voraus. Weitere Review-Runden allein ersetzen diese Nachweise nicht.

## Erneut geprüfte Pfade und Zusammenspiel

- Server: Create-, Update-, Delete- und Reveal-Handler, Listenquery, Credential-Access-Service, Schemas, gemeinsamer CRM-Zielcheck, Event- und Reveal-Limit-Service vollständig gelesen. Der bestehende Scope-Helfer und `canOn` sichern kundenweite und projektgebundene Zugriffe ab. Verschieben prüft zusätzlich das neue Ziel. Keine neue erkennbare Umgehung dieser Grenzen.
- Verschlüsselung und Daten: Crypto-Service, Migration `0054`, Rekey-Skript vollständig gelesen. Der Chiffrat-Kontext bindet Kunde, Eintrag und Feld; Projektwechsel benötigt keine Neuverschlüsselung. Rekey sperrt pro Zeile und verändert keine fachliche Version. Die Liste selektiert keine Chiffrat-Spalten; Antworten und Events enthalten nur die vorgesehenen Daten.
- API: Credential-Response-Helfer, Client-Service, Reveal-Route und gemeinsamer JSON-Transport gelesen. Fehlerantworten laufen durch den privaten No-Store-Wrapper; der Transport loggt keine Payloads. Reveal gibt Klartext erst nach erfolgreichem Abschluss der Audit-Transaktion zurück.
- Oberfläche: Korrekturen des vorherigen Durchgangs berücksichtigt. Scope-View-Model erneut gelesen. Kein neuer großer Architekturbruch in den erneut geprüften Pfaden; UI, Transport, Handler und Persistenz bleiben getrennt.
- Tests: vorhandene DB-Integrationstests insbesondere für Audit, Rollenentzug, beschädigte Chiffrate und Limit geprüft. Dies ist eine gezielte Risiko-Nachprüfung, kein erneut vollständiger Datei-für-Datei-Review aller Änderungen oder aller angrenzenden Features.

## Verbleibende Unsicherheiten vor Merge

1. **DB-Nachweise ausstehend:** Migration/Idempotenz, Constraints, CRM-/RBAC-Smokes und Credential-Integrationstests wurden in diesen Review-/Fix-Läufen nicht ausgeführt. Gerade Fremdschlüssel und reale Transaktionsgrenzen sollten gegen die vorgesehene Testdatenbank bestätigt werden.
2. **Zwei wichtige Negativ-/Parallelfälle fehlen als konkrete Tests:** Das Reveal-Limit wird derzeit sequenziell getestet. Die Benutzersperre soll parallele Reveals unterschiedlicher Einträge serialisieren; das ist statisch plausibel, aber nicht mit parallelen DB-Requests nachgewiesen. Ebenso fehlt ein absichtlich fehlschlagender Audit-Insert mit Prüfung, dass Zeitstempel beziehungsweise Schreibvorgang zurückrollen und keine erfolgreiche Klartextantwort entsteht. Keine bestätigten Implementierungsfehler, sondern gezielte Absicherung der Sicherheitsinvarianten.
3. **Browser und Build:** Ein vollständiger CRM-Flow im echten Browser, App-Build und vollständige Monorepo-Gates stehen aus. Die 99 erfolgreichen fokussierten Tests und der Chromium-Leerzeichentest aus dem Fix-Lauf ersetzen diese Prüfungen nicht. Passwortmanager, echte Tastaturfolge und Clipboard bleiben Browserprüfpunkte.
4. **Schlüsselrotation:** Rekey-Abbruch/Wiederaufnahme und gemischte alte/neue Schlüsselversionen wurden nicht praktisch geprüft. Vor Entfernen alter Schlüssel muss die vollständige Umschreibung und Lesbarkeit nachgewiesen sein.

## Prüfungen und Grenzen

In dieser Nachprüfung nur lesende Codeprüfung; keine erneuten Tests, keine Migration, keine Datenänderungen. Aus dem unmittelbar vorherigen Fix-Lauf: 99 Tests in neun Dateien erfolgreich, Workspace-Typecheck erfolgreich, Workspace-Lint ohne Fehler mit einer bestehenden Warnung; Chromium bestätigt die Erhaltung von Passwort-Leerzeichen. Keine Secrets gelesen. Kein belastbarer zusätzlicher Fix aus diesem Durchgang abgeleitet.

## Vorschläge zur Skill-Verbesserung

Keine Ergänzung erforderlich. Parallelzugriffe, Transaktionsfehler und die klare Trennung von bestätigten Fehlern und fehlenden Nachweisen sind bereits Teil des Skills.
