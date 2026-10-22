# Task 34 — Export, Purge, Backup und Restore

> **Merge-Einheit:** Ordner 21 · **Branch:** `feat/crm-datenschutz-backup-rollout`
> **Abhängigkeiten:** alle produktiven CRM-Ordner 01–20 · **Status:** offen

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
| Backupziel      | separates externes Speicherkonto gemäß Ordner 20-0                         |
| Rotation        | gemeinsame 30-Tage-Aufbewahrung gemäß Ordner 20-0                          |
| Ziel            | RPO höchstens 24 Stunden, RTO höchstens 4 Stunden                          |
| Restore-Test    | monatlich gemäß Ordner 20-0, niemals über Produktion                       |

## Exportinhalt

- Strukturierte Manifestversion und Exportzeitpunkt.
- Kundenstamm, Personen und Zuordnungen, Projekte, Aufgaben und Serien, Feedback (`feedback_rounds`,
  `feedback_round_items` samt Ergebnissen; Feedbackdateien als normale `files`-Zeilen), Chat,
  freigegebene und interne Dateien, Renewals, Stunden (`customer_hour_purchases`, `project_hour_allocations`, `project_time_entries`) und Activities.
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

**Personen mit Login werden anonymisiert, nicht gelöscht (Vorgabe aus Ordner 03).** `activities.actor_user_id`
und `security_events.actor_user_id` verweisen mit `ON DELETE RESTRICT` auf `users.id`; ein User mit Historie ist
daher nicht löschbar, und `ON DELETE SET NULL` würde die Actor-Invariante brechen. Der Purge ersetzt deshalb
`primary_email`, `first_name`, `last_name` und `display_name` durch neutrale Platzhalter, setzt `clerk_user_id` auf
einen nicht zuordenbaren Wert und `active = false`. Die Historie bleibt konsistent, personenbezogene Daten sind
entfernt. Das zugehörige Clerk-Konto wird separat über die Clerk Backend API gelöscht; ein Fehler dort bleibt als
wiederholbarer Saga-Schritt sichtbar.

## Backup-Pipeline und Restore — vorgezogen in Task 34a

Verbindlich ist [Ordner 20-0](../20-0-kundendaten-backup/README.md): vollständige DB, Blob-Dateien,
Code-/Migrationsstand, versionierter separater Schlüsseltresor, unabhängiges Monitoring und erster Restore.
Task 34 verwendet diese Infrastruktur und ergänzt die Wiederherstellung um Export-/Purge-Fälle.
Ein Restore darf zwischenzeitliche Löschungen und Zugriffswiderrufe nicht still rückgängig machen.

## Tickets

### CRM-34-T1 — Exportservice und Owner-UI

- Preview, Jobanlage, Download, Ablauf und Audit.
- Integrationstest auf Vollständigkeit und Secret-Ausschluss.

### CRM-34-T2 — Purge-Command und Saga

- Preview, Statussperre, Jobhandler, Batchlöschung, DB-Finalisierung und Replay.
- Fault-Injection vor/nach jedem externen Schritt.

### CRM-34-T3 — Backupautomation (vorgezogen)

- Umsetzung und Erstabnahme in CRM-34a-T1 bis T4, Ordner 20-0.
- Hier nur neue Export-/Purge-Anforderungen integrieren; keine zweite Backup-Pipeline bauen.

### CRM-34-T4 — Restore und Produktiv-Gate

- Runbook und Drill aus Ordner 20-0 um Export/Purge ergänzen und erneut prüfen.
- Clerk Restricted, Portalvorschau, Security-/A11y-Smokes und Rollbackweg bestätigen.

## End-to-End-Akzeptanz

1. Export enthält alle Domänen, aber weder Klartext noch verschlüsselte Credential-Payloads.
2. Unterbrochener Purge ist fortsetzbar und verliert nie die Zuordnung zu ungelöschten Blobs.
3. Nach erfolgreichem Purge existieren keine aktiven Fachzeilen oder Primär-Blobs des Kunden.
4. Backupalter löst nach 26 Stunden einen kritischen Alarm aus.
5. Ein isolierter Restore erfüllt 24 Stunden RPO und 4 Stunden RTO samt Hashprüfung.
6. Erst nach erfolgreichem Restore-Drill dürfen alle geprüften Kunden direkt eingeladen werden.
