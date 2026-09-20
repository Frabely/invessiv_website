# Review-Findings: Zugriffsverwaltung-UI gegen `master`

> **Basis:** Merge-Base `b4cf6d8502f130a802a1351d19e222da25ce2721` · **Stand:** 20.09.2026
> **Geprüfter Umfang:** gesamter Arbeitsstand gegenüber `master`, mit Schwerpunkt auf Ordner 07c,
> Zugriffsverwaltung, Rollen, CRM-Kundenakte, Server-Read-Pfade und DB-Cleanup.

## Ergebnis

Die Kernfunktion zum Vergeben und Anzeigen gebundener Zugriffe ist weitgehend vorhanden. Vor einem Merge bleiben
der Lauf der echten End-to-End-Sessions, die reale Datenbankabnahme und eine bewusst bis Ordner 24 bestehende
parallele Ownership-Registry. Der sichere Owner-Wechsel beziehungsweise die Übergabe ohne Zugriff ist bewusst nach
Ordner 24 verschoben und deshalb kein Befund für Ordner 07c.

## P1 — Die Zugriffs-E2E-Suite braucht noch echte Sessions und Fixture-IDs

Die Playwright-Suite deckt Kunden- und Projektbindung sowie 404-/403-Negativpfade ab; `test:e2e` erlaubt keine
fehlenden Testdateien mehr. Ohne konfigurierte Clerk-`storageState`-Dateien und isolierte Fixture-IDs werden die
Szenarien jedoch bewusst übersprungen. Der Code-Nachweis ist damit vorhanden, der Lauf mit echten Sessions steht aus.

- `apps/workspace/e2e/access-scopes.e2e.ts`
- `apps/workspace/e2e/README.md`
- `apps/workspace/plans/crm/07-projekte/38-zugriffsverwaltung-ui/10-abnahme.md`

**Vor Merge:** Zwei echte Session-Dateien und die vier dokumentierten IDs aus dem isolierten E2E-Fixture setzen und
`pnpm --filter @invessiv/workspace test:e2e` ohne Skips ausführen.

## P2 — Zwei konkurrierende Ownership-Registries

Die bestehende Registry zählt Zuständigkeiten unter `access/services/responsibilities/`. Zusätzlich führt der neue
`responsibilityAccessService` eine eigene `OWNERSHIP_ADAPTERS`-Liste mit eigenen Entity-Keys, Ladern,
`requiredPermission` und Scope-Mapping. Es ist keine wortgleiche Funktionsduplikation: Die erste Liste zählt,
die zweite bewertet den Zugriff. Dupliziert ist aber die fachliche Registrierung derselben Besitzentitäten und
ihrer Datenquelle. Neue Entitäten müssten deshalb in beiden Listen gepflegt werden; eine fehlende oder abweichende
Registrierung wird vom Typecheck nicht erkannt und kann Zähler und Zugriffsabsicherung auseinanderlaufen lassen.

- `apps/workspace/src/server/workspace/access/services/responsibilities/responsibility-counter-registry.ts:17`
- `apps/workspace/src/server/workspace/shared/services/responsibility-access-service.ts:29`

**Empfehlung:** Wie für Ordner 24 geplant zu einer kanonischen, erschöpfenden `OwnershipAdapter`-Registry mit Counter,
`requiredPermission`, `scopeOf`, Loader und künftigem Transfer zusammenführen. Bis dahin keine dritte Adapterliste
anlegen. Das ist kein kurzfristiger Copy/Paste-Fix, weil die Zähler-Registry bislang nur Kunden kennt, die neue
Access-Registry bereits Kunden und Projekte modelliert.

## P2 — Der DB-Cleanup braucht echte Datenbanknachweise

Migration 0033 und die Drizzle-Modelle sind im Arbeitsstand ergänzt. Vor dem Merge muss sie auf einer realen
Development-Datenbank laufen: einmal erfolgreich und einmal mit absichtlich gesetztem `NULL`, damit die Preflight-
Meldung belegt ist. Der RBAC-Smoke prüft die vier `NOT NULL`-Constraints nun explizit und kann über getrennte Befehle
gegen Development, Preview und Produktion laufen. Der tatsächliche Lauf ist kein Bestandteil dieses Code-Reviews.

- `packages/db/migrations/0033_require_scope_assignable_flags.sql`
- `packages/db/scripts/smoke-rbac.ts`
- `apps/workspace/plans/crm/07-projekte/38-zugriffsverwaltung-ui/09-migration-und-fixtures.md`

## Im Review umgesetzt

- Der Rollentyp ist nach dem Anlegen bewusst unveränderlich; Task 04 beschreibt jetzt die tatsächliche Semantik.
- `useAccessScopeTree` kapselt Lookup, Lazy-Loading, Mutationen und Konflikt-Recovery; die UI-Komponente baut und
  rendert den Baum.
- Die Rollen-Tabs mit Tastaturnavigation sind als getestete Komponente ausgelagert.
- `CustomerAccessAssignmentRow` liegt im eigenen Komponentenordner; `OwnerWithoutAccessBadge` besitzt einen
  co-located Test für Beobachtungs- und Aktionszustand.
- `db:smoke:access` und `test:e2e` stehen in den Abnahme-Gates.
- Ein fremder oder unbekannter Cockpit-Kunde liefert nun auf der Seite 404 statt einer leeren 200-Antwort; ein
  Regressionstest sichert den Negativpfad ab.

## Positiv geprüft

- `TreeView` verwendet die app-neutrale Render-Prop-Struktur und importiert kein `next/*`.
- Die neuen Access-UI-Bereiche verwenden `@invessiv/ui`-Dialoge statt lokaler Dialogkopien.
- Die Lookup-Endpunkte liegen bewusst außerhalb des CRM-Endpunktpfads und liefern schmale DTOs.
- Die bekannte Übergabe-Absicherung ist explizit nach Ordner 24 verschoben und im aktuellen Ordner nicht als
  scheinbar fertige Funktion dokumentiert.
