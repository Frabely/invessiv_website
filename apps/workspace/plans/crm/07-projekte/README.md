# Ordner 07 — Projekte

> **Status:** läuft · **Abhängigkeiten:** 04, 05, 06, 07c · **Aufwand:** 7–10 Tage · **Reviewziel:** 50–100 Dateien je
> Merge-Einheit

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`09-projekte-datenmodell.md`](./09-projekte-datenmodell.md) — Migration, Workflow,
  Lebenszyklus und Abrechnungsart.
- [`10-projekte-ui.md`](./10-projekte-ui.md) — Commands, Routes, Liste, Detail und Dialoge.
- [`40-leistungstemplatekatalog.md`](./40-leistungstemplatekatalog.md) — pflegbarer,
  versionierter Templatekatalog als CRM-Stammdaten.
- [`41-projektleistungszuweisung-und-rechte.md`](./41-projektleistungszuweisung-und-rechte.md) —
  Rechte und Snapshot-Zuweisung an Projekte.
- [`42-projektwerte-in-akte-und-listen.md`](./42-projektwerte-in-akte-und-listen.md) —
  ausschließlich aus Projektleistungen berechnete Werte.
- [`42a-cockpit-projektwerte.md`](./42a-cockpit-projektwerte.md) — Erweiterung der bestehenden
  Cockpit-Ansicht, keine zweite Kundendarstellung.

Task 09 bleibt ein reines Projekt-Datenmodell. Task 10 liefert danach die Projekt-UI mit sichtbar
gekennzeichneten, nicht interaktiven „Coming soon“-Bereichen für Leistungen, Aufgaben und Chat.
Nach dem Zugriffsbereichsfundament folgen Templatekatalog, Projektleistungszuweisung und Werte.
Interne Nutzer können mehrere Projekte je Kunde vollständig anlegen, bearbeiten, pausieren,
abschließen, abbrechen und archivieren. Projektstatus, Workflow-Phase und Owner sind getrennt und
im Kundendetail sowie in einer Projektübersicht nutzbar. Portalanteile bleiben noch unsichtbar.

## Daten und Verhalten

- Additive Projektmigration, kanonisches Drizzle-Modell und gemeinsame Status-/Workflow-Contracts
  entstehen in diesem Ordner.
- Pflicht: Kunde, Titel, Status, Phase, `workflow_key`, Owner, Abrechnungsart und `version`.
- Optional: Beschreibung, nächster Schritt, Termin, Preview-URL, Budget-Cents und Stundensatz-Cents.
- Abrechnungsart validiert relevante Betragsfelder; Währung ist implizit EUR.
- Owner übernimmt initial den bei der Kundenanlage vorhandenen technischen Kunden-Owner, kann danach durch jedes aktive
  Mitglied geändert werden.
- Ein späterer Kunden-Owner-Wechsel in Ordner 20a überschreibt den Projekt-Owner nicht. Die explizite globale Übergabe
  aus Ordner
  22a übernimmt offene Projekte nur bei einer vollständigen Mitgliedsübergabe.
- Feste Phasenfolge aus `standard_web_v1`; unbekannter Workflow oder Phase wird abgelehnt.
- Kein Soft-Delete/Purge in der UI. Archiv ist der reversible Endzustand.
- `version` verhindert stilles Überschreiben.
- Leistungen gehören ausschließlich zu Projekten. Jede Projektleistung ist ein vollständiger,
  individuell editierbarer Snapshot ihres optionalen Quelltemplates; Änderungen am Template wirken
  nie rückwirkend.
- Der globale Katalog enthält Templates, keine kundenweiten Leistungspositionen. Archivierte Templates bleiben als
  Herkunftsnachweis erhalten, sind aber nicht neu auswählbar.

## UI und Contracts

- Projektkarten und Projektliste zeigen Status, Phase, Owner, nächsten Schritt und Termin.
- Task 10 zeigt zusätzlich die drei künftigen Bereiche „Leistungen“, „Aufgaben“ und „Chat“ als
  klar beschriftete, nicht interaktive Coming-soon-Slots; es gibt keinen CTA und keine leere Route.
- Create/Edit-Dialog blendet Budget oder Stundensatz passend zur Abrechnungsart ein.
- Phasenwechsel ist eine eigene protokollierte Mutation.
- PortalDTO enthält bereits nur grundsätzlich freigabefähige Felder, wird aber noch nicht geroutet.

## Merge-Gate

- [ ] Die Kundenlisten-Query kann die Projektphase effizient als Grundlage für die spätere Facette in Ordner 22a
      liefern; eine vorgezogene Filter-UI entsteht nicht.
- [ ] `Projects` ist in `OwnableEntity` registriert und hat einen Adapter in der Ownership-Registry (Ordner 03c);
      Übergabe und Deaktivierungszählung erfassen die Entität, mit Test.
- [ ] Projekt kann nur zu existierendem, nicht archiviertem Kunden angelegt werden.
- [ ] Status und Phase können unabhängig wechseln.
- [ ] Ungültige Beträge und Workflowkombinationen werden DB- und API-seitig abgelehnt.
- [ ] Interne Finanzwerte fehlen vollständig in PortalDTOs.
- [ ] Projektlisten haben deterministische Pagination, Empty- und Fehlerzustände.
- [ ] Kein Portal-Link ist sichtbar.
- [ ] Globale `services.read`/`services.write` sind workspace-weit; bindbare
      `project_services.read`/`project_services.write` vererben vom Kunden auf dessen Projekte,
      aber nie in umgekehrter Richtung oder auf fremde Projekte.
- [ ] Projektwerte verwenden ausschließlich Projektleistungen; kundenweite Pakete und
      `customer_packages` entstehen nicht.

## Rollback

Projektsektionen per Flag ausblenden; additive Daten und Kundenverwaltung bleiben verwendbar.
