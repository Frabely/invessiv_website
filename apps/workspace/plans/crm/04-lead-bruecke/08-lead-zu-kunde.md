# Task 08 — Lead zu Kunde

> **Branch:** `feat/crm-lead-konvertierung`
> **Aufwand:** L (rund zwei Tage)
> **Abhängigkeiten:** Task 01 (Tabelle `customer_contacts`), Task 05 (Detail-Panel)
> **Ausdrücklich keine Abhängigkeit** auf die Kontakte-Oberfläche: der Konvertierungs-Dialog legt den
> Primärkontakt selbst an und braucht dafür nur die Tabelle, nicht die Sektion im Detailpanel
> **Migration:** `0024_link_leads_to_customers.sql` (Planwert)

## Context

Die Brücke zwischen beiden Welten: ein gewonnener Lead wird zum Kunden. Das ist der einzige Task, der
bestehenden Leads-Code anfasst — entsprechend vorsichtig geschnitten.

Der Lead bleibt erhalten und behält seine komplette History (Aktivitäten, Submissions, Outreach). Er
bekommt lediglich eine Verknüpfung auf den neuen Kunden. Damit ist von jedem Kunden aus
nachvollziehbar, woher er kam, und die Lead-Statistik bleibt ehrlich.

Zusätzlich werden die Aktivitäten des Leads auf den Kunden umgeschrieben (`activities.customer_id`
nachgetragen, `lead_id` bleibt stehen). Dadurch ist die Kunden-Timeline ab Task 29 eine einzige
indizierte Abfrage und enthält die komplette Akquise-Vorgeschichte — die Historie reißt an der
Konvertierung nicht ab.

## Entscheidungen

| Bereich             | Entscheidung                                                                                                                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lead-Datensatz      | Bleibt vollständig bestehen, wird nicht kopiert und nicht verschoben                                                                                                                                                   |
| Verknüpfung         | `leads.customer_id` nullable, `ON DELETE SET NULL` — das Löschen eines Kunden zerstört keinen Lead                                                                                                                     |
| Kein neuer Status   | `lead_status` wird **nicht angefasst**. Marker für „konvertiert" ist `leads.customer_id IS NOT NULL`                                                                                                                   |
| Warum               | Das ist die Tatsache selbst und kann nicht von der Statusspalte abdriften. Ein 18. Status hätte Migration der CHECK-Constraint, Badge-Ton und zwei Dictionary-Einträge gekostet — und wäre operativ dasselbe wie `won` |
| Statuswechsel       | Der Dialog setzt den Lead auf `won`, falls er dort nicht schon steht. Ein bestehender Status wird nie überschrieben, wenn er bereits `won` ist                                                                         |
| Sichtbarkeit        | Konvertierte Leads werden in der Lead-Liste standardmäßig ausgeblendet. Umgesetzt über einen **erweiterten bestehenden Zweig** in `lead-filter.query-handler.ts:43-48`, wo `archived` schon genauso behandelt wird     |
| Erreichbar          | Über einen eigenen Umschalter „Konvertierte einblenden" in der Toolbar, nicht über den Statusfilter                                                                                                                    |
| Doppelkonvertierung | Ausgeschlossen: ein Lead mit gesetzter `customer_id` kann nicht erneut konvertiert werden (Handler-Prüfung plus partieller Unique-Index)                                                                               |
| Datenübernahme      | Anzeigename, Firmenname, Website, Notizen und **Kategorie** gehen an den Kunden; Vorname, Nachname, E-Mail, Telefon an den Primärkontakt. Alles im Dialog vorbefüllt und editierbar                                    |
| Kundentyp           | Lead mit Firmenname wird `company`, Lead ohne Firmenname wird `individual` — vorbelegt, im Dialog umschaltbar                                                                                                          |
| Zusatzkontakte      | `lead_email_contacts`, `lead_call_contacts` und `lead_social_profiles` bleiben bewusst am Lead und werden **nicht** kopiert                                                                                            |
| Warum               | Der Lead existiert weiter, es geht also nichts verloren. Kopieren würde Dubletten erzeugen. Stattdessen verlinkt die Kundenakte sichtbar auf den Ursprungs-Lead                                                        |
| Bestehender Kunde   | Wählbar: statt einen neuen anzulegen, kann der Lead einem vorhandenen Kunden zugeordnet werden (häufig bei Zweitprojekten)                                                                                             |
| Protokoll           | Zwei Einträge in `activities`: einer am Lead, einer am Kunden vom Typ `converted_from_lead` mit der Lead-ID                                                                                                            |
| Historie-Übernahme  | Alle Aktivitäten des Leads bekommen zusätzlich die `customer_id`; `lead_id` bleibt erhalten                                                                                                                            |

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
        3. leads update: customer_id setzen; lead_status auf "won", falls noch nicht
        4. activities update: customer_id auf allen Zeilen dieses Leads nachtragen
        5. activities insert am Lead + activities insert am Kunden (converted_from_lead)
  → { ok: true, customerId } | Fehlercode
