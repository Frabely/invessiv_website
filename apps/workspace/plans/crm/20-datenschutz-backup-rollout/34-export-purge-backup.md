# Task 34 — Export, Purge, Backup und Restore

> **Merge-Einheit:** Ordner 20 · **Abhängigkeiten:** alle produktiven CRM-Ordner 01–19 · **Status:** offen

## Context

Echte Kundendaten dürfen erst breit produktiv genutzt werden, wenn Auskunft, gezielte Löschung und
Wiederherstellung praktisch funktionieren. Ein theoretisches Backup ohne getesteten Restore gilt
nicht als abgeschlossen. Der Purge bleibt bewusst ohne normalen CRM-Button, erhält aber einen
getesteten Owner-Command.

## Entscheidungen

| Bereich         | Entscheidung                                                               |
| --------------- | -------------------------------------------------------------------------- |
| Export          | interne Owner-Oberfläche, asynchroner Job, kurzlebiges verschlüsseltes ZIP |
| Credentialdaten | nur Metadaten, niemals entschlüsselte Passwörter oder Notizen              |
| Purge           | Vorschau + erneute Kundennummer-Bestätigung; kein normaler UI-Button       |
| Reihenfolge     | Zugriffe sperren → Manifest → Primär-Blobs löschen → DB-Zeilen löschen     |
| Teilfehler      | Zustand `purge_pending`, Writes gesperrt, idempotent fortsetzbar           |
| DB-Backup       | täglicher verschlüsselter `pg_dump` per GitHub Actions                     |
| Backupziel      | separater Vercel-Blob-Store mit getrenntem Token                           |
| Rotation        | täglich 30 Tage, monatlich 12 Monate, Dateikopien 90 Tage                  |
| Ziel            | RPO höchstens 24 Stunden, RTO höchstens 4 Stunden                          |
| Restore-Test    | quartalsweise in isolierter Umgebung, niemals über Produktion              |

## Exportinhalt

- Strukturierte Manifestversion und Exportzeitpunkt.
- Kundenstamm, Personen und Zuordnungen, Projekte, Aufgaben und Serien, Feedback, Chat,
  freigegebene und interne Dateien, Renewals, Retainer, Stunden und Activities.
- Credential-Metadaten: Titel, URL und Änderungsdatum; keine verschlüsselten Envelopes im
  benutzerlesbaren Export und kein Klartext.
- Dateien mit stabiler relativer Struktur und SHA-256 im Manifest.
- Download-URL kurzlebig und `no-store`; Exportblob nach dokumentierter Frist automatisch entfernen.

## Purge-Saga

1. Owner fordert Vorschau an; Server ermittelt alle Datensätze und Storage-Keys neu.
2. Owner bestätigt mit exakter Kundennummer; Command setzt atomar `purge_pending` und widerruft
   Portalmitgliedschaften/Invites.
3. Alle Mutationen auf Kunde und Kinder antworten währenddessen mit 409; Reads bleiben für Owner zur
   Diagnose möglich.
4. Job schreibt unveränderliches Purge-Manifest ohne Secrets.
5. Storage-Adapter löscht Primärdateien in wiederholbaren Batches. Fehlende Objekte gelten als Erfolg.
6. Erst bei vollständig bestätigter Storagebereinigung löscht eine DB-Transaktion alle Fachzeilen.
7. Abschlussactivity enthält nur Kundennummer, Counts, Actor und Manifesthash; nicht den gelöschten
   Inhalt.

Backupkopien werden nicht nachträglich umgeschrieben. Sie sind streng gesperrt und verschwinden mit
der normalen Rotation; dieser Zeitraum wird im Datenschutzprozess dokumentiert.

## Backup-Pipeline

- GitHub-OIDC oder minimaler Secretzugriff; keine Zugangsdaten in Workflowlogs.
- Dump zunächst in temporäres, verschlüsseltes Artefakt; Upload erst nach erfolgreicher Prüfung.
- Dateibackup kopiert neue/geänderte Blobs und schreibt Manifest. Gelöschte Produktivdateien bleiben
  nur bis zum Ende der 90-Tage-Generation.
- Retentionjob arbeitet ausschließlich im Backupstore und löscht nur eindeutig klassifizierte,
  abgelaufene Generationen.
- Alert, wenn letzter erfolgreicher DB- oder Datei-Backupzeitpunkt älter als 26 Stunden ist.

## Restore-Drill

- Neue isolierte Neon-/Postgres-Zieldatenbank und separater Restore-Blob-Store.
- DB-Dump entschlüsseln, restore, Migrationstand prüfen und Anwendung im isolierten Modus starten.
- Dateien anhand Manifest kopieren und jeden SHA-256 prüfen.
- Stichprobe Kunde mit Portal, Projekt, Aufgabe, Feedback, Chat, Credential-Metadaten und Stunden.
- Gemessene RPO/RTO, Abweichungen und Korrekturmaßnahmen protokollieren.
- Restoreumgebung nach Abnahme kontrolliert entfernen; niemals Produktions-Keys verwenden.

## Tickets

### CRM-34-T1 — Exportservice und Owner-UI

- Preview, Jobanlage, Download, Ablauf und Audit.
- Integrationstest auf Vollständigkeit und Secret-Ausschluss.

### CRM-34-T2 — Purge-Command und Saga

- Preview, Statussperre, Jobhandler, Batchlöschung, DB-Finalisierung und Replay.
- Fault-Injection vor/nach jedem externen Schritt.

### CRM-34-T3 — Backupautomation

- GitHub-Workflow, Verschlüsselung, Blobziel, Manifest, Rotation und Altersmonitoring.
- Env-/Secret-Dokumentation ohne committed Werte.

### CRM-34-T4 — Restore und Produktiv-Gate

- Ausführbares Runbook, erster erfolgreicher Drill und Abnahmeprotokoll.
- Clerk Restricted, Portalvorschau, Security-/A11y-Smokes und Rollbackweg bestätigen.

## End-to-End-Akzeptanz

1. Export enthält alle Domänen, aber weder Klartext noch verschlüsselte Credential-Payloads.
2. Unterbrochener Purge ist fortsetzbar und verliert nie die Zuordnung zu ungelöschten Blobs.
3. Nach erfolgreichem Purge existieren keine aktiven Fachzeilen oder Primär-Blobs des Kunden.
4. Backupalter löst nach 26 Stunden einen kritischen Alarm aus.
5. Ein isolierter Restore erfüllt 24 Stunden RPO und 4 Stunden RTO samt Hashprüfung.
6. Erst nach erfolgreichem Restore-Drill dürfen alle geprüften Kunden direkt eingeladen werden.
