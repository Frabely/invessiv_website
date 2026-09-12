# Task 28 — Renewal-Tracking

> **Merge-Einheit:** Ordner 11 · **Branch:** `feat/crm-renewals`
> **Aufwand:** M · **Abhängigkeiten:** Task 05 (Slot), Task 19 (Mail)
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

- Jeder Renewal hat `assignee_member_id`, initial den Kunden-Owner.
- Typen: Domain, Hosting, SSL, Lizenz und `other` mit Pflichtbezeichnung.
- Reminder ausschließlich In-App bei 30, 14 und 7 Tagen sowie einmal bei Überfälligkeit; keine
  tägliche Sammelmail.
- Reminder sind über `(renewal_id, stage, due_date)` dedupliziert und werden als Outboxjob erzeugt.
- Verlängerung verschiebt das Datum, setzt Stufen zurück und schreibt Alt/Neu in die Activity.
- Archivierte Kunden erzeugen keine neuen Reminder.

## Context

Das Feature, dessen Fehlen im Webdesign-Alltag am teuersten ist: Eine Domain läuft aus und die Seite
ist offline. Ein SSL-Zertifikat läuft ab und der Browser warnt vor der Kundenseite. Eine
Plugin-Lizenz endet und Updates hören auf.

Alle diese Daten kennt man — sie stehen nur in Mails von vor einem Jahr. Dieser Task legt sie an den
Kunden, zeigt sie an, wenn es relevant wird, und erinnert per Mail, bevor es zu spät ist.

## Entscheidungen

| Bereich               | Entscheidung                                                                                                                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typen                 | `domain`, `hosting`, `ssl`, `license`, `contract`, `other`                                                                                                                                                  |
| Erinnerung            | Vorlauf in Tagen je Eintrag, Vorgabe 30                                                                                                                                                                     |
| Anzeige               | Widget im CRM-Dashboard „Läuft bald ab", zusätzlich Sektion im Kundendetail                                                                                                                                 |
| Erledigen             | „Verlängert bis …" verschiebt das Datum und protokolliert den Vorgang — kein Löschen und Neuanlegen                                                                                                         |
| Mail                  | Eine gesammelte Übersichtsmail je Tag, nicht eine je Eintrag                                                                                                                                                |
| Auslösung             | Route `/api/cron/renewals`, abgesichert über ein Bearer-Token aus der Umgebung; ausgelöst von Vercel Cron                                                                                                   |
| Warum ein Token       | Die Middleware lässt `/api/*` grundsätzlich durch — der Endpunkt muss sich selbst schützen                                                                                                                  |
| Ort der `vercel.json` | **`apps/workspace/vercel.json`**, nicht im Repo-Root — Vercel Cron wird pro Projekt konfiguriert und die Datei muss im Root Directory des Workspace-Projekts liegen                                         |
| Vor dem Bauen prüfen  | In den Vercel-Projekteinstellungen nachsehen, welches Root Directory für den Workspace gesetzt ist. Liegt die Datei falsch, läuft der Cron nie an — und das fällt erst auf, wenn eine Domain abgelaufen ist |
| Cron-Kontingent       | Der Hobby-Plan erlaubt begrenzt viele Cron-Jobs und nur einen Lauf pro Tag. Ein täglicher Lauf passt, weitere Jobs später nicht beliebig                                                                    |
| Mehrfachversand       | Ein Zeitstempel je Eintrag verhindert, dass derselbe Eintrag mehrfach am Tag gemeldet wird                                                                                                                  |
| Bereits abgelaufen    | Bleibt sichtbar und wird als überfällig geführt, verschwindet nicht                                                                                                                                         |
| Automatik             | Keine automatische Verlängerung, keine Anbindung an Registrare. Das Tool erinnert, es handelt nicht                                                                                                         |

## Tabelle

```txt
customer_renewals
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  renewal_type text NOT NULL        CHECK in RENEWAL_TYPE_VALUES
  label text NOT NULL               z. B. "kanzlei-mueller.de"
  provider text NULL                z. B. "Hetzner"
  expires_on date NOT NULL
  reminder_days_before integer NOT NULL DEFAULT 30 CHECK (reminder_days_before >= 0)
  cost_note text NULL
  last_reminded_on date NULL
  created_at / updated_at
  INDEX (expires_on)
  INDEX (customer_id, expires_on)
```

## Architektur

```txt
CRUD    /api/workspace/crm/customers/[id]/renewals …     Permission CustomersWrite
Verlängern /api/workspace/crm/renewals/[id]/renew        neues Datum + Activity

Dashboard-Widget
  listUpcomingRenewals({ withinDays: 60 })
    → nach Ablaufdatum sortiert, überfällige zuerst

Cron
  GET /api/cron/renewals
    → Bearer-Token gegen CRON_SECRET prüfen
    → fällige Einträge: expires_on - reminder_days_before <= heute
                        UND (last_reminded_on ist leer ODER < heute)
    → eine Übersichtsmail
    → last_reminded_on setzen
```

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_create_customer_renewals.sql
packages/db/src/record-configuration/crm/customer-renewals.ts
packages/common/src/constants/crm/renewal-types.ts
packages/common/src/contracts/crm/renewal.dto.ts

apps/workspace/src/app/api/workspace/crm/customers/[id]/renewals/route.ts
apps/workspace/src/app/api/workspace/crm/renewals/[renewalId]/route.ts
apps/workspace/src/app/api/workspace/crm/renewals/[renewalId]/renew/route.ts
apps/workspace/src/app/api/cron/renewals/route.ts
apps/workspace/vercel.json                        neu: Cron-Eintrag (Ort = Root Directory des Vercel-Projekts)

