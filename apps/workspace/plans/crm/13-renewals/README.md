# Ordner 13 — Renewal-Tracking

> **Merge-Einheit 13 von 16** · **Aufwand:** ~1 Tag · **Review-Umfang:** geschätzt ~40 Dateien
> **Setzt voraus:** Ordner 03 (Detail-Slot), 07 (Mail)
> **Migrationen:** `0034_create_customer_renewals`

## Ziel

Ablaufdaten für Domain, Hosting, SSL und Lizenzen je Kunde, mit Widget im Dashboard und täglicher
Sammel-Erinnerungsmail vor dem Stichtag. Das Tool erinnert — es handelt nicht.

## Tasks in Umsetzungsreihenfolge

| Task | Datei                    | Aufwand | Inhalt                                                      |
| ---- | ------------------------ | ------- | ----------------------------------------------------------- |
| 28   | `28-renewal-tracking.md` | M       | Tabelle, CRUD, Verlängern, Dashboard-Widget, Cron mit Token |

## Nach dem Merge live

Sektion „Ablaufdaten" im Kundendetail, Widget „Läuft bald ab" im CRM-Dashboard (nur wenn etwas
ansteht), täglicher Cron-Lauf mit gesammelter Erinnerungsmail.

## Warum allein

Vollständig unabhängig und klein. Steht vor Ordner 14, weil Task 29 dort `recordFieldChanges` in
`update-renewal` verdrahtet — die Reihenfolge vermeidet, dass ein Handler aus einem späteren Ordner
angefasst werden müsste.

## Vor dem Merge erledigen (Konfiguration)

- [ ] `CRON_SECRET` in allen Vercel-Umgebungen gesetzt
- [ ] **Ort der `vercel.json` geprüft:** sie muss im Root Directory des Vercel-Projekts für
      `apps/workspace` liegen, nicht im Repo-Root. Liegt sie falsch, läuft der Cron nie an — und das
      fällt erst auf, wenn eine Domain abgelaufen ist

## Merge-Gate

- [ ] Migration idempotent; negativer Vorlauf wird abgelehnt
- [ ] Ein Eintrag mit 30 Tagen Vorlauf wird genau ab Tag 30 vor Ablauf fällig
- [ ] Heute bereits gemeldete Einträge sind nicht erneut fällig
- [ ] Zweimaliger Cron-Aufruf am selben Tag versendet nur **eine** Mail
- [ ] Verlängern setzt das neue Datum, leert die Meldemarkierung und protokolliert den Vorgang
- [ ] Ein abgelaufener Eintrag bleibt in der Liste und wird als überfällig geführt
- [ ] Falsches oder fehlendes Token ergibt 401 **und führt keine Abfrage aus**
- [ ] Ohne fällige Einträge: keine Mail, keine Markierung
- [ ] Fehlgeschlagener Versand lässt `last_reminded_on` unverändert (morgen wird erneut versucht)
- [ ] Der Cron-Lauf erscheint nach dem Deploy in den Vercel-Cron-Logs
- [ ] Restlaufzeit korrekt formuliert, auch bei 0 und 1 Tag; Dringlichkeit ohne Farbwahrnehmung erkennbar
- [ ] Das Widget entfällt, wenn nichts ansteht
- [ ] Alle Texte in DE und EN
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün

## Bewusst noch offen

Eine Anbindung an Registrar-APIs wäre der nächste Ausbauschritt und ist bewusst nicht enthalten —
die Erinnerung löst das eigentliche Problem bereits.
