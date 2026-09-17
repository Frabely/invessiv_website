# Ordner 07 — Projekte

> **Status:** offen · **Abhängigkeiten:** 04, 05, 06 · **Aufwand:** 3–4 Tage · **Reviewziel:** 60–100 Dateien

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`09-projekte-datenmodell.md`](./09-projekte-datenmodell.md) — Migration, Workflow,
  Lebenszyklus und Abrechnungsart.
- [`10-projekte-ui.md`](./10-projekte-ui.md) — Commands, Routes, Liste, Detail und Dialoge.

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

## UI und Contracts

- Projektkarten und Projektliste zeigen Status, Phase, Owner, nächsten Schritt und Termin.
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

## Rollback

Projektsektionen per Flag ausblenden; additive Daten und Kundenverwaltung bleiben verwendbar.
