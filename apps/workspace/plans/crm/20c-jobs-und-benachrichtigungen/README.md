# Ordner 20c — Jobs, Outbox und Benachrichtigungen

> **Status:** offen · **Abhängigkeiten:** 03, 20b · **Aufwand:** 4–5 Tage · **Reviewziel:** 70–100 Dateien

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`19-mail-package.md`](./19-mail-package.md) — gemeinsames transaktionales Mail-Package.
- [`33-outbox-und-benachrichtigungen.md`](./33-outbox-und-benachrichtigungen.md) — Queue,
  Runner, Glocke, Retry und Monitoring.

Zeit- und nebenläufigkeitskritische Vorgänge laufen über eine transaktionale, wiederholbare Outbox. Die bis dahin
fertiggestellten Dashboard-Flows bleiben ohne zeitgesteuerte Nebenwirkungen nutzbar; ihre Cleanup- und
Benachrichtigungsereignisse werden in dieser Einheit vollständig nachgezogen.
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
- Digests sammeln: `pending_digest_events` hält offene Ereignisse je Empfänger, der Digest-Job fasst
  beim Ablauf des Fensters **alle** zu einer Mail zusammen. Der Idempotenzschlüssel schützt gegen
  doppelten Versand desselben Fensters, nicht gegen das Sammeln.
- Glocke, Zähler und Liste mit Deep-Link über typisierte Routen.
- Aufgabe: Zuweisung, frei gewählter Reminder und einmalige Überfälligkeit sowie die nachträgliche Aktivierung der
  definierten Ereignisse für Uploads, Onboarding, Feedback und Chat.
- Normale Vorgänge bleiben In-App. Nur permanente kritische Job- oder Securityfehler senden eine
  interne E-Mail über das Mail-Package.
- Mailprovider fehlt: Job bleibt sichtbar fehlgeschlagen, Fachwrite bleibt erfolgreich.

## Merge-Gate

- [ ] Doppelter Cronlauf und abgelaufene Lease erzeugen keine doppelten Effekte.
- [ ] Poison Job blockiert keine anderen Jobs.
- [ ] Notification-Deep-Link wird vor Ausgabe erneut autorisiert.
- [ ] Empfänger kunden- oder projektbezogener Notifications und Digests werden beim Erzeugen **und** beim Versand über
      `canOn` gefiltert (Zugriffsbereiche, Task 36–38); ein entzogener Zugriff erzeugt keine weitere Meldung.
- [ ] Die verzögert geplanten Cleanup- und Benachrichtigungsereignisse aus Storage, Onboarding, Feedback und Chat
      sind nachgezogen; der zugehörige Fachwrite bleibt bei einem Job- oder Providerfehler erfolgreich.
- [ ] Glocke funktioniert mit Keyboard, Fokus und beiden Themes.
- [ ] Ausfall von Mailprovider oder Runner macht die App nicht unbenutzbar.
- [ ] `vercel.json`, Secret-Namen, Retry und manueller Replay sind dokumentiert.

## Rollback

Cron deaktivieren und zeitbasierte UI per Flag ausblenden. Synchrone Aufgabenfunktionen aus Ordner
09 bleiben korrekt; wartende Jobs werden nicht gelöscht.
