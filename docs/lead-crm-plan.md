# Lead-Architektur für alle Kontaktwege und CRM-fähiges Dashboard

## Kurzfazit

Die aktuelle Lösung ist nicht Best Practice für das Ziel "alle Kontaktwege als Leads + spätere CRM-/Dashboard-Nutzung". Sie ist heute fachlich auf Projektanfragen zugeschnitten und koppelt den Lead-Datensatz zu stark an genau diesen einen Flow.

Für das Ziel ist die sauberste v1:

- eigene DB zuerst, kein externes CRM als Primärsystem
- ein schlanker `leads`-Kern für gemeinsame Identität + Lifecycle
- eine gemeinsame `lead_submissions`-Tabelle für jeden eingehenden Kontakt
- pro Kontaktweg eine Detailtabelle für formspezifische Daten
- später optional CRM-Sync nach außen, aber nicht als Kernlogik

Das ist näher an Best Practice als "eine große Leads-Tabelle mit allem drin". Der wichtigste zusätzliche Baustein ist nicht nur `leads + 3 Detailtabellen`, sondern eine Zwischenschicht `lead_submissions`, weil ein Lead mehrfach über unterschiedliche Wege kontaktieren kann.

## Kritische Bewertung des Ist-Zustands

Die aktuelle Tabelle in `src/server/db/migrations/0001_create_lead_tables.sql` ist für ein generisches Lead-System zu eng auf Projektanfragen gebaut.

Wesentliche Schwächen:

- `source_form`, `inquiry_type` und `message` sind im Kern-Lead verpflichtend. Das passt schlecht für unterschiedliche Kanäle.
- `mail_status`, `mail_provider`, `mail_error_code` liegen im Kern-Lead, obwohl das eher zu einer konkreten Submission gehört als zur Person/Lead-Identität.
- Es gibt nur `lead_project_requests`; E-Mail und Kennenlerncall haben keinen persistierten Detailpfad.
- Die Struktur unterstützt fachlich keinen sauberen Fall "ein Lead kontaktiert mehrfach über verschiedene Wege".
- `terms_version` ist im Kernmodell fragwürdig; rechtlich sauberer ist Compliance auf Submission-Ebene und nur für tatsächlich gezeigte/akzeptierte Texte.
- Die gewünschten CRM-Felder `Land`, `B2B/B2C`, `Firma ja/nein`, `USt-IdNr.` fehlen.
- Es fehlt eine saubere Aktivitäts-/Verlaufsebene für Dashboard/CRM-Nutzung.

## Zielmodell und Best-Practice-Entscheidungen

### 1. Kernmodell

Empfehlung: `leads` bleibt die Stamm-Tabelle für die Person bzw. den Kontaktstamm, aber nur mit gemeinsamen Feldern.

`leads` enthält:

- `id`
- `primary_email` oder `email`
- `full_name`
- `locale`
- `lead_status`
- `owner`
- `created_at`
- `updated_at`
- `first_submission_at`
- `last_submission_at`
- `first_contact_channel`
- `last_contact_channel`
- `country` nullable
- `customer_type` nullable (`b2b` | `b2c`)
- `has_company` nullable
- `company_name` nullable
- `vat_id` nullable
- optional `merged_into_lead_id` nur falls später Dedupe/Merge geplant ist

### 2. Submission-Modell

Best Practice: Jeder eingehende Kontakt wird als eigene Submission gespeichert, auch wenn dieselbe Person mehrfach schreibt oder bucht.

`lead_submissions` enthält:

- `id`
- `lead_id`
- `request_id`
- `channel` (`project_request` | `quick_contact` | `discovery_call`)
- `submitted_at`
- `submission_started_at` nullable
- `privacy_version`
- `terms_version` nullable
- `consent_accepted_at`
- `processing_status`
- `mail_status` nullable
- `mail_provider` nullable
- `mail_error_code` nullable
- `external_reference` nullable
- `created_at`
- `updated_at`

Damit wandern kanal- und zustellungsspezifische Zustände aus `leads` heraus an die richtige Stelle.

### 3. Detailtabellen pro Kontaktweg

Empfehlung: `quick_contact` und `discovery_call` sollen gesplittet werden.

Begründung:

- E-Mail hat eine pflichtige Nachricht und einen eigenen Kommunikationsstatus.
- Kennenlerncall hat optionales Anliegen, Calendly-Kontext und künftig potenziell Buchungs-/Meeting-IDs.
- Diese Flows sehen ähnlich aus, verhalten sich fachlich aber unterschiedlich.

Detailtabellen:

- `lead_project_requests`
  - `submission_id`
  - `offer_key`, `goal_key`, `workflow_key`
  - `website`
  - `page_keys`, `pages_custom`
  - `project_details`
  - `budget_key`, `preferred_start_key`
  - `phone`, `role`
  - optional `company_name_snapshot`
- `lead_quick_contacts`
  - `submission_id`
  - `message`
  - `delivery_mode` (`server_email`)
- `lead_discovery_calls`
  - `submission_id`
  - `concern` nullable
  - `calendly_url`
  - `calendly_prefill_payload` nullable/json
  - `booking_status` (`prefill_opened`, später ggf. `booked`, `canceled`)
  - `calendly_event_uri` nullable

## Kontaktweg-Verhalten in v1

### Projektanfrage

Bleibt API-basiert, schreibt künftig:

- `lead`
- `lead_submission`
- `lead_project_request`

### Kurze E-Mail

Entscheidung: von `mailto:` auf serverseitigen Submit + serverseitigen Mailversand umstellen.

Begründung:

