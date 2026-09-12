# Task 07 — Status und Tags

> **Verbindliche Revision 2026:** Gehört zu Merge-Einheit 05.

## Verbindliche Revision

- Kundenstatus ausschließlich `active | paused | archived`.
- Pausiert nach 180 Tagen und archiviert nach 90 Tagen als manuelle Aufbewahrungsprüfung markieren;
  kundenindividuelle Frist überschreibt den Default.
- Keine automatische Löschung oder Statusänderung.
- Status-, Kategorie-, Tag- und Friständerung verwendet `version` und erzeugt eine Activity.
- Branch `feat/crm-kundenliste-und-zuweisung`.

> **Branch:** `feat/crm-status-tags`
> **Aufwand:** M (rund ein Tag)
> **Abhängigkeiten:** Task 05
> **Migration:** `0025_create_customer_tags.sql` (Planwert)

## Context

Status und Tags sind die beiden Ordnungsachsen der Kundenliste. Der Status ist eine feste, kleine
Menge (wo steht die Beziehung), Tags sind frei (womit arbeite ich hier: WordPress, Shopware, SEO,
Retainer, schwieriger Kunde).

Der Status existiert bereits seit Task 01 als Spalte; dieser Task macht ihn sichtbar und schnell
änderbar. Tags kommen neu dazu. Die Filterleiste, die beides nutzbar macht, folgt bewusst erst in
Task 30 — hier geht es darum, dass überhaupt gepflegte Daten entstehen.

## Entscheidungen

| Bereich                 | Entscheidung                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| Status                  | Feste Liste aus Task 01, Anzeige als Badge über die bestehende `lead-badge`-Basis                        |
| Statuswechsel           | Direkt in der Detailansicht über ein Auswahlfeld, kein Umweg über den Bearbeiten-Dialog                  |
| Statuswechsel-Protokoll | Jeder Wechsel schreibt eine `activities`-Zeile vom Typ `status_change` mit altem und neuem Wert          |
| Tags                    | Eigene Tabelle plus Join-Tabelle, global wiederverwendbar über alle Kunden                               |
| Tag-Normalisierung      | Eindeutig über `lower(btrim(label))`; die Schreibweise der Ersterfassung bleibt für die Anzeige erhalten |
| Tag-Farbe               | Wird aus dem Label deterministisch abgeleitet (Hash auf eine kleine Tonleiter), keine Farbauswahl im UI  |
| Verwaiste Tags          | Werden nicht automatisch gelöscht — sie bleiben als Vorschlag für die nächste Eingabe                    |

## Contract

```ts
// packages/common/src/contracts/crm/customer-tag.dto.ts
export interface CustomerTagDto {
  id: string;
  label: string; // Anzeige-Schreibweise
  slug: string; // lower(btrim(label)), eindeutig
}
```

## Tabellen

```txt
customer_tags
  id uuid PK
  label text NOT NULL
  slug  text NOT NULL
  created_at timestamptz NOT NULL DEFAULT now()
  UNIQUE INDEX customer_tags_slug_uidx ON (slug)

customer_tag_assignments
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  tag_id      uuid NOT NULL → customer_tags.id ON DELETE CASCADE
  created_at  timestamptz NOT NULL DEFAULT now()
  PRIMARY KEY (customer_id, tag_id)
  INDEX (tag_id)
```

## Verzeichnisstruktur

```txt
packages/db/migrations/0025_create_customer_tags.sql
packages/db/src/record-configuration/crm/{customer-tags,customer-tag-assignments}.ts
packages/common/src/contracts/crm/customer-tag.dto.ts
apps/workspace/src/common/constants/crm/badges/customer-status-badge-tones.ts

apps/workspace/src/app/api/workspace/crm/customers/[id]/status/route.ts
apps/workspace/src/app/api/workspace/crm/customers/[id]/tags/route.ts
apps/workspace/src/app/api/workspace/crm/tags/route.ts                 GET: Vorschlagsliste

apps/workspace/src/server/workspace/crm/
  command-handler/{update-customer-status,assign-customer-tag,remove-customer-tag}.command-handler.ts
  query-handler/list-customer-tags.query-handler.ts
  services/customer-tag-slug.ts

apps/workspace/src/components/workspace/crm/
  shared/customer-status-badge/
  shared/customer-tag-badge/
  detail/customer-status-control/
  detail/customer-tags-section/
  detail/customer-tag-input/          Eingabe mit Vorschlägen
```

## Tickets

### CRM-07-T1 — Migration und Modelle

