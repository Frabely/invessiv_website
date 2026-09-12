# Task 33 — DB-Outbox, Job-Runner und Benachrichtigungen

> **Merge-Einheit:** Ordner 10 · **Abhängigkeiten:** Tasks 02, 19, 32 · **Status:** offen

## Context

Mail, Reminder, Serienerzeugung, Uploadbereinigung und spätere Purges dürfen nicht als unzuverlässige
„DB speichern, danach extern aufrufen“-Folge gebaut werden. Der fachliche Write und die Absicht des
Seiteneffekts müssen atomar sein. Der externe Effekt ist wiederholbar und beobachtbar.

## Entscheidungen

| Bereich          | Entscheidung                                                                  |
| ---------------- | ----------------------------------------------------------------------------- |
| Queue            | PostgreSQL-Outbox, keine zusätzliche Infrastruktur                            |
| Claim            | atomar, konkurrierende Worker über `FOR UPDATE SKIP LOCKED` oder gleichwertig |
| Zustände         | `pending`, `processing`, `succeeded`, `retry`, `failed`, `cancelled`          |
| Retry            | exponentiell mit Jitter; Maximalversuche je Jobtyp                            |
| Lease            | abgelaufene Worker-Lease macht Job erneut claimbar                            |
| Idempotenz       | fachlich eindeutiger Key plus Unique-Constraint                               |
| Benachrichtigung | DB-Tabelle je internem Mitglied, Glocke und datensatznaher Status             |
| E-Mail intern    | nur permanenter kritischer Jobfehler oder Sicherheitsproblem                  |
| Cron             | authentifizierter Vercel-Cron; Route selbst prüft Secret und Requestmethode   |

## Contracts

- `OutboxJobType`, `OutboxJobStatus`, `NotificationType`, `NotificationSeverity` als Const-Objekte.
- Payloads pro Jobtyp mit `payloadVersion`; keine untypisierte generische JSON-Nutzung nach Claim.
- `OutboxEnqueueInput`, `OutboxClaimResult`, `JobExecutionResult` und `NotificationDto`.
- Jobhandler-Registry ist exhaustiv über alle `OutboxJobType`-Werte.

## Datenmodell

- `outbox_jobs`: UUID, type, payload jsonb, payload_version, idempotency_key, status, priority,
  available_at, lease_owner, lease_expires_at, attempts, max_attempts, last_error_code,
  last_error_summary, created/updated/finished.
- Unique `(type, idempotency_key)`.
- Indizes für claimbare Jobs und dauerhaft fehlgeschlagene Jobs.
- `notifications`: Mitglied, Typ, Severity, Titel-Key, Ressourcenart/-ID, Dedupe-Key, gelesen am,
  Timestamps. Keine Geheimnisse und kein unkontrollierter externer Text.

## Tickets

### CRM-33-T1 — Persistenz und Queue-Service

- Migration, Drizzle-Modelle und Transaktionshelper.
- Claim, Lease-Verlängerung, Erfolg, Retry, permanenter Fehler und manueller Replay.
- DB-Integrationstests mit zwei parallelen Workern.

### CRM-33-T2 — Runner und Registry

- Server-only Handlerregistry, Timeouts und Fehlerklassifikation.
- Vercel-Cron-Route mit konstantzeitnahem Secretvergleich und begrenzter Batchgröße.
- Jobtypen zunächst Aufgabenfolge, Aufgabenreminder, Überfälligkeit und Mail.

### CRM-33-T3 — Notification-Center

- Query mit Cursor-Pagination, Count und Mark-read-Command.
- Workspace-Glocke, Popover/Route, Keyboardsteuerung, Fokus und Deep-Links.
- Deep-Link-Ressource vor Anzeige erneut autorisieren.

### CRM-33-T4 — Monitoring und Betrieb

- Strukturierte Metriken: Queuealter, pending/retry/failed, Laufzeit und letzter erfolgreicher Cron.
- Kritische permanente Fehler erzeugen deduplizierten Mailjob an den Owner.
- Runbook für Replay, Poison Job, Cronausfall und Providerstörung.

## Deploy-Sicherheit

- Tabellen und Runner zuerst deployen, danach Cron aktivieren.
- Bereits vorhandene synchrone Aufgabenfolge bleibt während des Rollouts gültig und idempotent.
- Glocke wird erst verlinkt, wenn Liste, Count und Mark-read funktionieren.
- Ausfall des Runners blockiert keine normalen CRM-Reads/Writes; die Outbox bewahrt Arbeit.

## End-to-End-Akzeptanz

1. Fachwrite und Outboxeintrag sind gemeinsam vorhanden oder gemeinsam abgerollt.
2. Zwei Worker führen denselben Job nicht gleichzeitig erfolgreich aus.
3. Prozessabbruch nach externem Effekt führt beim Retry nicht zu einer doppelten Wirkung.
4. Poison Job blockiert andere Jobs nicht und wird sichtbar `failed`.
5. Notification ist nur für den vorgesehenen Mitarbeiter sichtbar und Deep-Link bleibt autorisiert.
6. Fehlendes/falsches Cronsecret führt zu 401/404 nach API-Konvention und führt keinen Job aus.
