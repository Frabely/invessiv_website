# Review-Findings: Zugriffsverwaltung-UI gegen `master`

> **Basis:** Merge-Base `b4cf6d8502f130a802a1351d19e222da25ce2721` · **Stand:** 20.09.2026
> **Geprüfter Umfang:** gesamter Arbeitsstand gegenüber `master`, mit Schwerpunkt auf Ordner 07c,
> Zugriffsverwaltung, Rollen, CRM-Kundenakte, Server-Read-Pfade und DB-Cleanup.

## Ergebnis

Die Kernfunktion zum Vergeben und Anzeigen gebundener Zugriffe ist weitgehend vorhanden. Vor einem Merge bleiben
aber ein funktionaler Rollen-Dialog-Fehler, fehlende End-to-End-Nachweise, eine parallele Ownership-Registry und
mehrere Wartbarkeitsverstöße. Der sichere Owner-Wechsel beziehungsweise die Übergabe ohne Zugriff ist bewusst nach
Ordner 24 verschoben und deshalb kein Befund für Ordner 07c.

## P1 — Bearbeiten kann den Rollentyp nicht ändern

`RoleFormDialog` hält `scopeAssignable` im State, zeigt beim Bearbeiten aber nur ein Badge. Der Wert wird beim
`updateRole`-Request nicht mitgesendet. Eine bestehende Rolle kann daher entgegen Task 04 nicht zwischen
workspace-weit und kunden-/projektbindbar umgestellt werden; die serverseitigen Konfliktprüfungen für vorhandene
Zuweisungen sind aus der Oberfläche nicht erreichbar.

- `apps/workspace/src/components/workspace/settings/roles/role-form-dialog/role-form-dialog.tsx:94`
- `apps/workspace/src/components/workspace/settings/roles/role-form-dialog/role-form-dialog.tsx:279`
- `apps/workspace/plans/crm/07-projekte/38-zugriffsverwaltung-ui/04-rollen-dialog-schalter.md`

**Empfehlung:** Den Rollentyp beim Bearbeiten als bestätigte, bedienbare Auswahl anbieten, `scopeAssignable` in den
Update-DTO/-Command aufnehmen und die bestehenden 422-Konflikte für gebundene beziehungsweise globale Zuweisungen
als UI-Fehler abbilden. Unit- und API-Tests für beide Richtungen ergänzen.

## P1 — Die verpflichtenden Zugriffs-E2E-Szenarien existieren nicht

Unter `apps/workspace/e2e/` liegen keine Tests. Der vorhandene `test:e2e`-Befehl darf deshalb erfolgreich ohne Tests
enden. Damit sind die zwei Leitfälle (Kundenbindung, Projektbindung) sowie die vorgeschriebenen 404-/403-Negativpfade
mit echten Sessions nicht belegt.

- `apps/workspace/package.json:15`
- `apps/workspace/plans/crm/07-projekte/38-zugriffsverwaltung-ui/10-abnahme.md`

**Empfehlung:** Playwright-Fixtures mit Owner, kunden- und projektgebundenem Mitglied ergänzen und mindestens die in
Task 10 beschriebenen Seiten- und API-Fälle ausführen. `--pass-with-no-tests` für den produktiven Abnahme-Befehl
entfernen oder durch einen Test-Existenz-Check absichern.

## P2 — Zwei konkurrierende Ownership-Registries

Die bestehende Registry zählt Zuständigkeiten unter `access/services/responsibilities/`. Zusätzlich führt der neue
`responsibilityAccessService` eine eigene `OWNERSHIP_ADAPTERS`-Liste mit eigenen Entity-Keys und Scope-Mapping.
Neue besitzbare Entitäten müssen dadurch an mehr als einer Stelle ergänzt werden; Abweichungen werden nicht vom
Typecheck verhindert.

- `apps/workspace/src/server/workspace/access/services/responsibilities/responsibility-counter-registry.ts:17`
- `apps/workspace/src/server/workspace/shared/services/responsibility-access-service.ts:29`

**Empfehlung:** Wie für Ordner 24 geplant zu einer kanonischen, erschöpfenden `OwnershipAdapter`-Registry mit Counter,
`requiredPermission`, `scopeOf`, Loader und künftigem Transfer zusammenführen. Bis dahin keine dritte Adapterliste
anlegen.