```

Schlägt ein Schritt fehl, rollt alles zurück: es entsteht **kein** halb konvertierter Zustand.

## Tabellenänderung

```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS customer_id uuid NULL
  REFERENCES customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS leads_customer_id_idx ON leads (customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS leads_customer_id_uidx ON leads (id)
  WHERE customer_id IS NOT NULL;
```

Additiv: eine neue nullable Spalte und zwei Indizes. **Keine** CHECK-Constraint wird angefasst,
`lead_status` bleibt unverändert — bestehende Zeilen bleiben ohne Zutun gültig.

## Verzeichnisstruktur

```txt
packages/db/migrations/0024_link_leads_to_customers.sql
packages/db/src/record-configuration/leads.ts                      + customer_id

apps/workspace/src/app/api/workspace/crm/leads/[leadId]/convert/route.ts
apps/workspace/src/server/workspace/crm/
  command-handler/convert-lead-to-customer.command-handler.ts
  services/convert-lead.schema.ts
  services/lead-to-customer-mapping-service.ts
apps/workspace/src/client/crm/convert-lead-service.ts

apps/workspace/src/components/workspace/leads/detail/lead-convert-action/
apps/workspace/src/components/workspace/crm/convert/convert-lead-dialog/
apps/workspace/src/i18n/dictionaries/workspace/crm/convert/{de,en}.json
apps/workspace/src/i18n/dictionaries/workspace/leads/toolbar/{de,en}.json  + Umschalter-Text
```

## Tickets

### CRM-08-T1 — Migration und Verknüpfung

- **Files:** `0024_link_leads_to_customers.sql`, `record-configuration/leads.ts`
- **Skills:** `best-practices`
- **Inhalt:** Spalte `customer_id`, zwei Indizes. Keine Änderung an `lead_status` oder dessen
  CHECK-Constraint
- **Akzeptanz:**
  - Migration idempotent, bestehende Leads bleiben unverändert gültig
  - Bestehende Lead-Tests bleiben grün, ohne dass eine Erwartung angepasst wurde
  - `contact-lead-statuses.ts` ist unverändert (Review-Punkt im PR)

### CRM-08-T2 — Mapping und Command-Handler

- **Files:** `services/lead-to-customer-mapping-service.ts`, `services/convert-lead.schema.ts`,
  `command-handler/convert-lead-to-customer.command-handler.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Mapping Lead-Felder auf Kunden- und Kontaktfelder wie oben, inklusive `category_id`
  - Firmenloser Lead wird `customer_type = individual`, der Anzeigename des Leads wird
    `display_name` — **nicht** `company_name`
  - Transaktion mit Vorbedingungsprüfung; Fehlercodes `LeadAlreadyConverted`, `LeadNotFound`,
    `CustomerNotFound`. Kein Duplikat-Fehler — gleiche Namen sind erlaubt
  - Nachtragen der `customer_id` auf allen Aktivitäten des Leads
- **Akzeptanz:**
  - Tests: Erfolgsfall legt genau einen Kunden, einen Kontakt und zwei Activities an
  - Test: ein Lead mit drei bestehenden Aktivitäten führt danach zu drei Aktivitäten, die **sowohl**
    `lead_id` als auch `customer_id` tragen
  - Test: ein firmenloser Lead ergibt einen Kunden vom Typ `individual` ohne `company_name`
  - Test: die Kategorie des Leads steht danach am Kunden
  - Test: ein Lead, dessen Firmenname bereits einem anderen Kunden gehört, konvertiert **erfolgreich**
  - Zweiter Konvertierungsversuch ergibt `LeadAlreadyConverted`, ohne etwas zu schreiben
  - Ein Fehler beim Kontakt-Insert hinterlässt **keinen** Kunden (Rollback nachgewiesen)
  - Modus „existing" legt keinen neuen Kunden an, trägt aber die Historie genauso nach

### CRM-08-T3 — Route und Client-Service

- **Files:** `api/workspace/crm/leads/[leadId]/convert/route.ts`,
  `client/crm/convert-lead-service.ts`, `api-endpoints.ts`, README + Tests
- **Skills:** `best-practices`
- **Inhalt:** `withPermission(CustomersWrite)`, Codes auf HTTP mappen (409 bei bereits konvertiert),
  Client-Service als benanntes Service-Objekt mit Type-Guard auf die Antwort
- **Akzeptanz:** Tests für 401/404/403/409/422/201; keine URL-Literale im Client; kein 409 mehr für
  gleiche Namen

### CRM-08-T4 — Konvertierungs-Dialog

- **Files:** `components/workspace/crm/convert/convert-lead-dialog/**`,
  `components/workspace/leads/detail/lead-convert-action/**`,
  `dictionaries/workspace/crm/convert/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Aktion „Zu Kunde machen" im Lead-Detail-Panel, sichtbar nur wenn `customer_id` leer ist
  - Dialog zeigt eine Vorschau: was wird zum Kunden, was zum Ansprechpartner. Alle Felder editierbar
  - Umschalter „Neuen Kunden anlegen" / „Bestehendem Kunden zuordnen" mit Kundensuche
  - Umschalter Firma / Privatperson, vorbelegt aus dem Vorhandensein eines Firmennamens
  - Hinweis, dass Zusatzkontakte und Social-Profile am Lead bleiben und von dort erreichbar sind
  - Bei gleichnamigem bestehenden Kunden derselbe Duplikat-Hinweis wie in Task 04 — mit dem
    naheliegenden Angebot, stattdessen dem bestehenden Kunden zuzuordnen
  - Nach Erfolg: Weiterleitung auf `/crm?selected=<neueId>` mit Erfolgsmeldung
- **Akzeptanz:**
  - Bereits konvertierter Lead zeigt stattdessen einen Link auf den Kunden, nicht die Aktion
  - Der Duplikat-Hinweis blockiert nicht und schlägt den Modus „Bestehendem Kunden zuordnen" vor
  - Tastaturbedienung vollständig, Fokus korrekt gesetzt

### CRM-08-T5 — Ausblenden in der Lead-Liste

- **Files:** `server/workspace/leads/query-handler/lead-filter.query-handler.ts`,
  `server/workspace/leads/shared/lead-list-search-params.ts`, Toolbar-Dictionary
- **Skills:** `best-practices`, `frontend-design`
- **Inhalt:**
  - Der **bestehende** Zweig in `lead-filter.query-handler.ts:43-48`, der heute `archived`
    ausblendet, wird um `customer_id IS NOT NULL` erweitert — kein zweiter Zweig daneben
  - Neuer Umschalter „Konvertierte einblenden" als URL-Parameter; gesetzt, zeigt er alle
  - Hinweiszeile „N konvertierte Leads ausgeblendet" mit Direktlink auf den Umschalter
- **Akzeptanz:**
  - Bestehende Filter- und Sortierlogik unverändert; alle Lead-Query-Tests grün
  - Test: ein Lead mit gesetzter `customer_id` fehlt in der Standardliste und im Count
  - Test: mit gesetztem Umschalter erscheint er wieder
  - Test: die bestehende Ausblendung von `archived` funktioniert unverändert
  - Die Trefferzahl der Pagination passt zur gefilterten Menge

## Deploy-Sicherheit

1. **Live sichtbar:** neue Aktion im Lead-Detail, Umschalter und Hinweiszeile in der Lead-Liste.
2. **Bricht nichts:** Migration additiv (eine nullable Spalte, zwei Indizes, **keine**
   CHECK-Constraint angefasst). Die Änderung an der Lead-Liste ist eine Vorbelegung, kein Verlust —
   ohne konvertierte Leads ist sie unsichtbar, und der Umschalter erreicht weiterhin alles. Die
   `ON DELETE SET NULL`-Regel stellt sicher, dass das Löschen eines Kunden keinen Lead mitreißt.
3. **Offen:** nichts. Der Flow ist mit diesem Task vollständig.

## End-to-End-Akzeptanz

1. Ein gewonnener Lead lässt sich in einem Dialog zum Kunden machen; die Felder sind vorbefüllt.
2. Danach existiert ein Kunde mit Primärkontakt aus den Lead-Daten.
3. Der Lead verlinkt auf den Kunden; der Kunde verlinkt zurück auf den Lead. `lead_status` steht auf
   `won`, ein neuer Statuswert existiert nicht.
4. Beide Timelines enthalten je einen Eintrag zur Konvertierung.
5. Die Kunden-Timeline enthält zusätzlich die komplette Akquise-Historie des Leads.
6. Ein zweiter Versuch am selben Lead ist nicht möglich und erzeugt keinen Datenmüll.
7. Ein Lead lässt sich alternativ einem bestehenden Kunden zuordnen.
8. Ein firmenloser Lead wird ein Privatkunde, nicht ein Kunde mit Personenname als Firma.
9. Konvertierte Leads sind in der Lead-Liste standardmäßig ausgeblendet und über den Umschalter
   erreichbar.
10. Das Löschen des Kunden lässt den Lead bestehen (`customer_id` wird `NULL`).
11. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
