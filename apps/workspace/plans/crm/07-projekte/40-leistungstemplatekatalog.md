# Task 40 — Pflegbarer Leistungstemplatekatalog

> **Merge-Einheit:** Ordner 07 · **Branch:** `feat/crm-projekte`  
> **Aufwand:** M · **Abhängigkeiten:** Task 09, Task 07c  
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

## Ziel

Globale `line_item_templates` sind workspace-weite CRM-Stammdaten und ausschließlich ein
Ausgangspunkt für spätere Projektleistungen. Ein Template enthält Titel, Leistungsbeschreibung,
Preis in EUR-Cent, Preisart, optionales Intervall, Aktiv-/Archivstatus und `version`. Änderungen
am Katalog verändern niemals bereits gespeicherte Projektleistungen.

Starttemplates: Landingpage, Unterseite, zusätzliche Section, Wartung, SEO, Wartung + SEO sowie
Stundensatz. Kombipakete bleiben eigene Templates, keine Rabattregel.

## Datenmodell

```txt
line_item_templates
  id uuid PK
  title text NOT NULL CHECK (btrim(title) <> '')
  description text NOT NULL DEFAULT ''
  price_cents integer NOT NULL CHECK (price_cents >= 0)
  pricing_mode text NOT NULL CHECK in SERVICE_PRICING_MODE_VALUES
  recurring_interval text NULL CHECK in BILLING_INTERVAL_VALUES
  status text NOT NULL DEFAULT 'active' CHECK in LINE_ITEM_TEMPLATE_STATUS_VALUES
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
  created_at / updated_at timestamptz NOT NULL DEFAULT now()

  CHECK ((pricing_mode = 'recurring') = (recurring_interval IS NOT NULL))
```

`ServicePricingMode` ist ein Const-Objekt mit `one_time`, `recurring` und `rate`; ein Intervall ist
nur für `recurring` gültig. `LineItemTemplateStatus` enthält `active` und `archived`. Das kanonische
Drizzle-Modell liegt als einzelne Tabelle unter `packages/db/src/record-configuration/crm/`.

Die Migration seedet die Starttemplates idempotent und erweitert `db:seed:crm` um realistische
Stammdaten. Eine Archivierung löscht keine Zeile und lässt optionale Herkunftsreferenzen bestehen.

## Rechte und Oberfläche

- `line_item_templates.read` erlaubt die Katalogansicht; `line_item_templates.write` erlaubt Anlegen, Bearbeiten und
  Archivieren. Beide Rechte sind workspace-weit und nicht bindbar.
- Die CRM-Unterseite ist von Mitglieder- und Rolleneinstellungen getrennt, noindex und
  force-dynamic. Sie erhält vollständige Listen-, Leer-, Fehler- und Archivzustände in DE und EN.
- Ohne `line_item_templates.write` gibt es keine Schreibaktionen. Archivierte Templates sind sichtbar
  gekennzeichnet, aber nicht in Auswahl-Listen für neue Projektleistungen verfügbar.
- Mutationen laufen über Client → API-Route → Command-Handler, verwenden `updateVersioned` und
  liefern Versionskonflikte nachvollziehbar zurück.

## Akzeptanz

- [ ] Migration, Drizzle-Modell und Constraints sind deckungsgleich und idempotent.
- [ ] Fehlender Titel, negative Preise und ungültige Preisart-/Intervall-Kombinationen werden in DB
      und Handler abgewiesen.
- [ ] CRUD, Archivierung, Rechte und Versionskonflikte sind getestet.
- [ ] Liste, Dialoge sowie Leer- und Fehlerzustände sind in DE und EN vorhanden.
- [ ] Eine Änderung oder Archivierung eines Templates verändert keine vorhandene Projektleistung.
