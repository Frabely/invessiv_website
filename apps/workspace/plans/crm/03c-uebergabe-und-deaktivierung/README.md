# Ordner 03c — Aktivierung und Deaktivierung

> **Status:** gemerged · **Branch:** `feat/crm-uebergabe-und-deaktivierung` · **Abhängigkeit:** Ordner 03b gemerged
> **Aufwand:** 1–2 Tage · **Reviewziel:** 30–50 Dateien

## Ziel und Stand nach Merge

Mitglieder können deaktiviert und reaktiviert werden. Selbstdeaktivierung, die Deaktivierung des letzten aktiven
Owners und verwaiste offene Zuständigkeiten sind ausgeschlossen. Die eigentliche Übergabe folgt erst nach dem
vollständigen CRM-Modell in Ordner 22a, damit alle Zuständigkeiten gemeinsam überprüfbar sind.

**Konkreter Task-Plan**

- [`02d-uebergabe-und-deaktivierung.md`](./02d-uebergabe-und-deaktivierung.md) — Contracts, exhaustive
  Zuständigkeitsprüfung, Aktivierung/Deaktivierung, API, Settings-UI und Tests.

## Umfang

- Exhaustive Counter-Registry: `OwnableEntity` in `packages/common` plus
  `satisfies Record<OwnableEntity, ResponsibilityCounter>` serverseitig. Erste Entität: `customer`.
- Offene Kunden sind `active` und `paused`; archivierte Kunden behalten die historische Zuordnung.
- `PATCH /api/workspace/members/[id]` mit Aktivzustand und Version, geschützt durch `members.manage`.
- Security-Events `workspace_member_deactivated` und `workspace_member_activated`.
- UI: Status, Aktivieren/Deaktivieren und verständliche Zuständigkeitssperre in der Mitgliederliste aus 03b.
- **Owner-Invariante aus 03b gilt weiter:** Über UI und API ist kein Zustand ohne aktiven Owner erreichbar. Die
  Deaktivierung nutzt denselben Owner-Lock wie der Owner-Entzug.

## Bewusster Folgeschnitt

Die einzelne Kundenzuweisung folgt in [Ordner 20a](../20a-kundenzustaendigkeit/README.md), die vollständige Übergabe in
[Ordner 22a](../22a-kundenorganisation-und-uebergabe/README.md). 03c bleibt trotzdem sicher: Solange offene
Zuständigkeiten existieren, ist die Deaktivierung blockiert. Es gibt keinen Übergabe-Button, bevor alle zugehörigen
Domänen implementiert und gemeinsam testbar sind.

Die Zuständigkeitszählung läuft noch ohne Sperre gegen parallele Zuweisungen. Das ist heute folgenlos, weil noch kein
Schreibpfad Kunden zuweist; Stelle, Risiko und nächster Schritt stehen im Task-Plan unter „Bekannte Grenze:
Zuständigkeitszählung ohne Sperre“.

## Merge-Gate

- [x] Deaktivierung wirkt beim nächsten Request; Reaktivierung stellt den Zugang wieder her.
- [x] Letzter aktiver Owner kann nicht deaktiviert werden; niemand deaktiviert sich selbst.
- [x] Parallele Deaktivierung und Owner-Entzug hinterlassen nie null aktive Owner.
- [x] Deaktivierung ist gesperrt, solange offene Zuständigkeiten bestehen; der Konflikt nennt die Anzahl je Entität.
- [x] Eine `OwnableEntity` ohne Counter bricht den Typecheck.
- [x] Genau ein `security_events`-Eintrag je erfolgreicher Aktivierung oder Deaktivierung.
- [x] DE/EN vollständig; A11y-Smoke für den Lifecycle-Dialog.
- [x] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes, Integrationstests und Workspace-Build grün.

## Rollback

App-Revert auf Ordner 03b. Deaktivierte Mitglieder bleiben deaktiviert und werden von der Auth weiter abgewiesen;
eine Reaktivierung ist dann nur kontrolliert per Datenbank möglich.
