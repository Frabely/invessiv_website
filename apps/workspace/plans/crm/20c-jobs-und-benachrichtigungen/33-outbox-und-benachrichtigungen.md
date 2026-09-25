# Task 33 — DB-Outbox, Job-Runner und Benachrichtigungen

> **Merge-Einheit:** Ordner 20c · **Branch:** `feat/crm-jobs-und-benachrichtigungen`
> **Abhängigkeiten:** Tasks 02, 19, 32 · **Status:** offen

## Context

Mail, Reminder, Serienerzeugung, Uploadbereinigung und spätere Purges dürfen nicht als unzuverlässige
„DB speichern, danach extern aufrufen“-Folge gebaut werden. Der fachliche Write und die Absicht des
Seiteneffekts müssen atomar sein. Der externe Effekt ist wiederholbar und beobachtbar.

## Entscheidungen

| Bereich              | Entscheidung                                                                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Queue                | PostgreSQL-Outbox, keine zusätzliche Infrastruktur                                                                                                                                      |
| Claim                | atomar, konkurrierende Worker über `FOR UPDATE SKIP LOCKED` oder gleichwertig                                                                                                           |
| Zustände             | `pending`, `processing`, `succeeded`, `retry`, `failed`, `cancelled`                                                                                                                    |
| Retry                | exponentiell mit Jitter; Maximalversuche je Jobtyp                                                                                                                                      |
| Lease                | abgelaufene Worker-Lease macht Job erneut claimbar                                                                                                                                      |
| Idempotenz           | fachlich eindeutiger Key plus Unique-Constraint                                                                                                                                         |
| Benachrichtigung     | DB-Tabelle je internem Mitglied, Glocke und datensatznaher Status                                                                                                                       |
| Digest intern        | höchstens eine Mail je Empfänger und 15-Minuten-Fenster                                                                                                                                 |
| Digest Kunde         | höchstens eine Mail je Mitgliedschaft und `PORTAL_DIGEST_WINDOW_HOURS` (12 h)                                                                                                           |
| Opt-out Kunde        | `portal_memberships.email_notifications_enabled` wird in der Claim-Abfrage gefiltert, nicht im Versand                                                                                  |
| Digest sammelt       | Die Mail nennt **alle** Ereignisse seit dem letzten Versand („drei neue Nachrichten in zwei Projekten"), nie nur das erste                                                              |
| Warum                | Bei zwölf Stunden Fenster wäre „eine neue Nachricht" statt sieben ein Produktfehler, kein Detail                                                                                        |
| E-Mail intern        | nur permanenter kritischer Jobfehler oder Sicherheitsproblem                                                                                                                            |
| Cron                 | **Eine** authentifizierte Route, zwei Zeitpläne: werktags in der Geschäftszeit alle 15 Minuten, sonst alle 2 Stunden                                                                    |
| Warum zweigeteilt    | Jeder Weckvorgang kostet Neon ~5,5 Minuten Wachzeit. Tagsüber ist die DB ohnehin wach, nachts ist der Cron der einzige Kostenträger — so bleibt der Verbrauch im kostenlosen Kontingent |
| Cron-Sicherheit      | Die Route prüft Secret (konstantzeitnah) und Requestmethode selbst; die Middleware lässt `/api/*` durch                                                                                 |
| Kein Cron je Feature | Renewals, Reminder, Serien, Uploadbereinigung und Purges sind Jobtypen, keine eigenen Cron-Einträge                                                                                     |
| Queue-Aufräumen      | Erfolgreiche Jobs nach 30 Tagen, dauerhaft fehlgeschlagene nach 180 Tagen löschen — eigener Jobtyp, täglich                                                                             |
| Warum                | `outbox_jobs` und `pending_digest_events` wachsen sonst unbegrenzt gegen das 0,5-GB-Storage-Limit von Neon Free                                                                         |

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

### Digest-Mechanik

Ein Digest ist **kein** Job je Ereignis. Sonst entscheidet der Unique-Constraint, welches Ereignis
gewinnt, und die übrigen fallen still weg.

- Jedes Ereignis schreibt eine Zeile in `pending_digest_events` (Empfänger, Empfängerart, Typ,
  Ressourcenreferenz, Zeitpunkt) — in derselben Transaktion wie der Fachwrite.
- Ein Digest-Jobtyp je Empfänger prüft beim Lauf: liegen ungesendete Ereignisse vor **und** ist das
  Fenster dieses Empfängers abgelaufen? Dann werden **alle** offenen Ereignisse gelesen, zu einer
  Mail zusammengefasst, der Anker (`customer_notified_at` beziehungsweise
  `conversations.internal_notified_at`) gesetzt und die Ereignisse als gesendet markiert.
- Ereignisse, die während des Versands entstehen, bleiben offen und landen im nächsten Fenster.
- Der Idempotenzschlüssel des Digest-Jobs ist `digest:<empfängerart>:<empfängerId>:<fensterstart>`.
  Er verhindert doppelten **Versand** desselben Fensters, nicht das Sammeln.
- Ein Empfänger ohne offene Ereignisse erzeugt keine Mail — kein „nichts Neues"-Versand.

## Tickets

### CRM-33-T1 — Persistenz und Queue-Service

- Migration, Drizzle-Modelle und Transaktionshelper.
- Claim, Lease-Verlängerung, Erfolg, Retry, permanenter Fehler und manueller Replay.
- DB-Integrationstests mit zwei parallelen Workern.

### CRM-33-T2 — Runner, Registry und Cron

- Server-only Handlerregistry, Timeouts und Fehlerklassifikation.
- **Eine** Cron-Route `/api/cron/outbox` mit konstantzeitnahem Secretvergleich, Methodenprüfung und
  begrenzter Batchgröße. Ein Lauf arbeitet die Queue, bis Batchgrenze oder Zeitbudget erreicht ist.
- Jobtypen zunächst Aufgabenfolge, Aufgabenreminder, Überfälligkeit, Digest und Mail, dazu der
  tägliche Queue-Cleanup.
- Mit dem ersten wirksamen Portal-E-Mail-Versand die in 12b ausgeblendeten Optionen aktivieren:
  Checkbox im Einladungsdialog und Schalter an aktiven Mitgliedschaften in der CRM-Kundenakte,
  jeweils mit DE/EN-Texten und Tests. Der bestehende versionierte PATCH-Pfad wird dafür genutzt;
  auch der Portal-Selbstschalter darf erst dann sichtbar werden. Vorher bleibt der gespeicherte
  Vorgabewert `email_notifications_enabled = true` ohne sichtbare Einstellung.
- **Zwei Zeitpläne auf dieselbe Route** in `apps/workspace/vercel.json`. Vercel-Cron rechnet in UTC;
  das Geschäftsfenster ist deshalb großzügig gesetzt und verschiebt sich mit der Sommerzeit um eine
  Stunde. Das ist folgenlos, weil der Runner idempotent ist und ein Lauf zu viel nichts kostet außer
  Wachzeit:

```json
{
  "crons": [
    { "path": "/api/cron/outbox", "schedule": "*/15 5-18 * * 1-5" },
    { "path": "/api/cron/outbox", "schedule": "0 19-23,0-4 * * 1-5" },
    { "path": "/api/cron/outbox", "schedule": "0 */2 * * 6,0" }
  ]
}
```

- Die Intervalle stehen zusätzlich als Konstanten im Code (`OUTBOX_CRON_BUSINESS_MINUTES`,
  `OUTBOX_CRON_OFFHOURS_HOURS`), damit die Budgetrechnung aus `00-entscheidungen.md` nachvollziehbar
  an einer Stelle hängt und eine Änderung ein bewusster Schritt ist.
- **Ort der Datei prüfen:** `vercel.json` muss im Root Directory des Vercel-Projekts liegen, nicht im
  Repo-Root. Liegt sie falsch, läuft der Cron nie an — und das fällt erst auf, wenn ein Reminder
  ausbleibt.
- **Akzeptanz:**
  - Fehlendes oder falsches Secret führt zu 401/404 und führt keinen Job aus
  - `GET` statt `POST` (beziehungsweise umgekehrt) führt keinen Job aus
  - Zwei überlappende Läufe führen denselben Job nicht zweimal erfolgreich aus
  - Ein Lauf respektiert Batchgrenze und Zeitbudget und lässt den Rest claimbar zurück
  - Der Queue-Cleanup entfernt erfolgreiche Jobs nach 30 und dauerhaft fehlgeschlagene nach 180 Tagen
    und ist mehrfach ausführbar

### CRM-33-T3 — Notification-Center

- Query mit Cursor-Pagination, Count und Mark-read-Command.
- Workspace-Glocke, Popover/Route, Keyboardsteuerung, Fokus und Deep-Links.
- Deep-Link-Ressource vor Anzeige erneut autorisieren.

### CRM-33-T4 — Monitoring und Betrieb

- Strukturierte Metriken: Queuealter, pending/retry/failed, Laufzeit und letzter erfolgreicher Cron.
- Kritische permanente Fehler erzeugen deduplizierten Mailjob an den Owner.
- Runbook für Replay, Poison Job, Cronausfall und Providerstörung.
- **Runbook-Abschnitt „Neon-Kontingent":** monatliche Sichtprüfung der CU-Stunden im
  Neon-Dashboard, dokumentierte Schwelle (über 75 CU-Stunden am 20. des Monats) und die beiden
  Reaktionen — Nachtintervall strecken oder auf Neon Launch wechseln. Grund im Runbook benannt:
  eine Überschreitung suspendiert die Compute bis zum Monatswechsel und nimmt das CRM vollständig
  offline.
- **Runbook-Abschnitt „Storage":** 0,5 GB ist die zweite Decke mit derselben Folge. Wachstumstreiber
  sind `activities`, `messages`, `outbox_jobs` und `pending_digest_events`; der Queue-Cleanup deckt
  die letzten beiden ab.

## Deploy-Sicherheit

- Tabellen und Runner zuerst deployen, danach die Cron-Einträge aktivieren.
- Nach dem ersten vollen Monat werden die tatsächlichen CU-Stunden gegen die Schätzung aus
  `00-entscheidungen.md` gehalten und die Zahl dort korrigiert.
- Bereits vorhandene synchrone Aufgabenfolge bleibt während des Rollouts gültig und idempotent.
- Glocke wird erst verlinkt, wenn Liste, Count und Mark-read funktionieren.
- Ausfall des Runners blockiert keine normalen CRM-Reads/Writes; die Outbox bewahrt Arbeit.

## End-to-End-Akzeptanz

1. Fachwrite und Outboxeintrag sind gemeinsam vorhanden oder gemeinsam abgerollt.
2. Zwei Worker führen denselben Job nicht gleichzeitig erfolgreich aus.
3. Prozessabbruch nach externem Effekt führt beim Retry nicht zu einer doppelten Wirkung.
4. Poison Job blockiert andere Jobs nicht und wird sichtbar `failed`.
5. Sieben Ereignisse in einem Fenster ergeben **eine** Mail, die sieben nennt — nicht eines.
6. Ein Ereignis während des Versands geht nicht verloren, sondern landet im nächsten Fenster.
7. Ein Empfänger ohne offene Ereignisse erhält keine Mail.
8. Notification ist nur für den vorgesehenen Mitarbeiter sichtbar und Deep-Link bleibt autorisiert.
9. Fehlendes/falsches Cronsecret führt zu 401/404 nach API-Konvention und führt keinen Job aus.
