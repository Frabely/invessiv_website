# Ordner 03c — Übergabe und Deaktivierung

> **Status:** offen · **Branch:** `feat/crm-uebergabe-und-deaktivierung` · **Abhängigkeit:** Ordner 03b gemerged
> **Aufwand:** 2 Tage · **Reviewziel:** 40–60 Dateien

## Ziel und Stand nach Merge

Mitglieder können deaktiviert und reaktiviert werden. Solange ein Mitglied offene Zuständigkeiten besitzt, ist die
Deaktivierung gesperrt; eine Übergabe — einzeln an ein aktives Mitglied oder „Alles an mich übergeben" — löst die Sperre
in einem Schritt. Entstanden durch den Neuschnitt von Ordner 03b am 13.09.2026.

Der detaillierte Task-Plan (Task 02d) wird zu Beginn der Einheit geschrieben.

## Umfang

- Exhaustive Ownership-Registry: `OwnableEntity` in `packages/common` plus
  `satisfies Record<OwnableEntity, OwnershipAdapter>` serverseitig. Erste Entität: `customer`. Eine neue besitzbare
  Entität in Ordner 07, 08 oder 11 bricht den Typecheck, bis sie registriert ist.
- Offene Kunden sind `active` und `paused`; archivierte Kunden behalten die historische Zuordnung.
- `PATCH /api/workspace/members/[id]` (aktiv, Version) und `POST …/members/[id]/handover` (`members.manage`).
- Übergabe als ein atomares `UPDATE … SET owner_member_id, version = version + 1` je Adapter, dazu je betroffener
  Entität eine Activity mit Alt- und Neuzuweisung.
- Security-Events `workspace_member_deactivated`, `workspace_member_activated`,
  `workspace_responsibilities_handed_over` (Migration erweitert die CHECK-Constraint).
- UI: Aktivieren/Deaktivieren und Übergabedialog in der Mitgliederliste aus 03b.

## Merge-Gate

- [ ] Deaktivierung wirkt beim nächsten Request.
- [ ] Letzter aktiver Owner kann nicht deaktiviert werden (409 mit Begründung); niemand deaktiviert sich selbst.
- [ ] Deaktivierung ist gesperrt, solange Zuständigkeiten bestehen; Konflikt nennt Anzahl je Entität.
- [ ] Übergabe ist atomar; parallele Übergabe und Bearbeitung ergibt 409 statt Teilzustand.
- [ ] Eine `OwnableEntity` ohne Adapter bricht den Typecheck (Typtest).
- [ ] Genau ein `security_events`-Eintrag je Änderung; Activities je übergebener Entität.
- [ ] DE/EN vollständig; A11y-Smoke für Deaktivierungs- und Übergabedialog.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes, Integrationstests und Workspace-Build grün.

## Rollback

App-Revert auf Ordner 03b. Deaktivierte Mitglieder bleiben deaktiviert und werden von der Auth weiter abgewiesen;
eine Reaktivierung ist dann nur per Datenbank möglich.
