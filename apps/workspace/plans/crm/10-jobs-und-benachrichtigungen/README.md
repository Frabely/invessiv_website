# Ordner 10 — Jobs, Outbox und Benachrichtigungen

> **Status:** offen · **Abhängigkeiten:** 03, 09 · **Aufwand:** 4–5 Tage · **Reviewziel:** 70–100 Dateien

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`19-mail-package.md`](./19-mail-package.md) — gemeinsames transaktionales Mail-Package.
- [`33-outbox-und-benachrichtigungen.md`](./33-outbox-und-benachrichtigungen.md) — Queue,
  Runner, Glocke, Retry und Monitoring.

Zeit- und nebenläufigkeitskritische Vorgänge laufen über eine transaktionale, wiederholbare Outbox.
Die Workspace-Glocke zeigt persönliche Ereignisse. Kritische permanente Fehler werden zusätzlich
per E-Mail gemeldet. Nach Merge werden Aufgabenreminder und Serien asynchron zuverlässig ausgeführt.

## Jobmodell

- `packages/mail`, additive Tabellenmigrationen für `outbox_jobs`/`notifications` sowie deren
  Contracts entstehen gemeinsam in diesem Ordner.
- `outbox_jobs`: Typ, Payload-Version, Idempotenzschlüssel, Status, Priorität, verfügbar ab,
  Lease-Besitzer/-Ablauf, Versuche, Maximalversuche, letzter Fehler, Timestamps.
- Claim atomar mit `FOR UPDATE SKIP LOCKED` oder gleichwertigem Query-Builder-Muster.
- Exponentieller Retry mit Jitter; permanente Validierungsfehler ohne Retry.
- Fachwrite und Outboxzeile in derselben DB-Transaktion.
- Handler sind idempotent und speichern keine Secrets/kompletten PII-Payloads.
- Vercel Cron triggert nur den authentifizierten Runner; die Queue bleibt DB-basiert.

## Benachrichtigungen

- `notifications` pro Workspace-Mitglied mit Typ, sicherer Ressourcenreferenz, gelesen am und
  deterministischem Deduplizierungsschlüssel.
- Glocke, Zähler und Liste mit Deep-Link über typisierte Routen.
- Aufgabe: Zuweisung, frei gewählter Reminder und einmalige Überfälligkeit.
- Normale Vorgänge bleiben In-App. Nur permanente kritische Job- oder Securityfehler senden eine
  interne E-Mail über das Mail-Package.
- Mailprovider fehlt: Job bleibt sichtbar fehlgeschlagen, Fachwrite bleibt erfolgreich.

## Merge-Gate

- [ ] Doppelter Cronlauf und abgelaufene Lease erzeugen keine doppelten Effekte.
- [ ] Poison Job blockiert keine anderen Jobs.
- [ ] Notification-Deep-Link wird vor Ausgabe erneut autorisiert.
- [ ] Glocke funktioniert mit Keyboard, Fokus und beiden Themes.
- [ ] Ausfall von Mailprovider oder Runner macht die App nicht unbenutzbar.
- [ ] `vercel.json`, Secret-Namen, Retry und manueller Replay sind dokumentiert.

## Rollback

Cron deaktivieren und zeitbasierte UI per Flag ausblenden. Synchrone Aufgabenfunktionen aus Ordner
09 bleiben korrekt; wartende Jobs werden nicht gelöscht.
