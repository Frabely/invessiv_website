# Task 08 — Lead zu Kunde

> **Branch:** `feat/crm-lead-konvertierung`
> **Aufwand:** L (rund zwei Tage)
> **Abhängigkeiten:** Task 04 (Kunde anlegen), Task 06 (Kontakte)
> **Migration:** `0024_link_leads_to_customers.sql` (Planwert)

## Context

Die Brücke zwischen beiden Welten: ein gewonnener Lead wird zum Kunden. Das ist der einzige Task, der
bestehenden Leads-Code anfasst — entsprechend vorsichtig geschnitten.

Der Lead bleibt erhalten und behält seine komplette History (Aktivitäten, Submissions, Outreach). Er
bekommt lediglich eine Verknüpfung auf den neuen Kunden und den Status `converted`. Damit ist von
jedem Kunden aus nachvollziehbar, woher er kam, und die Lead-Statistik bleibt ehrlich.

## Entscheidungen

| Bereich             | Entscheidung                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lead-Datensatz      | Bleibt vollständig bestehen, wird nicht kopiert und nicht verschoben                                                                                 |
| Verknüpfung         | `leads.customer_id` nullable, `ON DELETE SET NULL` — das Löschen eines Kunden zerstört keinen Lead                                                   |
| Neuer Lead-Status   | `converted`, ergänzt die bestehenden 17 Status                                                                                                       |
| Sichtbarkeit        | Konvertierte Leads werden in der Lead-Liste standardmäßig ausgeblendet, sind aber über den Statusfilter erreichbar                                   |
| Doppelkonvertierung | Ausgeschlossen: ein Lead mit gesetzter `customer_id` kann nicht erneut konvertiert werden (Handler-Prüfung plus partieller Unique-Index)             |
| Datenübernahme      | Firmenname, Website, Notizen gehen an den Kunden; Vorname, Nachname, E-Mail, Telefon an den Primärkontakt. Alles im Dialog vorbefüllt und editierbar |
| Bestehender Kunde   | Wählbar: statt einen neuen anzulegen, kann der Lead einem vorhandenen Kunden zugeordnet werden (häufig bei Zweitprojekten)                           |
| Protokoll           | Beidseitig: `lead_activities` bekommt einen Eintrag, `customer_activities` einen vom Typ `converted_from_lead` mit der Lead-ID                       |

## Architektur

```txt
POST /api/workspace/crm/leads/[leadId]/convert
  → withPermission(CustomersWrite)
  → zod parse (Modus: "new" | "existing")
  → convertLeadToCustomer.command-handler
      Transaktion:
        1. Lead laden und sperren, Vorbedingung prüfen (customer_id ist null)
        2. Modus "new":      customers insert + customer_contacts insert (primär)
           Modus "existing": vorhandenen Kunden laden, optional Kontakt ergänzen
        3. leads update: customer_id, lead_status = "converted"
        4. lead_activities insert
        5. customer_activities insert (converted_from_lead)
  → { ok: true, customerId } | Fehlercode
```

Schlägt ein Schritt fehl, rollt alles zurück: es entsteht **kein** halb konvertierter Zustand.

## Tabellenänderung

```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS customer_id uuid NULL
  REFERENCES customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS leads_customer_id_idx ON leads (customer_id);
-- CHECK-Constraint für lead_status um 'converted' erweitern (drop + recreate)
```

Additiv: neue nullable Spalte, erweiterte (nicht verengte) CHECK-Constraint. Bestehende Zeilen
bleiben gültig.

## Verzeichnisstruktur

```txt
packages/db/migrations/0024_link_leads_to_customers.sql
packages/db/src/record-configuration/leads.ts                      + customer_id
packages/common/src/constants/contact/contact-lead-statuses.ts     + Converted

apps/workspace/src/app/api/workspace/crm/leads/[leadId]/convert/route.ts
apps/workspace/src/server/workspace/crm/
  command-handler/convert-lead-to-customer.command-handler.ts
  services/convert-lead.schema.ts
  services/lead-to-customer-mapping-service.ts
apps/workspace/src/client/crm/convert-lead-service.ts

apps/workspace/src/components/workspace/leads/detail/lead-convert-action/
apps/workspace/src/components/workspace/crm/convert/convert-lead-dialog/
apps/workspace/src/i18n/dictionaries/workspace/crm/convert/{de,en}.json
apps/workspace/src/i18n/dictionaries/workspace/leads/shared/{de,en}.json   + Status "converted"
```

## Tickets

### CRM-08-T1 — Migration und Statuserweiterung

- **Files:** `0024_link_leads_to_customers.sql`, `record-configuration/leads.ts`,
  `contact-lead-statuses.ts`, `dictionaries/workspace/leads/shared/{de,en}.json`
- **Skills:** `best-practices`
- **Inhalt:** Spalte, Index, erweiterte CHECK-Constraint; Status `converted` im Const-Objekt und in
  beiden Sprach-Dictionaries; Badge-Ton zuordnen
- **Akzeptanz:**
  - Migration idempotent, bestehende Leads bleiben unverändert gültig
  - Die Leads-Oberfläche zeigt den neuen Status korrekt beschriftet, nicht als Rohwert
  - Bestehende Lead-Tests bleiben grün

