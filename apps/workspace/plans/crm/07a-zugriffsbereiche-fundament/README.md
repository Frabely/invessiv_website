# Ordner 07a — Zugriffsbereiche: Fundament

> **Status:** läuft · **Branch:** `feat/crm-zugriffsbereiche-fundament` · **Abhängigkeiten:** 03c, 07
> **Aufwand:** 3 Tage · **Reviewziel:** 60–90 Dateien · **Folgeeinheiten:** 07b (Filter), 07c (Verwaltungs-UI)

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`../07-projekte/36-zugriffsbereiche-fundament.md`](../07-projekte/36-zugriffsbereiche-fundament.md) — Katalog-Merkmal
  `scopable`,
  bindbare Rollen, Tabelle `workspace_member_scoped_roles`, Actor-Auflösung, Prüf-Patterns, Commands und API.

Rollen lassen sich zusätzlich **an einen Kunden oder ein Projekt gebunden** zuweisen („Rolle X auf Kunde Y“, „Rolle X
auf Projekt Z“). Nach dem Merge ist das Modell vollständig in DB, Actor und API vorhanden, aber **unsichtbar und
wirkungslos**: Kein Lesepfad wertet gebundene Rechte aus, und ohne UI entsteht keine Zuweisung. Der Zwischenstand ist
fail-closed — eine per API angelegte Zuweisung gewährt nichts, bis Ordner 07b die Filter liefert.

Entscheidung des Nutzers vom 14.09.2026, siehe `00-entscheidungen.md`, Abschnitt „Zugriffsbereiche“.

## Warum drei Einheiten und warum nach Ordner 07

| Einheit | Inhalt                                                                                   | Sichtbar |
| ------- | ---------------------------------------------------------------------------------------- | -------- |
| 07a     | Schema, Katalog, Actor, `canOn`/`accessScope`, Commands, API, Seeds                      | nein     |
| 07b     | Alle Lese- und Schreibpfade aus 04–07 filtern; Bereichs-Gate; Zuständigkeitsprüfung      | nein¹    |
| 07c     | Verwaltungs-UI in Settings und Kundenakte; Rollen-Dialog; NOT-NULL-Cleanup der Expansion | ja       |

¹ Verhalten ändert sich nur für Mitglieder mit gebundenen Zuweisungen; die entstehen erst über die UI in 07c.

Nach Ordner 07 existieren Kunden, Kundenliste, Kundenakte und Projekte — beide Bindungsebenen sind damit real
testbar. Der Nachrüstaufwand bleibt auf 04–07 begrenzt. Alle späteren CRM-Ordner (08 Aufgaben bis 20 Stunden) bauen
von Anfang an mit `accessScope`, statt in einem Sammel-PR über zehn Ordner nachgerüstet zu werden.

## Umfang

- `permissions.scopable` und `roles.scope_assignable`, per zusammengesetztem Fremdschlüssel durchgesetzt (Muster:
  Delegierbarkeit).
- Tabelle `workspace_member_scoped_roles` mit Kunden- und Projektbindung.
- `WorkspaceActor` trägt gebundene Rechte je Kunde und je Projekt; jeder Request löst neu auf.
- Patterns `canOn`, `canAnywhere`, `accessScope`; serverseitiger Query-Helfer für Drizzle-Bedingungen.
- Commands und Routen: Zuweisungen auflisten, anlegen, entfernen; `createRole`/`updateRole` um `scopeAssignable`
  erweitert.
- Security-Events `workspace_member_access_scope_granted` und `…_revoked`.
- `db:seed:crm` um Mitglieder mit gebundenen Rollen erweitert.

## Merge-Gate

- [ ] Zweiter Migrationslauf folgenlos; Drizzle-Modelle deckungsgleich zur Migration (Review-Punkt).
- [ ] `db:smoke:rbac`: Eine Rolle mit nicht bindbarer Permission lässt sich per SQL weder als bindbar markieren noch
      gebunden zuweisen; eine gebunden zugewiesene Rolle kann nicht auf „nicht bindbar“ zurückgesetzt werden;
      Projekt und Kunde einer Zuweisung passen per Fremdschlüssel zusammen.
- [ ] `rbac-catalog-check` vergleicht `scopable` zwischen Code und DB.
- [ ] Unit-Tests für `canOn`/`accessScope`: Vereinigung, Vererbung Kunde → Projekte, Owner = alles, inaktive Rolle
      wirkt nicht, nicht bindbare Permission aus einer Zuweisung wird verworfen.
- [ ] API: 201/404/409/422 je Endpunkt; genau ein Security-Event je Änderung, Metadaten nur IDs.
- [ ] Kein bestehender Lesepfad ändert sein Verhalten (Bestandstests unverändert grün).
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes, Integrationstests und Workspace-Build grün.

## Rollback

App-Revert auf Ordner 07. Additive Spalten und die neue Tabelle bleiben stehen; die Vorversion liest sie nicht.
Rollen, die die Vorversion anlegt, tragen `scope_assignable = NULL` und gelten als nicht bindbar. Angelegte
Zuweisungen bleiben gespeichert und wirkungslos.
