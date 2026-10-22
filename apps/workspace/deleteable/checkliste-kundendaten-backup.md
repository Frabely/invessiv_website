# Checkliste: Kundendaten sichern, bevor weitere Features entstehen

Stand: 22.10.2026. Fokus: Onboarding-Bögen einschließlich Antworten, Feedback und hochgeladene Kunden-Assets.

Ziel: schnelle Wiederherstellung über Neon plus eine unabhängige Kopie außerhalb von Neon und Vercel. Beim Rückgriff auf die tägliche externe Sicherung sind bis zu 24 Stunden Datenverlust möglich, sofern die Sicherungen erfolgreich laufen.

## 1. Wiederherstellung bei Neon aktivieren

- [ ] Neon Launch für das Produktionsprojekt aktivieren; Konditionen vorher im Dashboard prüfen.
- [ ] History Window ausdrücklich auf **7 Tage** setzen.
- [ ] Automatische tägliche Snapshot-Backups für den tatsächlichen Produktionsbranch einrichten und Aufbewahrung prüfen.
- [ ] Ersten erfolgreichen Snapshot im Dashboard bestätigen.

## 2. Unabhängiges Datenbank-Backup einrichten

- [ ] Privaten Backup-Speicher außerhalb von Neon und Vercel unter getrenntem Konto einrichten.
- [ ] Backup automatisiert täglich ausführen, beispielsweise über GitHub Actions: vollständiger `pg_dump` der produktiven Datenbank über die direkte, ungepoolte Verbindung.
- [ ] Export vor dem Hochladen verschlüsseln; Entschlüsselungsschlüssel separat im Passwortmanager sichern.
- [ ] Zugangsdaten als Secrets hinterlegen; keine Verbindungsstrings, Schlüssel oder Kundendaten in Logs ausgeben.
- [ ] Berechtigungen auf das Notwendige begrenzen; die produktive App erhält keinen Zugriff auf Backups.
- [ ] Sicherungen mit eindeutigen Zeitstempeln mindestens **30 Tage** behalten; neue Sicherungen überschreiben keine alten.
- [ ] Ersten erfolgreichen Export und Upload prüfen. Eine leere oder fehlgeschlagene Sicherung gilt nicht als Erfolg.

## 3. Kunden-Assets mitsichern

- [ ] Hochgeladene Originaldateien aus Vercel Blob täglich in den unabhängigen Backup-Speicher kopieren.
- [ ] Zu jedem DB-Backup ein Manifest mit den zugehörigen Datei-IDs, Storage-Keys, Größen und Prüfsummen speichern.
- [ ] Einen Sicherungsstand erst als vollständig markieren, wenn alle referenzierten Dateien gesichert sind; Änderungen und Löschungen während des Laufs berücksichtigen.
- [ ] Referenzierte Dateikopien mindestens bis zum Ablauf des letzten zugehörigen DB-Backups behalten.
- [ ] Produktive Löschungen nicht sofort auf die Backupkopien übertragen.
- [ ] Längere Neon-Snapshot-Aufbewahrung bei der Dateiaufbewahrung ebenfalls berücksichtigen.

## 4. Wiederherstellung tatsächlich testen

- [ ] Neuestes externes DB-Backup in eine getrennte Testdatenbank zurückspielen und zugehörige Assets in einen getrennten Dateispeicher laden.
- [ ] Testumgebung gegen Kunden-Zugriff und produktive Schreibzugriffe absichern; Mails, Jobs und andere externe Aktionen deaktivieren.
- [ ] Einen vorhandenen Onboarding-Bogen mit Antworten und Anhängen vollständig öffnen.
- [ ] Eine vorhandene Feedbackrunde mit Punkten, Antworten und Anhängen vollständig öffnen, soweit vorhanden.
- [ ] Gesicherte Originaldateien öffnen und Prüfsummen mit dem Manifest vergleichen.
- [ ] Wiederherstellung über Neon ebenfalls an einem separaten Stand prüfen, ohne Produktion zurückzusetzen.
- [ ] Datum, getestete Sicherungsstände, Ergebnis und benötigte Zeit kurz dokumentieren – ohne Kundentexte oder Secrets.
- [ ] Wiederherstellung monatlich und nach wesentlichen Änderungen am Backup-Verfahren erneut testen.

## 5. Ausfälle bemerken und Wiederanlauf dokumentieren

- [ ] Alarm auslösen, wenn seit mehr als **26 Stunden** kein vollständiges externes Backup erfolgreich war.
- [ ] Alarmierung außerhalb des CRM-Job-Runners ausführen und tatsächlich empfangen; auch ein komplett ausgebliebener Backup-Lauf muss erkannt werden.
- [ ] Kurzanleitung festhalten: Speicherort, Schlüsselbeschaffung, Restore-Befehle und Prüfung vor einer Produktionsumschaltung.
- [ ] MFA und Wiederherstellungszugänge für Neon, Vercel, Backup-Speicher und Passwortmanager prüfen.

## Freigabe für weitere Feature-Arbeit

- [ ] Neon-Wiederherstellung ist aktiv.
- [ ] Ein vollständiges externes Backup von Datenbank und referenzierten Assets liegt vor.
- [ ] Onboarding und Feedback wurden daraus erfolgreich wiederhergestellt.
- [ ] Alarmierung und Wiederanlauf sind geprüft.

Aktuell kein zusätzlicher Funktionsausbau für Export-UI, Purge, Mitarbeiterübergaben oder Benachrichtigungscenter nötig, um diese Checkliste abzuarbeiten.

Quellen zu Anbieterfunktionen: [Neon-Tarife und Backup-Funktionen](https://neon.com/docs/introduction/plans), [History Window](https://neon.com/docs/postgres/backup-restore/history-window), [pg_dump bei Neon](https://neon.com/docs/manage/backup-pg-dump). Vor Einrichtung die tatsächlich verfügbaren Optionen im Dashboard prüfen.
