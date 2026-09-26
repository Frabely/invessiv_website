# Task 27 — Stundenbuchungen

> **Merge-Einheit:** Ordner 20 · **Branch:** `feat/crm-stunden-und-history`
> **Aufwand:** M · **Abhängigkeiten:** Task 21 (Portal-Dashboard), Task 05 (Slot)
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

> **Bereinigt 26.09.2026 (Ordner 13, E11/E17):** Es gibt **keinen** Sichtbarkeitsschalter je Buchung — alle Buchungen
> sind portalöffentlich. Die Portalanzeige ist das Registry-Widget `hours` aus Ordner 13 (Mock → echt), kein eigener
> Dashboard-Block.

- Kontingent gehört zum Kunden; Buchung referenziert optional ein Projekt desselben Kunden.
- Dauer wird als positive Minuten gespeichert, Rest wird immer berechnet und nie redundant persistiert.
- Jede Buchung ist automatisch portalöffentlich. Beschreibung wird in der UI ausdrücklich als
  kundensichtbar gekennzeichnet.
- Korrektur/Löschung nutzt optimistic concurrency und protokolliert Alt/Neu; keine Rechnungs- oder
  Lexwarelogik.

## Context

Das „Stundenkontingent nach Launch: 10:00 h verfügbar" aus dem Dashboard-Entwurf. Nach dem Launch
folgt meist eine Betreuung mit festem Stundenkontingent — und regelmäßig die Frage, wie viel davon
noch übrig ist.

Gebaut wird mit Verlauf statt als bloßer Zähler: Jede Leistung ist eine Zeile mit Datum, Dauer und
Beschreibung. Der Rest wird berechnet, nie gespeichert. Der Vorteil ist weniger technischer als
zwischenmenschlicher Natur — der Kunde sieht, wofür die Stunden verbraucht wurden, statt nur eine
schrumpfende Zahl.

## Entscheidungen

| Bereich             | Entscheidung                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| Struktur            | `retainers` (der Vertrag mit Kontingent) und `time_entries` (die einzelnen Buchungen)              |
| Rest                | Immer berechnet (`Kontingent minus Summe der Buchungen`), nie als Spalte geführt                   |
| Warum               | Ein gespeicherter Restwert und der Verlauf können auseinanderlaufen; die Berechnung kann es nicht  |
| Dauer               | In Minuten als Ganzzahl gespeichert, im UI als `h:mm` — keine Fließkommazahlen bei Zeiten          |
| Kundensichtbarkeit  | Kein Schalter: jede Buchung ist portalöffentlich; interne Nacharbeit wird nicht gebucht            |
| Was der Kunde sieht | Kontingent, verbrauchte Summe, Rest und alle Buchungen mit Datum und Beschreibung                  |
| Überziehung         | Erlaubt und deutlich ausgewiesen (negativer Rest), nicht blockiert                                 |
| Zeiträume           | Ein Retainer hat Start und optionales Ende. Buchungen außerhalb sind erlaubt, werden aber markiert |
| Wiederauffüllung    | Über einen neuen Retainer, nicht durch Ändern des alten — so bleibt die Historie ehrlich           |
| Mehrere Retainer    | Möglich; das Dashboard zeigt den aktuell laufenden                                                 |

## Tabellen

```txt
retainers
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  project_id  uuid NULL     → projects.id  ON DELETE SET NULL
  title text NOT NULL
  budget_minutes integer NOT NULL CHECK (budget_minutes > 0)
  starts_on date NOT NULL
  ends_on   date NULL
  notice_period_days integer NULL       Kündigungsfrist, informativ
  created_at / updated_at
  INDEX (customer_id, starts_on desc)

time_entries
  id uuid PK
  retainer_id uuid NOT NULL → retainers.id ON DELETE CASCADE
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE   denormalisiert
  performed_on date NOT NULL
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0)
  description text NOT NULL
  created_at / updated_at
  INDEX (retainer_id, performed_on desc)
```

## Architektur

```txt
POST/PATCH/DELETE /api/workspace/crm/customers/[id]/retainers …
POST/PATCH/DELETE /api/workspace/crm/retainers/[retainerId]/entries …

getRetainerBalance(retainerId)
  → SUM(duration_minutes) in einer Abfrage, kein Laden aller Zeilen

Portal: getPortalDashboard (Task 21) wird um den laufenden Retainer erweitert
  → Summe und Liste über alle Buchungen; Registry-Widget `hours` auf mock: false + portal.hours.read
```

Rest und angezeigte Liste beruhen auf denselben Buchungen — die Rechnung geht für den Kunden immer auf.

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_create_retainers_and_time_entries.sql
packages/db/src/record-configuration/crm/{retainers,time-entries}.ts
packages/common/src/contracts/crm/{retainer.dto.ts,time-entry.dto.ts}
packages/common/src/patterns/crm/format-duration.ts        Minuten → "h:mm"

apps/workspace/src/app/api/workspace/crm/customers/[id]/retainers/route.ts
apps/workspace/src/app/api/workspace/crm/retainers/[retainerId]/route.ts
apps/workspace/src/app/api/workspace/crm/retainers/[retainerId]/entries/route.ts
apps/workspace/src/app/api/workspace/crm/time-entries/[entryId]/route.ts

apps/workspace/src/server/workspace/crm/
  query-handler/{list-retainers,get-retainer-balance}.query-handler.ts
  command-handler/{create,update,delete}-retainer.command-handler.ts
  command-handler/{create,update,delete}-time-entry.command-handler.ts
  services/retainer.schema.ts