### CRM-08-T2 — Mapping und Command-Handler

- **Files:** `services/lead-to-customer-mapping-service.ts`, `services/convert-lead.schema.ts`,
  `command-handler/convert-lead-to-customer.command-handler.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Mapping Lead-Felder auf Kunden- und Kontaktfelder wie oben
  - Transaktion mit Vorbedingungsprüfung; Fehlercodes `LeadAlreadyConverted`, `LeadNotFound`,
    `CompanyNameExists`, `CustomerNotFound`
  - Firmenloser Lead: Anzeigename des Leads wird als Firmenname vorgeschlagen
- **Akzeptanz:**
  - Tests: Erfolgsfall legt genau einen Kunden, einen Kontakt und zwei Activities an
  - Zweiter Konvertierungsversuch ergibt `LeadAlreadyConverted`, ohne etwas zu schreiben
  - Ein Fehler beim Kontakt-Insert hinterlässt **keinen** Kunden (Rollback nachgewiesen)
  - Modus „existing" legt keinen neuen Kunden an

### CRM-08-T3 — Route und Client-Service

- **Files:** `api/workspace/crm/leads/[leadId]/convert/route.ts`,
  `client/crm/convert-lead-service.ts`, `api-endpoints.ts`, README + Tests
- **Skills:** `best-practices`
- **Inhalt:** `withPermission(CustomersWrite)`, Codes auf HTTP mappen (409 bei bereits konvertiert),
  Client-Service als benanntes Service-Objekt mit Type-Guard auf die Antwort
- **Akzeptanz:** Tests für 401/404/403/409/422/201; keine URL-Literale im Client

### CRM-08-T4 — Konvertierungs-Dialog

- **Files:** `components/workspace/crm/convert/convert-lead-dialog/**`,
  `components/workspace/leads/detail/lead-convert-action/**`,
  `dictionaries/workspace/crm/convert/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Aktion „Zu Kunde machen" im Lead-Detail-Panel, sichtbar nur wenn `customer_id` leer ist
  - Dialog zeigt eine Vorschau: was wird zum Kunden, was zum Ansprechpartner. Alle Felder editierbar
  - Umschalter „Neuen Kunden anlegen" / „Bestehendem Kunden zuordnen" mit Kundensuche
  - Nach Erfolg: Weiterleitung auf `/crm?selected=<neueId>` mit Erfolgsmeldung
- **Akzeptanz:**
  - Bereits konvertierter Lead zeigt stattdessen einen Link auf den Kunden, nicht die Aktion
  - Duplikat-Firmenname wird als Feldfehler im Dialog angezeigt, der Dialog bleibt offen
  - Tastaturbedienung vollständig, Fokus korrekt gesetzt

### CRM-08-T5 — Ausblenden in der Lead-Liste

- **Files:** `server/workspace/leads/query-handler/lead-filter.query-handler.ts`,
  `server/workspace/leads/shared/lead-list-search-params.ts`, Toolbar-Dictionary
- **Skills:** `best-practices`, `frontend-design`
- **Inhalt:** Ohne expliziten Statusfilter werden Leads mit Status `converted` ausgeblendet; der
  Statusfilter macht sie sichtbar. Hinweiszeile „N konvertierte Leads ausgeblendet" mit Direktlink
- **Akzeptanz:**
  - Bestehende Filter- und Sortierlogik unverändert; alle Lead-Query-Tests grün
  - Explizite Auswahl von `converted` zeigt genau diese Leads
  - Die Trefferzahl der Pagination passt zur gefilterten Menge

## Deploy-Sicherheit

1. **Live sichtbar:** neue Aktion im Lead-Detail, neuer Lead-Status, Hinweiszeile in der Lead-Liste.
2. **Bricht nichts:** Migration additiv (nullable Spalte, erweiterte CHECK-Constraint). Die Änderung
   an der Lead-Liste ist eine Vorbelegung, kein Verlust — ohne konvertierte Leads ist sie unsichtbar,
   und der Filter erreicht weiterhin alles. Die `ON DELETE SET NULL`-Regel stellt sicher, dass das
   Löschen eines Kunden keinen Lead mitreißt.
3. **Offen:** nichts. Der Flow ist mit diesem Task vollständig.

## End-to-End-Akzeptanz

1. Ein gewonnener Lead lässt sich in einem Dialog zum Kunden machen; die Felder sind vorbefüllt.
2. Danach existiert ein Kunde mit Primärkontakt aus den Lead-Daten.
3. Der Lead trägt Status `converted` und verlinkt auf den Kunden; der Kunde verlinkt zurück.
4. Beide Timelines enthalten je einen Eintrag zur Konvertierung.
5. Ein zweiter Versuch am selben Lead ist nicht möglich und erzeugt keinen Datenmüll.
6. Ein Lead lässt sich alternativ einem bestehenden Kunden zuordnen.
7. Konvertierte Leads sind in der Lead-Liste standardmäßig ausgeblendet, über den Filter erreichbar.
8. Das Löschen des Kunden lässt den Lead bestehen (`customer_id` wird `NULL`).
9. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