## P2 — Neue Client-Komponenten sind zu groß und vermischen Verantwortlichkeiten

Der neue Zugriffsbaum bündelt Suche, Debounce, Remote-Lookups, Baumaufbau, Lazy-Loading, Mutation, Konflikt-Recovery,
Rechtevorschau und Rendering in einer 610-Zeilen-Komponente. Der Rollen-Dialog bündelt zusätzlich globale Rollen,
Tab-Navigation, Discard-Dialog und Zugriffsbaum in rund 414 Zeilen. Das verletzt die Regel, monolithische Dateien
frühzeitig nach Verantwortung zu teilen und erschwert gezielte Tests.

- `apps/workspace/src/components/workspace/settings/shared/access-scope-tree/access-scope-tree.tsx:77`
- `apps/workspace/src/components/workspace/settings/members/member-roles-dialog/member-roles-dialog.tsx:63`

**Empfehlung:** `useAccessScopeTree` für Lookup-, Expand- und Mutationszustand extrahieren; Tree-Builder und
Permission-Preview als reine, getestete Patterns behalten bzw. ergänzen. Den Rollen-Dialog in Tab-Panel-Komponenten
und einen kleinen Dialog-Controller teilen. Die Page bleibt Orchestrierung, fachliche Zugriffsentscheidungen bleiben
serverseitig.

## P2 — Komponentenstruktur und Tests nicht durchgängig regelkonform

`CustomerAccessAssignmentRow` liegt direkt neben `CustomerAccessSection` statt in einem eigenen Komponentenordner.
`OwnerWithoutAccessBadge` hat einen Ordner und CSS, aber keinen co-located Interaktionstest. Die scoped CRM-Regel
fordert beides pro Komponente.

- `apps/workspace/src/components/workspace/crm/detail/customer-access-section/customer-access-assignment-row.tsx`
- `apps/workspace/src/components/workspace/crm/shared/owner-without-access-badge/owner-without-access-badge.tsx`
- `apps/workspace/src/components/workspace/crm/AGENTS.md`

**Empfehlung:** Beide Komponenten in eigene Ordner verschieben; für den Badge den CTA, den rein beobachtenden Zustand
und die Tastaturauslösung testen.

## P2 — Der DB-Cleanup braucht echte Datenbanknachweise

Migration 0033 und die Drizzle-Modelle sind im Arbeitsstand ergänzt. Vor dem Merge muss sie auf einer realen
Development-Datenbank laufen: einmal erfolgreich und einmal mit absichtlich gesetztem `NULL`, damit die Preflight-
Meldung belegt ist. Der RBAC-Smoke muss nach der Migration die neuen `NOT NULL`-Constraints und die Scope-Integrität
explizit prüfen.

- `packages/db/migrations/0033_require_scope_assignable_flags.sql`
- `packages/db/scripts/smoke-rbac.ts`
- `apps/workspace/plans/crm/07-projekte/38-zugriffsverwaltung-ui/09-migration-und-fixtures.md`

## P3 — Abnahme-Dokumentation nennt nicht den passenden Scope-Smoke

Task 10 nennt nur `db:smoke:rbac`. Die neue Scope-Read- und Verwaltungsintegration liegt jedoch im separaten
Workspace-Script `db:smoke:access`; ohne diesen Befehl wird der neue Pfad nicht als Gate geprüft.

- `apps/workspace/plans/crm/07-projekte/38-zugriffsverwaltung-ui/10-abnahme.md`
- `apps/workspace/package.json:14`

**Empfehlung:** `pnpm --filter @invessiv/workspace db:smoke:access` als verpflichtendes Gate ergänzen und für die
DB-Constraint-Smokes zusätzlich `pnpm --filter @invessiv/db db:smoke:rbac` aufnehmen.

## Positiv geprüft

- `TreeView` verwendet die app-neutrale Render-Prop-Struktur und importiert kein `next/*`.
- Die neuen Access-UI-Bereiche verwenden `@invessiv/ui`-Dialoge statt lokaler Dialogkopien.
- Die Lookup-Endpunkte liegen bewusst außerhalb des CRM-Endpunktpfads und liefern schmale DTOs.
- Die bekannte Übergabe-Absicherung ist explizit nach Ordner 24 verschoben und im aktuellen Ordner nicht als
  scheinbar fertige Funktion dokumentiert.