apps/workspace/src/components/workspace/crm/retainer/
  customer-retainer-section/
  retainer-balance-bar/
  time-entry-list/
  time-entry-quick-add/
  retainer-form-dialog/
apps/workspace/src/components/portal/dashboard/widgets/portal-hours-widget/   (besteht als Mock seit Ordner 13)
apps/workspace/src/i18n/dictionaries/workspace/crm/retainer/{de,en}.json
apps/workspace/src/i18n/dictionaries/portal/dashboard/{de,en}.json            (Namespace widgets.hours)
```

## Tickets

### CRM-27-T1 — Migration, Modelle, Formatierung

- **Files:** `<nr>_*.sql`, zwei `pgTable`-Dateien, zwei DTOs,
  `patterns/crm/format-duration.ts` + Test
- **Skills:** `best-practices`
- **Inhalt:** Tabellen wie oben; Formatierung von Minuten nach `h:mm`, auch für negative Werte
- **Akzeptanz:**
  - Migration idempotent; eine Dauer von 0 oder weniger wird abgelehnt
  - Test der Formatierung: 0, 59, 60, 90, 600 und negative Werte

### CRM-27-T2 — Handler und Saldo

- **Files:** Query- und Command-Handler, `services/retainer.schema.ts`, alle Routen + Tests
- **Skills:** `best-practices`, `performance`
- **Inhalt:**
  - Saldo als einzelne Aggregatabfrage, nicht durch Laden aller Buchungen
  - Eingabe der Dauer als `h:mm` oder als Dezimalstunden, serverseitig zu Minuten normalisiert
  - Buchung außerhalb des Retainer-Zeitraums wird akzeptiert und markiert
- **Akzeptanz:**
  - Test: Saldo bei 100 Buchungen erzeugt genau eine Abfrage
  - Test: Überziehung ergibt einen negativen Rest, keinen Fehler
  - Test: `1:30`, `1,5` und `1.5` ergeben alle 90 Minuten
  - Test: Löschen einer Buchung korrigiert den Saldo sofort

### CRM-27-T3 — Sektion im CRM

- **Files:** `components/workspace/crm/retainer/**`,
  `dictionaries/workspace/crm/retainer/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Saldo-Balken mit Kontingent, verbraucht und Rest; Überziehung deutlich, aber ohne Alarmton
  - Schnellerfassung: Datum (vorbelegt auf heute), Dauer, Beschreibung — in einer Zeile
  - Buchungsliste nach Datum gruppiert
  - Mehrere Retainer über Registerkarten, laufender vorausgewählt
- **Akzeptanz:**
  - Schnellerfassung vollständig per Tastatur, Eingabetaste speichert
  - Saldo-Balken ohne Farbwahrnehmung lesbar (Zahlen stehen dabei)
  - Hinweis „für den Kunden sichtbar“ an Beschreibung und Bestätigung unübersehbar

### CRM-27-T4 — Anzeige im Portal

- **Files:** `components/portal/dashboard/widgets/portal-hours-widget/**`, Registry-Eintrag `hours` in
  `portal-widget-layout.ts`, `get-portal-dashboard.query-handler.ts` erweitert,
  `dictionaries/portal/dashboard/{de,en}.json`
- **Skills:** `impeccable`, `copywriting`, `accessibility`
- **Inhalt:**
  - Registry-Widget `hours` von Mock auf echt (`mock: false`, `requiredPermission: portal.hours.read`)
  - Widget zeigt verbraucht und übrig in `h:mm`; der Dialog listet alle Buchungen mit Datum und Beschreibung
  - Ohne laufenden Retainer entfällt das Widget vollständig (`onlyWithContent`)
  - Überziehung sachlich formuliert
- **Akzeptanz:**
  - Test: jede Buchung erscheint im Portal und zählt in die Summe
  - Das Widget fehlt, wenn kein Retainer läuft — kein leerer Kasten; ohne `portal.hours.read` fehlt es ebenfalls
  - Texte in DE und EN

## Deploy-Sicherheit

1. **Live sichtbar:** neue Sektion „Stundenkontingent" im Kundendetail; im Portal-Dashboard
   zeigt das Widget `hours` echte Werte, sobald ein Retainer läuft.
2. **Bricht nichts:** zwei neue Tabellen. Die Dashboard-Abfrage aus Task 21 wird um einen optionalen
   Teil erweitert — ohne Retainer bleibt das Ergebnis identisch zu vorher.
3. **Offen:** nichts. Automatische Zeiterfassung oder Abrechnung sind bewusst nicht enthalten; die
   Abrechnung läuft perspektivisch über Lexware.

## End-to-End-Akzeptanz

1. Ein Retainer mit Kontingent lässt sich anlegen.
2. Buchungen lassen sich schnell erfassen; die Dauer akzeptiert mehrere Schreibweisen.
3. Der Rest berechnet sich korrekt und aktualisiert sich sofort.
4. Überziehung wird als negativer Rest ausgewiesen, nicht blockiert.
5. Jede Buchung erscheint im Portal; es gibt keinen Sichtbarkeitsschalter.
6. Das Portal zeigt verbraucht, Rest und alle Buchungen; ohne Retainer fehlt das Widget.
7. Mehrere Retainer sind nebeneinander führbar.
8. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
