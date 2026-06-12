# Plan: Lead-Status-Erweiterung und Profil-Filter im Workspace

## Context

Im Workspace-Leads-Bereich sollen die vorhandenen Lead-Statuswerte erweitert und die Filterung um Profilarten
ergänzt werden. Ziel ist eine konsistente Kette von der Konstante über DB-Checks, Labels und Formulare bis zu Import,
Bulk-Edit, Funnel-Auswertung und Tests.

Zusätzlich soll ein neuer Filter für Profilarten entstehen, der Mehrfachauswahl unterstützt und pro Chip zwischen
Include und Exclude umschalten kann. Der Filter arbeitet auf dem bestehenden Modell:

- `leads.website_url` für Website
- `lead_social_profiles.platform` für LinkedIn, Instagram und YouTube

Es wird keine neue Profiltabelle eingeführt.

## Geklärte Entscheidungen

| Thema                 | Entscheidung                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Neue Lead-Statuswerte | Vier zusätzliche Stati werden ergänzt: `connected`, `follow_up`, `not_reached`, `reminder`                                  |
| Status-Labels         | UI-Labels werden in DE/EN ergänzt; Dictionary- und Badge-Mappings müssen nachziehen                                         |
| DB-Constraint         | `leads_lead_status_check` wird um die neuen Werte erweitert                                                                 |
| Datenmigration        | Keine Datenmigration nötig, nur Constraint-Anpassung                                                                        |
| Profil-Filter         | Mehrfachauswahl mit Include/Exclude pro Chip                                                                                |
| Filter-Semantik       | Include ist eine ODER-Menge, Exclude ist eine Sperrmenge: `(mindestens ein Include getroffen) AND (kein Exclude getroffen)` |
| Serialisierung        | Mehrere Werte werden als kommagetrennte Listen in Query-Params gespeichert                                                  |
| Datenmodell Filter    | Website über `leads.website_url`, Socials über `lead_social_profiles.platform`                                              |
| Plattformumfang       | `xing` ist in der aktuellen Plattformliste nicht enthalten und daher nicht Teil dieses Schritts                             |

---

## Architektur-Überblick

Die Erweiterung betrifft mehrere Ebenen:

- **Konstanten:** neue Statuswerte im Common-Layer
- **DB:** Check-Constraint für `leads.lead_status`
- **Server:** Create/Update/Bulk-Edit/Import/Funnel-Logik
- **Client/UI:** Statusanzeige, Lead-Formular, Detailansicht, Toolbar-Filter
- **Filter-Logik:** Query-Params, Schema, URL-Builder und DB-Filter
- **Tests:** Konstante, Schema, Filter, UI und Server-Flows

Die Umsetzung soll in kleinen, reviewbaren Schritten erfolgen. Die bestehenden Lead-Patterns sollen wiederverwendet
werden, statt neue Sonderlösungen einzuführen.

---

## Umsetzungsschritte

### 1. Lead-Status-Konstanten und Labels

- `packages/common/src/constants/contact/contact-lead-statuses.ts`
  - vier neue Statuswerte ergänzen
  - `CONTACT_LEAD_STATUS_VALUES` und abhängige Tests aktualisieren
- Dictionary-Keys für Statuslabels in `de` und `en` ergänzen
- Label-Mappings in Badge, Form, Detailansicht und ggf. weiteren UI-Stellen nachziehen

### 2. DB-Constraint und Record-Configuration

- `packages/db/src/record-configuration/leads.ts`
  - `leads_lead_status_check` auf die neuen Werte erweitern
- passende SQL-Migration anlegen
  - nur Constraint anpassen
  - keine Datenmigration erforderlich

### 3. Workspace-CRUD und Bulk-Edit

- `create`, `update`, `bulk edit`, `lead form`, `lead detail` und `lead status badge` auf die neuen Stati prüfen
- bestehende `z.enum(CONTACT_LEAD_STATUS_VALUES)`-Stellen sollen die neuen Werte automatisch akzeptieren
- Label-Mappings, Anzeige-Text und Tests entsprechend aktualisieren

