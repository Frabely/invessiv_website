# Task 11b — Aufgaben in Deaktivierung und Übergabe

> **Merge-Einheit:** Ordner 08 · **Branch:** `feat/crm-aufgaben`
> **Aufwand:** S · **Abhängigkeiten:** Task 11-2
> **Migration:** keine

## Ziel

Wer ein Mitglied deaktiviert, sieht auch dessen offene Aufgaben. Ohne diesen Task würde eine Aufgabe still an einem
inaktiven Bearbeiter hängen bleiben.

## Umfang

- `OwnableEntity.Task` in `packages/common/src/constants/crm/ownable-entities.ts` (+ `OWNABLE_ENTITY_VALUES`).
- Zähler `task-responsibility-counter.ts` unter
  `apps/workspace/src/server/workspace/access/services/responsibilities/`: offene Aufgaben (`open`, `in_progress`) mit
  `assignee_member_id = memberId`; nutzt den Teilindex aus Task 11-1.
- Eintrag in `responsibility-counter-registry.ts` (die `satisfies Record<OwnableEntity, …>`-Prüfung erzwingt ihn) und
  in `OwnershipResponsibilityCountsDto`.
- `requiredPermission` für den Adapter: `tasks.write`.
- Texte für den Deaktivierungsdialog DE/EN („3 offene Aufgaben“).

Die gesammelte Übergabe aller Entitäten bleibt bei Task 02f (Ordner 22a); dieser Task liefert nur Zählung und
Registrierung.

## Akzeptanz

1. Registry-Test: jede `OwnableEntity` hat einen Zähler; der Aufgaben-Zähler zählt nur offene Aufgaben dieses Mitglieds.
2. Deaktivierungsdialog nennt die Zahl offener Aufgaben; Test für 0 und > 0.
3. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, Workspace-Build grün.
