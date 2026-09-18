# Ordner 07b — Zugriffsbereiche: Filter für Kunden und Projekte

> **Status:** offen · **Branch:** `feat/crm-zugriffsfilter-kunden-und-projekte` · **Abhängigkeit:** Ordner 07a gemerged
> **Aufwand:** 3–4 Tage · **Reviewziel:** 60–100 Dateien · **Folgeeinheit:** 07c (Verwaltungs-UI)

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`../07-projekte/37-zugriffsfilter-kunden-und-projekte.md`](../07-projekte/37-zugriffsfilter-kunden-und-projekte.md) —
  alle Pfade aus 04–07 und
  03c über `accessScope`/`canOn`, Bereichs-Gate, Zuständigkeitsprüfung, exhaustive Endpunkt-Registry.

Jeder bestehende CRM-Lese- und Schreibpfad respektiert gebundene Rechte. Ein Mitglied mit Rolle auf Kunde 1 sieht
Kunde 2 nicht — in Liste, Zählung, Suche, Facetten, Akte, Projekten, Activities und Owner-Auswahl nicht. Für Mitglieder
mit ausschließlich workspace-weiten Rollen ändert sich nichts. Weil gebundene Zuweisungen erst mit der UI aus 07c
entstehen, bleibt die Einheit für den Alltag unsichtbar; nachgewiesen wird sie über Seeds und Integrationstests.

## Umfang

- Kunden (Ordner 04/05): Übersicht, Liste, Count, Suche, Facetten, Akte, Stammdaten, Ansprechpartner, Activities,
  Status/Tags, Archivieren, Owner-Wechsel samt Vorschau.
- Personen: freie Suche nur über Personen sichtbarer Kunden; exakte E-Mail-Dublettenprüfung bleibt global.
- Lead-Konvertierung (06): neuer Kunde nur mit `customers.write` workspace-weit; Zielauswahl „bestehender Kunde“ nur
  aus Kunden mit `customers.write`.
- Projekte (07): Liste, Karten, Detail, Anlage, Bearbeitung, Status, Phase, Owner, Facette „Projektphase“.
- Bereich „Kunden“ in Sidebar und Page-Gate über `canAnywhere(customers.read)` oder vorhandene Grundsichtbarkeit.
- Ownership-Registry (03c): jeder Adapter deklariert `requiredPermission`; Zuweisung, Owner-Wechsel und Übergabe
  prüfen, dass der neue Zuständige dort Zugriff hat.
- `CRM_ENDPOINT_ACCESS_RULES` als exhaustive Registry aller CRM-Endpunkte mit parametrisiertem Negativtest.
- AGENTS.md am Zielcode (`src/server/workspace/crm/`, `src/server/workspace/shared/`) um die Filterpflicht ergänzt.

## Merge-Gate

- [ ] Ein neuer CRM-Endpunkt ohne Eintrag in `CRM_ENDPOINT_ACCESS_RULES` bricht den Typecheck.
- [ ] Parametrisierter Negativtest: fremder Kunde und fremdes Projekt ergeben auf **jedem** CRM-Endpunkt 404.
- [ ] Liste und Count verwenden identische Scope-Bedingung (Test mit gebundenem Mitglied).
- [ ] Projektbindung zeigt nur Kunden- und Projektkopf; Ansprechpartner, kundenweite Activities und Stammdaten
      ergeben 404 bzw. werden nicht gerendert.
- [ ] Kundenbindung vererbt auf alle Projekte dieses Kunden, auch auf später angelegte.
- [ ] Owner-Wechsel und Übergabe an ein Mitglied ohne Zugriff ergeben 422 mit Zählung je Entität; „Alles an mich
      übergeben“ durch den Owner funktioniert immer.
- [ ] Mitglieder ohne gebundene Zuweisungen: sämtliche Bestandstests aus 04–07 und 03c unverändert grün.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes, Integrationstests und Workspace-Build grün.

## Rollback

App-Revert auf Ordner 07a. Gebundene Zuweisungen bleiben gespeichert und wieder wirkungslos; Mitglieder mit
ausschließlich gebundenen Rollen sehen dann keinen CRM-Bereich (fail-closed). Kein Schema betroffen.
