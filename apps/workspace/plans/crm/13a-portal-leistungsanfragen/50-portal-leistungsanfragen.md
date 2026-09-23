# Task 50 — Leistungsanfragen im Portal

> **Merge-Einheit:** Ordner 13a · **Branch:** `feat/crm-portal-leistungsanfragen`
> **Aufwand:** M–L · **Abhängigkeiten:** Task 40 (Leistungskatalog), Task 41 (Projektleistungen),
> Task 49 (Portal-Fundament), Task 20 (Portal-Zugang), Task 21 (Portal-Dashboard)
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)
> **Status des Plans:** Skizze — vor Beginn mit dem Nutzer verfeinern (Statusmodell, Übernahme in Projekt)

## Context

Kunden sollen aus dem Portal heraus weitere Leistungen anfragen können. Der Plan legt fest, dass Preise nie das
Portal erreichen (00-entscheidungen, „Portal und Kommunikation“) und Angebote in Lexware bleiben. Die Anfrage ist
deshalb eine **unverbindliche, preisfreie Anfrage** aus einem bewusst freigegebenen Katalogausschnitt; intern wird
dokumentiert, was daraus wurde.

## Entscheidungen

| Bereich          | Entscheidung                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Katalog          | `line_item_templates.portal_requestable boolean NOT NULL DEFAULT false`, `portal_description text NULL`       |
| Preise           | Das Portal-DTO enthält nur Id, Titel und `portal_description` (Fallback `description`); nie Preisfelder       |
| Anfrage          | `service_requests`: `customer_id`, `line_item_template_id`, `requested_by_membership_id`, `note`, `status`    |
| Status           | `requested`, `offered`, `accepted`, `declined`; intern gepflegt, im Portal in Kundensprache angezeigt         |
| Übernahme        | Aus einer angenommenen Anfrage kann intern eine Projektleistung (Task 41) vorbelegt werden; kein Automatismus |
| Rechte Portal    | `portal.services.read` (Katalog und eigene Anfragen), `portal.services.request` (anfragen)                    |
| Rechte intern    | `service_requests.read`, `service_requests.write` — scopable, an den Kunden bindbar                           |
| Sichtbarkeit     | Alle Portalkontakte mit `portal.services.read` sehen die Anfragen ihrer Firma                                 |
| Benachrichtigung | Bis Ordner 20c nur über Kundenakte und Dashboard-Block; 20c ergänzt die interne Glocke                        |

## Tabellen (Skizze)

```txt
service_requests
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  line_item_template_id uuid NOT NULL → line_item_templates.id ON DELETE RESTRICT
  requested_by_membership_id uuid NOT NULL → portal_memberships.id ON DELETE RESTRICT
  note text NULL                       Länge begrenzt, als Klartext gerendert
  status text NOT NULL                 requested | offered | accepted | declined
  idempotency_key uuid NOT NULL UNIQUE
  version integer NOT NULL DEFAULT 1
  created_at / updated_at
  Composite-FK (requested_by_membership_id, customer_id) → portal_memberships (id, customer_id)
```

## Tickets (grob)

- **CRM-50-T1** — Migration, Modelle, Permissions, `portal_standard` ergänzen, Seed.
- **CRM-50-T2** — Portal: Katalog-Query über `portalAccessCondition`, Anfrage-Command über `withPortalActor`,
  Seite `services`, Navigationseintrag, Vorschau-Erweiterung (Task 20).
- **CRM-50-T3** — Intern: Katalog-Freigabe im Templatedialog, Anfrageliste in der Kundenakte, Statuspflege,
  Übernahme als Projektleistung, Hinweis im Dashboard-Block.

## Offene Fragen vor Beginn

- Reicht das Statusmodell, oder braucht es einen Freitext „Angebot versendet am“?
- Darf der Kunde eine Anfrage zurückziehen?
- Soll eine Anfrage an ein bestimmtes Projekt gebunden werden können?