apps/workspace/src/server/workspace/crm/
  query-handler/{list-renewals,list-upcoming-renewals,list-due-reminders}.query-handler.ts
  command-handler/{create,update,delete,renew}-renewal.command-handler.ts
  services/renewal-reminder-service.ts
  services/renewal.schema.ts

apps/workspace/src/components/workspace/crm/renewals/
  customer-renewals-section/
  renewal-row/
  renewal-form-dialog/
  renew-dialog/
apps/workspace/src/components/workspace/dashboard/upcoming-renewals-widget/
apps/workspace/src/i18n/dictionaries/workspace/crm/renewals/{de,en}.json
```

## Tickets

### CRM-28-T1 — Migration, Modell, Typen

- **Files:** `<nr>_*.sql`, `record-configuration/crm/customer-renewals.ts`,
  `constants/crm/renewal-types.ts` + Test, `contracts/crm/renewal.dto.ts`
- **Skills:** `best-practices`
- **Inhalt:** Tabelle wie oben
- **Akzeptanz:** Migration idempotent; negativer Vorlauf wird abgelehnt

### CRM-28-T2 — Handler

- **Files:** vier Command-Handler, drei Query-Handler, `services/renewal.schema.ts`, drei Routen + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - `renew` setzt ein neues Ablaufdatum, leert `last_reminded_on` und schreibt eine Activity mit
    altem und neuem Datum
  - `listUpcomingRenewals` sortiert überfällige zuerst, dann nach Nähe des Datums
  - `listDueReminders` implementiert die Fälligkeitsregel von oben
- **Akzeptanz:**
  - Test: ein Eintrag mit 30 Tagen Vorlauf wird genau ab Tag 30 vor Ablauf fällig
  - Test: heute bereits gemeldete Einträge sind nicht erneut fällig
  - Test: Verlängern setzt die Meldemarkierung zurück
  - Test: ein abgelaufener Eintrag bleibt in der Liste

### CRM-28-T3 — Cron-Endpunkt und Mail

- **Files:** `api/cron/renewals/route.ts`, `services/renewal-reminder-service.ts`,
  `apps/workspace/vercel.json`, `.env.example` (`CRON_SECRET`) + Tests
- **Skills:** `best-practices`, `copywriting`
- **Inhalt:**
  - Token-Prüfung vor jeder Arbeit; fehlendes oder falsches Token ergibt 401 ohne Hinweis
  - Eine Übersichtsmail, nach Kunde gruppiert, überfällige zuerst
  - Ohne fällige Einträge wird **keine** Mail versendet
  - `last_reminded_on` wird erst nach erfolgreichem Versand gesetzt
  - Cron-Eintrag in `apps/workspace/vercel.json`, täglich morgens
- **Akzeptanz:**
  - Test: falsches Token ergibt 401 und führt keine Abfrage aus
  - Test: ohne fällige Einträge keine Mail und keine Markierung
  - Test: fehlgeschlagener Versand lässt `last_reminded_on` unverändert (am nächsten Tag wird erneut
    versucht)
  - Test: zweimaliger Aufruf am selben Tag versendet nur eine Mail

### CRM-28-T4 — Oberfläche

- **Files:** `components/workspace/crm/renewals/**`,
  `components/workspace/dashboard/upcoming-renewals-widget/**`,
  `dictionaries/workspace/crm/renewals/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Sektion im Kundendetail: Zeilen mit Typ-Symbol, Bezeichnung, Anbieter, Ablaufdatum und
    Restlaufzeit in Tagen
  - Dringlichkeit über Symbol **und** Text („in 12 Tagen", „seit 3 Tagen abgelaufen"), nicht nur Farbe
  - Dashboard-Widget mit den nächsten 60 Tagen, Link auf den jeweiligen Kunden
  - Verlängern-Dialog mit Vorschlag „ein Jahr ab dem bisherigen Ablaufdatum"
  - Widget entfällt, wenn nichts ansteht
- **Akzeptanz:**
  - Restlaufzeit korrekt formuliert, auch bei 0 und 1 Tag
  - Datumsformatierung über die Locale
  - Tastaturbedienung vollständig
  - Texte in DE und EN

## Deploy-Sicherheit

1. **Live sichtbar:** neue Sektion im Kundendetail, neues Widget im CRM-Dashboard (nur wenn etwas
   ansteht), täglicher Cron-Lauf.
2. **Bricht nichts:** eine neue Tabelle. Der Cron-Endpunkt ist durch das Token geschützt und tut ohne
   Einträge nichts. `apps/workspace/vercel.json` entsteht neu — bisher existiert keine; der Eintrag betrifft
   ausschließlich diesen Pfad und ändert kein Deployment-Verhalten.
3. **Offen:** nichts. Eine Anbindung an Registrar-APIs wäre der nächste Ausbauschritt und ist bewusst
   nicht enthalten — die Erinnerung löst das eigentliche Problem bereits.

## End-to-End-Akzeptanz

1. Ablaufdaten lassen sich je Kunde erfassen, bearbeiten und löschen.
2. Das Dashboard-Widget zeigt, was in den nächsten 60 Tagen ansteht, überfällige zuerst.
3. Die Dringlichkeit ist ohne Farbwahrnehmung erkennbar.
4. Verlängern setzt das neue Datum und protokolliert den Vorgang.
5. Der Cron-Lauf versendet eine gesammelte Mail und nur einmal je Tag.
6. Ohne gültiges Token führt der Endpunkt nichts aus.
   6a. Der Cron-Lauf erscheint nach dem Deploy in den Vercel-Cron-Logs — der Nachweis, dass die
   `vercel.json` am richtigen Ort liegt.
7. Ohne fällige Einträge geschieht nichts.
8. Abgelaufene Einträge verschwinden nicht.
9. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
