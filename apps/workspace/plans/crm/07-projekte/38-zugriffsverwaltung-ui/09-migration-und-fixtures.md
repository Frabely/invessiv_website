# 09 — Cleanup-Migration, Smokes und Seeds

> **Ordner:** 07c · **Aufwand:** M · **Hängt ab von:** — · **Migration:** eine, Nummer `0033`

## Warum

Migration `0032` hat die vier Merkmalspalten **nullable** angelegt und im selben Lauf befüllt. Solange sie
nullable sind, bedeutet `NULL` faktisch „nicht bindbar" — ein stiller Zustand, den niemand sieht. Die
Ordner 07a und 07b schreiben die Spalten vollständig; damit ist das Verengen jetzt sicher und gehört in
dieses Release (`packages/db/AGENTS.md`: Expand → Backfill → Cleanup in getrennten Releases).

Zusätzlich fehlt die Absicherung des gesamten Scope-Pfades: weder Smokes noch Fixtures kennen gebundene
Rollen. Ohne sie lässt sich das Merge-Gate nicht belegen.

## Migration

**Nummer vor dem Schreiben im Repository ermitteln.** Höchste vorhandene Migration ist heute
`0032_add_workspace_member_scoped_roles.sql`; die neue wäre damit `0033`. Nie aus diesem Dokument übernehmen.

Betroffene Spalten — alle heißen `scope_assignable`, nicht `scopable`:

| Tabelle            | Spalten                                                |
| ------------------ | ------------------------------------------------------ |
| `permissions`      | `scope_assignable`                                     |
| `roles`            | `scope_assignable`                                     |
| `role_permissions` | `role_scope_assignable`, `permission_scope_assignable` |

Ablauf:

1. **Preflight** zählt `NULL`-Zeilen je Spalte und bricht mit einer eindeutigen englischen Meldung ab, die
   Tabelle, Spalte und Anzahl nennt.
2. `SET NOT NULL` je Spalte, `--> statement-breakpoint` zwischen den Statements.
3. Drizzle-Modelle `permissions.ts`, `roles.ts`, `role-permissions.ts` auf `.notNull()` — Migration und
   Modell müssen deckungsgleich sein, das ist ein ausdrücklicher Review-Punkt.

Ein zweiter Lauf ist folgenlos.

## Smokes

`packages/db/scripts/smoke-rbac.ts` erweitern. Heute kommt „scoped" dort nicht vor.

- Eine bindbare Rolle mit einer nicht bindbaren Permission wird abgewiesen.
- Eine gebundene Zuweisung einer nicht bindbaren Rolle wird abgewiesen.
- Eine Projektbindung, deren Projekt einem anderen Kunden gehört, wird abgewiesen.
- `runMissingDefaultChecks`-Muster für `workspace_member_scoped_roles`: ein fehlender Fachwert wird abgewiesen.
- Nach der Migration: die vier Spalten sind `NOT NULL`.

Fixture-Zeilen tragen das Präfix und werden auch bei fehlgeschlagener Prüfung wieder abgeräumt.

## Seeds

`packages/db/scripts/seed-crm-fixture.ts` um gebundene Beispieldaten erweitern, damit die Oberfläche
prüfbar ist:

- Eine Rolle „Kundenbetreuer" (bindbar) und eine Rolle „Projekte lesen" (bindbar).
- Ein Mitglied mit Kundenbindung auf Kunde 1.
- Ein Mitglied mit Projektbindung auf genau ein Projekt von Kunde 1.

Der Seed bleibt optional aufrufbar und wiederholbar, damit die Leerzustände weiterhin prüfbar sind.

## Tests und Gates

- `pnpm db:migrate:*` gegen `development`, zweiter Lauf folgenlos.
- Preflight-Abbruch mit künstlich erzeugter `NULL`-Zeile nachweisen.
- `pnpm --filter @invessiv/db db:smoke:rbac` gegen Development grün.
- `pnpm --filter @invessiv/db db:smoke:rbac:preview` gegen Preview grün.
- `pnpm --filter @invessiv/db db:smoke:rbac:prod` kann als expliziter Produktions-Smoke ausgeführt werden;
  es werden ausschließlich eindeutig markierte Fixture-Zeilen geschrieben und im `finally` wieder entfernt.

## Akzeptanz

- Kein `NULL` mehr in den vier Spalten, und die DB verhindert neue.
- Der Preflight-Abbruch ist per Smoke belegt, nicht nur behauptet.
