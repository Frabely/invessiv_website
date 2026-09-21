# Task 08 — Lead direkt als CRM-Kunden anlegen

> **Merge-Einheit:** Ordner 06 · **Branch:** `feat/crm-lead-konvertierung`

## Produktentscheidung

Das Lead-Detailpanel zeigt „Als CRM-Kunden anlegen“, wenn der Lead noch nicht konvertiert ist und
der Actor Lead- und CRM-Schreibrechte besitzt. Die Aktion öffnet den vorhandenen Kundendialog im
Lead-Bereich. Ein eigener Konvertierungsdialog, ein Modus für bestehende Kunden, Personensuche und
`customer_type` gehören ausdrücklich nicht zum Scope.

Vorbelegt werden Anzeigename, Firma, Kategorie, Website, Notizen, Vorname, Nachname, E-Mail,
Telefon, aktuelle Sprache und Status `active`. Alle Felder bleiben editierbar; fehlende
Pflichtangaben müssen vor dem Absenden ergänzt werden. Weitere Leadkontakte, Submissions und
Social-Profile werden nicht übernommen.

Nach Erfolg schließt die App den Dialog und zeigt die CRM-Übersicht ohne geöffnetes Kundenformular.
Lead und Kunde zeigen anschließend einen gegenseitigen Link.

## Persistenz und Idempotenz

Die Migration ergänzt `leads.customer_id` mit `ON DELETE SET NULL` und Index. Die Fremdschlüssel
`activities.customer_id` und `activities.lead_id` verwenden ebenfalls `ON DELETE SET NULL`, sodass
das Löschen eines Leads oder Kunden nie das jeweils andere Objekt entfernt. Beim Löschen eines
konvertierten Leads trennt der `leadService` dessen Kundenaktivitäten vom Lead; reine
Lead-Aktivitäten werden entfernt. Der vorhandene Activity-Subject-Check berücksichtigt außerdem
den bereits modellierten Projektbezug.

`POST /api/workspace/crm/leads/[leadId]/convert` prüft `customers.write` und `leads.write` und
führt eine Transaktion aus:

1. Lead mit `FOR UPDATE` sperren.
2. Bei bereits gesetzter `customer_id` denselben Kunden idempotent zurückgeben.
3. Kunde, Person und Primärkontakt mit den bestätigten Dialogwerten anlegen.
4. `leads.customer_id` setzen und den Lead automatisch auf `won` setzen.
5. Bisherige Lead-Aktivitäten zusätzlich mit `customer_id` verbinden.
6. Eine gemeinsame Aktivität `converted_from_lead` mit Lead- und Kundenbezug schreiben.

Jeder Fehler rollt alle Schritte zurück. Der Lead-Lock serialisiert parallele Requests, sodass nur
ein Kunde entsteht.

## Verträge und Listenverhalten

- Eigene Conversion-Request-/Result-DTOs und Fehlercodes.
- `LeadDetailDto.customerId`.
- `CustomerDetailDto.sourceLeads` für die Rückverlinkung.
- Lead-Filter `includeConverted` sowie `hiddenConvertedCount`.
- Standardliste filtert `customer_id IS NULL`; „Konvertierte einblenden“ hebt nur diesen Filter auf.

## Tests

- Mapping und Dialog: vollständige Vorbelegung, Pflichtfelder, Serverfehler, Fokus und Navigation.
- Route: Authentifizierung, beide Permissions, 400, 404, 409, 422, 500 und 201.
- DB-Integration: atomare Anlage, Rollback, History-Verknüpfung, Statuswechsel, Retry und parallele
  Requests.
- Filter: Standardausblendung, Einblendung, `hiddenConvertedCount`, Pagination und bestehende
  Archivlogik.
- Rückverlinkung: Lead → Kunde und Kunde → Ursprungs-Lead.
- Abschluss: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, CRM-Smokes und
  `pnpm --filter @invessiv/workspace build`.

Das authentifizierte Workspace-E2E-Gerüst wird separat nachgezogen und blockiert diesen Task nicht.