- **Files:** `0025_create_customer_tags.sql`, zwei `pgTable`-Dateien, Barrel-Erweiterung
- **Skills:** `best-practices`
- **Inhalt:** Tabellen wie oben, rein additiv
- **Akzeptanz:** Migration idempotent; zwei Tags mit gleichem Slug in unterschiedlicher Schreibweise
  werden von der Datenbank abgelehnt

### CRM-07-T2 — Statusbadge und Statuswechsel

- **Files:** `shared/customer-status-badge/**`, `constants/crm/badges/customer-status-badge-tones.ts`,
  `detail/customer-status-control/**`, `command-handler/update-customer-status.command-handler.ts`,
  `api/workspace/crm/customers/[id]/status/route.ts` + Tests
- **Skills:** `frontend-design`, `accessibility`, `best-practices`
- **Inhalt:**
  - Ton-Zuordnung als `as const satisfies Record<CustomerStatus, BadgeTone>`, Farbe ausschließlich
    über `[data-tone]` in CSS (bestehendes Muster)
  - Auswahlfeld im Detail, das direkt speichert; währenddessen deaktiviert
  - Handler schreibt Activity mit `previous_status` und `next_status` im `metadata`
- **Akzeptanz:**
  - Badge in Liste und Detail identisch, in Dark und Light lesbar (Kontrast geprüft)
  - Genau ein Activity-Eintrag pro Wechsel, kein Eintrag wenn der Status gleich bleibt
  - Fehlgeschlagenes Speichern stellt den vorherigen Wert sichtbar wieder her

### CRM-07-T3 — Tags zuweisen und entfernen

- **Files:** `command-handler/{assign,remove}-customer-tag.command-handler.ts`,
  `query-handler/list-customer-tags.query-handler.ts`, `services/customer-tag-slug.ts`,
  die beiden Tag-Routen + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Zuweisen legt den Tag bei Bedarf an (`ON CONFLICT (slug) DO NOTHING`, dann lesen) und verknüpft
  - Doppelte Zuweisung ist folgenlos, kein Fehler
  - Vorschlagsliste: alle Tags nach Häufigkeit sortiert
- **Akzeptanz:** Tests für Neuanlage, Wiederverwendung, Doppelzuweisung, Entfernen; keine
  Race-Condition bei parallelem Anlegen desselben Labels

### CRM-07-T4 — Tag-Sektion und Eingabe

- **Files:** `shared/customer-tag-badge/**`, `detail/customer-tags-section/**`,
  `detail/customer-tag-input/**`, Dictionary-Ergänzungen, Tag-Spalte in der Liste
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Eingabe mit Vorschlägen aus vorhandenen Tags, Bestätigen mit Enter, Entfernen mit Rücktaste im
    leeren Feld und über ein X pro Badge
  - Vorschlagsliste als `role="listbox"` mit Pfeiltasten-Navigation
  - In der Liste maximal drei Tags plus Zähler
- **Akzeptanz:**
  - Vollständig per Tastatur bedienbar, aktiver Vorschlag über `aria-activedescendant`
  - Screenreader kündigt Hinzufügen und Entfernen über eine Live-Region an
  - Tag mit sehr langem Label bricht das Layout nicht

## Deploy-Sicherheit

1. **Live sichtbar:** Statusbadge in Liste und Detail, Statuswechsel im Detail, neue Tag-Sektion,
   Tag-Spalte in der Liste.
2. **Bricht nichts:** Migration additiv (zwei neue Tabellen). Die Statusspalte existiert seit Task 01
   und war bereits befüllt — sie wird hier nur sichtbar gemacht. Bestehende Kunden haben keine Tags,
   was ein gültiger Zustand ist.
3. **Offen:** Filtern nach Status und Tags (Task 30). Bis dahin sind beide Achsen sicht- und
   pflegbar, aber nicht als Filter nutzbar — es gibt kein Bedienelement, das ins Leere führt.

## End-to-End-Akzeptanz

1. Der Status eines Kunden lässt sich im Detail in einem Schritt ändern.
2. Jeder Wechsel erscheint später in der Timeline (Task 29) mit altem und neuem Wert.
3. Ein neues Tag lässt sich durch Tippen anlegen, ein bestehendes über Vorschläge wählen.
4. Dasselbe Tag in anderer Schreibweise erzeugt keinen zweiten Eintrag.
5. Tags erscheinen in der Kundenliste, lange Listen werden gekürzt dargestellt.
6. Alle Texte in DE und EN; Badges in beiden Themes kontrastsicher.
7. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
