# Task 02b — Workspace-Member-Legacy-Cleanup

> **Merge-Einheit:** Ordner 03a · **Branch:** `feat/crm-workspace-member-legacy-cleanup`
> **Aufwand:** S · **Abhängigkeit:** Task 02 produktiv ausgerollt und abgenommen

## Scope

Ordner 03 hält die alten Pflichtfelder in `workspace_members` ausschließlich für einen sicheren Rollout zur vorherigen
App-Version vorübergehend am Leben. Dieser Task entfernt genau diese Übergangsschicht. Er erweitert weder das
Rollenmodell noch die Mitglieder-UI.

## Umsetzung

1. Readiness-Smoke ausführen:
   - jeder aktive `workspace_member` besitzt eine gültige `user_id`;
   - jeder aktive Workspace-Member besitzt mindestens eine aktive Workspace-Rolle;
   - mindestens ein aktiver `workspace_owner` existiert;
   - kein benötigter Wert lebt ausschließlich in einer Legacy-Spalte.
2. Schattenwrites für `clerk_user_id`, `email`, `role` und `credentials_access` aus Commands entfernen.
3. Seeds, Fixtures und Smokes auf `users`, Memberships und Rollenzuweisungen umstellen.
4. Neue Migration anlegen, die Legacy-Indizes und -Constraints vor den Legacy-Spalten entfernt.
5. Drizzle-Modell und Package-Exports deckungsgleich aktualisieren.
6. Repositoryweit direkte Reads und Rollenvergleiche ausschließen.

## Abbruchbedingungen

Die Migration bricht vor dem ersten Drop ab, wenn:

- eine `workspace_members.user_id` fehlt oder auf keinen User zeigt;
- ein aktives Mitglied keine effektive Workspace-Rolle besitzt;
- kein aktiver Owner existiert;
- Anwendungscode oder registrierte DB-Smokes noch vom Legacy-Schema abhängen.

## Akzeptanzkriterien

- [ ] Die vier Legacy-Spalten und ihre DB-Objekte existieren nicht mehr.
- [ ] Namens- und E-Mail-Stammdaten werden ausschließlich aus `users` gelesen.
- [ ] Berechtigungen werden ausschließlich aus aktiven Rollenzuweisungen berechnet.
- [ ] `credentials.reveal` folgt ausschließlich aus einer Rolle.
- [ ] Der letzte Owner bleibt geschützt.
- [ ] Rollenentzug wirkt ab dem nächsten Request.
- [ ] Ein DB-Fehler oder eine unvollständige Identität öffnet keinen Zugriff.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes und Workspace-Build sind grün.

## Nicht enthalten

- neue Permissions oder Rollenfunktionen
- Portalmitgliedschaften
- Activity-Legacy-Cleanup aus Ordner 22
- fachliche Änderungen an Kunden, Personen oder Leads