- Nur so ist Lead-Erfassung und Zustellstatus verlässlich.
- Das Backend unterstützt den Quick-Contact-Handler bereits; der UI-Flow muss nur auf API-Submit umgestellt werden.

### Kennenlerncall

Beim Submit wird zuerst serverseitig gespeichert:

- `lead`
- `lead_submission`
- `lead_discovery_call`

Danach wird Calendly geöffnet bzw. das vorab geöffnete Fenster zur vorbefüllten URL navigiert. Damit bleibt der Popup-sichere Flow erhalten und die Lead-Erfassung passiert trotzdem vor dem externen Scheduling.

## Änderungen an Public APIs / Typen / Verträgen

Folgende Vertragsänderungen sind nötig:

- `CONTACT_REQUEST_KINDS` um `discovery_call` erweitern in `src/features/contact/contact-request-kind.ts`
- `contact.contract.ts` erweitern um:
  - `DiscoveryCallSubmitRequest`
  - aktualisierte Union `ContactSubmitRequest`
- `contact.schema.ts` erweitern um:
  - `discoveryCallSchema`
  - Anpassung `contactSubmitSchema`
- Quick-Contact-UI wechselt von lokalem `mailto:`-Flow zu API-Submit
- Project-Request-Persistenz wird von "Lead + ProjectRequest" auf "Lead + Submission + ProjectRequest" umgestellt
- neue Server-Handler/Mapper für Discovery-Call-Persistenz
- `contact-lead-metadata.ts` wird in generische Builder zerlegt:
  - `createOrResolveLead`
  - `createLeadSubmission`
  - `createProjectRequestDetail`
  - `createQuickContactDetail`
  - `createDiscoveryCallDetail`

## Dashboard-/CRM-Empfehlung

Für diesen Fall ist ein selbst gebautes Dashboard auf der eigenen Postgres-Struktur sinnvoller als sofort HubSpot/Pipedrive als führendes System zu machen.

Empfehlung:

- v1: eigenes Lead-/Submission-/Detailmodell + internes Dashboard
- v2: optional Sync-Adapter nach externem CRM
- nicht jetzt: das Datenmodell auf ein Fremd-CRM zurechtbiegen

Als Referenzsysteme für spätere Anbindung sinnvoll:

- Attio für flexible, relationale CRM-Strukturen und Custom Attributes
- HubSpot wenn später Marketing-Automation, Kontaktobjekte und Standard-CRM-Workflows wichtig werden
- Pipedrive wenn primär einfache Sales-Pipeline und schneller operativer Vertrieb im Fokus steht

Bewertung:

- Selbst bauen ist für das Vorhaben sinnvoll.
- Best Practice ist dabei: operatives Intake-System + CRM-fähiges Datenmodell, nicht sofort ein "vollständiges CRM" nachbauen.
- Was zusätzlich noch fehlen würde: mittelfristig eine `lead_activities`- oder `lead_events`-Tabelle für Verlauf, Statuswechsel, Notizen, Meeting-/Mail-Ereignisse.

## Tests und Akzeptanzkriterien

### Migration / Datenmodell

- Migration legt `leads`, `lead_submissions`, `lead_project_requests`, `lead_quick_contacts`, `lead_discovery_calls` sauber an bzw. migriert bestehende Struktur
- bestehende Projektanfragen bleiben lesbar/migrierbar
- Indizes auf `email`, `lead_status`, `channel`, `submitted_at`, `request_id`

### API / Server

- `project_request` erzeugt alle drei Datensätze
- `quick_contact` erzeugt Lead + Submission + Quick-Contact-Detail und versendet Mail serverseitig
- `discovery_call` erzeugt Lead + Submission + Call-Detail vor Weiterleitung zu Calendly
- Mailstatus wird nur auf Submission-Ebene geführt
- gleiche E-Mail kann mehrere Submissions unter einem Lead erzeugen

### UI / Verhalten

- in allen drei Kontaktwegen bleiben `Name` und `E-Mail` Pflicht
- Quick-Contact zeigt weiterhin Erfolgsmeldung, aber ohne `mailto`
- Discovery-Call bleibt popup-blocker-sicher
- Projektanfrage verhält sich für Nutzer unverändert, speichert aber im neuen Modell

### Dashboard-Basis

- Dashboard kann Leads listen
- Dashboard kann pro Lead alle Submissions sehen
- Dashboard kann Submission-Typ und Detaildaten getrennt anzeigen

## Annahmen und gesetzte Defaults

- V1 verwendet eigene DB als führendes System
- externe CRM-Tools sind spätere Integrationen, nicht Primärspeicher
- `Land`, `B2B/B2C`, `Firma ja/nein`, `USt-IdNr.` werden jetzt im Modell vorgesehen, aber noch nicht in allen Formularen abgefragt
- `quick_contact` und `discovery_call` werden getrennte Detailtabellen
- jede Kontaktaufnahme erzeugt eine Submission
- derselbe Lead kann mehrere Submissions haben
- `terms_version` wird künftig nullable und nur gespeichert, wenn der jeweilige Flow tatsächlich Terms referenziert
- E-Mail-Kontakt wird auf serverseitigen Mailversand umgestellt

## Externe Referenzen

- HubSpot Contacts: https://knowledge.hubspot.com/contacts/create-contacts
- Attio Attributes / flexible Datenmodelle: https://attio.com/help/reference/managing-your-data/attributes/
- Pipedrive Web Forms / Lead-Erfassung: https://support.pipedrive.com/nl/article/web-forms
- Calendly Contacts / Scheduling-Kontext: https://help.calendly.com/hc/en-us/articles/20058132533655-Contacts-overview