### 4. Import und Funnel-Auswertung

- Import-Validierung und Import-Command auf die neuen Stati prüfen
- Funnel-/Dashboard-Logik mitziehen:
  - `FUNNEL_STAGE_ORDER`
  - `FUNNEL_OUTCOME_ORDER`
  - Snapshot-Mapping
- falls die neuen Stati bewusst nicht ins Funnel-Modell gehören, diese Entscheidung explizit dokumentieren und
  testseitig absichern

### 5. Profil-Filter

- neue Query-Params für Include und Exclude ergänzen, z. B. `profile_include` und `profile_exclude`
- Mehrfachwerte als kommagetrennte Listen serialisieren
- `lead-list-search-params`, `lead-filter.schema` und `buildLeadFilter` erweitern
- Include/Exclude-Semantik im Server-Filter umsetzen
- Website über `leads.website_url` und Socials über `lead_social_profiles.platform` auswerten

### 6. Toolbar und Filter-UI

- neuer Filterblock in der Leads-Toolbar
- Chips für:
  - `website`
  - `linkedin`
  - `instagram`
  - `youtube`
- Chip-Zyklus:
  - inaktiv -> include -> exclude -> inaktiv
- Reset- und Active-State um die neuen Parameter ergänzen
- URL-Logik und UI-Tests um Mehrfachauswahl und Exclude-Zustand erweitern

---

## Test Plan

### Unit-Tests

- `CONTACT_LEAD_STATUS_VALUES`
  - Länge, Reihenfolge und Vollständigkeit
- DB-/Schema-Checks
  - neue Statuswerte zulässig
- `buildLeadFilter`
  - Include/Exclude-Profilfilter
- `lead-list-search-params`
  - neue Query-Params
- `buildLeadHref`
  - Serialisierung der Mehrfachwerte

### UI-Tests

- Leads-Toolbar
  - Mehrfachauswahl
  - erneutes Klicken setzt Exclude
  - Reset löscht alle Filterzustände
- Status-UI
  - neue Labels erscheinen in Badge, Form und Detailansicht

### Server-/Command-Tests

- `create-lead`
- `update-lead`
- `bulk-edit-leads`
- `lead-import-validation`
- `list-leads`
- `get-lead-by-id`

### Dashboard-/Funnel-Tests

- Snapshot- und Aggregations-Tests anpassen, falls neue Stati sichtbar sein sollen

### DB-Verifikation

- Migration anwenden
- sicherstellen, dass alte und neue Statuswerte durch den Check-Constraint erlaubt sind

---

## Annahmen

- Die neuen Stati werden als stabile snake_case-Enums in englischer Schreibweise geführt.
- UI-Labels bleiben deutschsprachig, die technischen Werte sind stabil und systemweit konsistent.
- `xing` wird in diesem Schritt nicht berücksichtigt.
- Include bedeutet ODER über die gewählten Profiltypen.
- Exclude bedeutet Ausschluss aller Treffer mit den gewählten Profiltypen.
- Der bestehende Lead-Datenbestand reicht für den Filter aus; zusätzliche Tabellen sind nicht notwendig.

---

## Nicht-Ziele

- Keine neue Profiltabelle
- Kein gesonderter Migrationsschritt zur Datenumstellung
- Keine Erweiterung über die vorhandene Profilliste hinaus
- Keine separate Funnel-Neuinterpretation ohne explizite Entscheidung

---

## Risiken

- Statuswerte können an mehreren Stellen hardcoded sein und dadurch inkonsistent bleiben.
- Funnel-Aggregationen können neue Stati unbeabsichtigt ignorieren oder falsch zuordnen.
- Die neue Filterlogik muss URL- und UI-seitig konsistent bleiben, sonst entstehen schwer nachvollziehbare Zustände.
- Mehrfachauswahl plus Include/Exclude ist fehleranfällig, wenn die Query-Param-Serialisierung nicht eindeutig definiert
  ist.
