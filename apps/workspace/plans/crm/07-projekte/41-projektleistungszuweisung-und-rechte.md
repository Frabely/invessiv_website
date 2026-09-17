# Task 41 — Projektleistungszuweisung und Rechte

> **Merge-Einheit:** Ordner 07 · **Branch:** `feat/crm-projekte`  
> **Aufwand:** M · **Abhängigkeiten:** Task 40, Task 07a–07c  
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

## Ziel

Eine Projektleistung gehört zwingend zu genau einem Projekt; ihr Kunde wird ausschließlich über
dieses Projekt abgeleitet. Es gibt keine kundenweiten Leistungspositionen und keine Tabelle
`customer_packages`. Im ersten Ausbau wird ausschließlich aus aktiven Templates ausgewählt;
das spätere Kopieren einer Leistung desselben Kunden ist ein separater Flow.

## Datenmodell

```txt
project_services
  id uuid PK
  project_id uuid NOT NULL → projects.id ON DELETE CASCADE
  source_service_template_id uuid NULL → service_templates.id ON DELETE SET NULL
  title text NOT NULL CHECK (btrim(title) <> '')
  description text NOT NULL DEFAULT ''
  price_cents integer NOT NULL CHECK (price_cents >= 0)
  pricing_mode text NOT NULL CHECK in SERVICE_PRICING_MODE_VALUES
  recurring_interval text NULL CHECK in BILLING_INTERVAL_VALUES
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
  created_at / updated_at timestamptz NOT NULL DEFAULT now()

  CHECK ((pricing_mode = 'recurring') = (recurring_interval IS NOT NULL))
  INDEX (project_id, created_at desc)
```

Titel, Beschreibung, Preis, Preisart und Intervall sind ein vollständiger Snapshot. Die optionale
Template-ID ist ausschließlich Herkunftsnachweis. Jede Preisänderung ist ein versionierter Write
an der Projektleistung; es gibt weder automatische Synchronisation noch rückwirkende Änderungen an
anderen Projekten.

## Zugriffsbereiche und UI

- `project_services.read` und `project_services.write` sind bindbar (`scopable = true`). Eine
  Kundenbindung vererbt auf alle Projekte dieses Kunden; eine Projektbindung erlaubt nur dieses
  Projekt und niemals weitere Kunden- oder Projektdaten.
- Querys filtern über `accessScope`; jeder Schreibpfad prüft `canOn`. Fremdzugriff ist 404,
  fehlendes Schreibrecht 403.
- Die Projektkarte zeigt Leistungen nur bei Leserecht und erlaubt die Zuweisung nur bei
  Schreibrecht. Beim Zuweisen wird ein aktives Template gewählt, dessen Snapshot vor dem Speichern
  individuell angepasst werden kann.
- Die Templateauswahl enthält weder archivierte Templates noch freie, manuell erfundene Positionen.

## Akzeptanz

- [ ] Ein Snapshot-Test beweist, dass eine spätere Templateänderung die gespeicherte
      Projektleistung nicht verändert.
- [ ] Kunde-gebundenes Recht gilt für alle zugehörigen Projekte; Projektbindung nicht für andere
      Projekte. Beide Negativfälle sind integriert getestet.
- [ ] Template-Auswahl, individuelle Anpassung, Validierungs- und Versionskonfliktzustände sind in
      DE und EN vorhanden.
- [ ] Jede Position ist genau einem Projekt zugeordnet; ein kundenweiter Schreibweg existiert nicht.
