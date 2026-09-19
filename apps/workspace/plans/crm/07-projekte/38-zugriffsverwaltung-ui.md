# Task 38 — Zugriffsbereiche: Verwaltung in der UI

> **Merge-Einheit:** Ordner 07c · **Branch:** `feat/crm-zugriffsverwaltung-ui`
> **Aufwand:** M · **Abhängigkeiten:** Task 36 (API), Task 37 (Filter), Task 02c (Settings-UI), Task 05 (Kundenakte)
> **Migration:** eine Cleanup-Migration (`NOT NULL` der Merkmalspalten aus Task 36); Nummer im Repository ermitteln
>
> **Feinplanung der UI:** [`38-zugriffsverwaltung-ui/`](./38-zugriffsverwaltung-ui/README.md) — dort sind die
> Tickets T1–T6 durch elf umsetzbare Tasks ersetzt. Die Entscheidungstabelle und der Abschnitt „Nicht Teil
> dieses Tasks" hier bleiben gültig.

## Kontext

Nach Task 37 sind gebundene Rechte vollständig durchgesetzt, aber nur per API anlegbar. Dieser Task macht sie für den
Owner in der App konfigurierbar — ohne Codeänderung für neue Konstellationen. Er folgt den Regeln aus
`src/components/workspace/settings/AGENTS.md`: keine Rollenlogik im Client, Mutationen über
`access-api-service.ts`, Dialog-Hülle aus `shared`, 409 behält Eingaben.

## Entscheidungen

| Bereich                | Entscheidung                                                                                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Einstiege              | Zwei Oberflächen, ein Command: Settings-Dialog „Zugriffe“ je Mitglied und Abschnitt „Zugriff“ in der Kundenakte                                                                   |
| Sichtbarkeit           | Beide nur mit `members.manage`; Flags kommen serverseitig als Props (`canManageAccess`)                                                                                           |
| Hinzufügen             | Kundensuche (bestehende Kundenliste-Query, auf Anzeigename/Nummer), optional Projekt des gewählten Kunden, dann bindbare Rolle                                                    |
| Rollen-Picker          | Zeigt alle aktiven Nicht-Owner-Rollen; nicht bindbare sichtbar gesperrt mit Hinweis „enthält Rechte, die nur workspace-weit gelten“ und Link zum Rollen-Dialog                    |
| Vorschau               | Clientseitig über `unionRolePermissions` aus workspace-weiten Rollen, Rollen am Kunden und — bei Projektwahl — Rollen am Projekt. Kein eigener Endpoint (Muster aus Task 02c)     |
| Kundenakte             | Abschnitt gruppiert: „Ganzer Kunde“ und je Projekt. Hinzufügen ist dort auf den Kunden vorbelegt                                                                                  |
| Zuständig ohne Zugriff | Hinweis-Badge am Owner-Feld in Kundenakte und Projekt sowie Zähler in der Mitgliederliste; Aktion führt zur Übergabe bzw. zum Zugriffs-Dialog                                     |
| Rollen-Dialog          | Schalter `scopeAssignable`; bei aktivem Schalter werden nicht bindbare Permissions gesperrt. 422/409 aus Task 36 mit eigener Meldung                                              |
| URL-State              | Settings-Tab bleibt `?tab=`; Dialog-Open-State lokal. Kundenakte-Abschnitt ohne eigenen URL-State                                                                                 |
| Cleanup                | Preflight zählt `NULL`-Zeilen und bricht ab; danach `SET NOT NULL`. Erst in diesem Release zulässig, weil 07a und 07b die Spalten vollständig schreiben (`packages/db/AGENTS.md`) |

## Verzeichnisstruktur (Richtwert)

```txt
packages/db/migrations/<n>_require_scope_flags.sql
packages/db/src/record-configuration/auth/{permissions,roles,role-permissions}.ts   .notNull()

apps/workspace/src/
  client/access/access-api-service.ts                          + listMemberAccessScopes, grant, revoke (+ test)
  components/workspace/settings/members/member-access-dialog/  (+ test, module.css)
  components/workspace/settings/members/members-list/          + Zähler, Markierungen
  components/workspace/settings/roles/role-form-dialog/        + Schalter scopeAssignable (+ test)
  components/workspace/settings/shared/access-scope-picker/    Kunde → Projekt → Rolle (+ test)
  components/workspace/crm/customer-detail/customer-access-section/  (+ test)   Pfad an Ordner-04-Struktur anpassen
  components/workspace/crm/shared/owner-without-access-badge/  (+ test)
  i18n/dictionaries/workspace/settings/{members,roles,permissions}/{de,en}.json
  i18n/dictionaries/workspace/crm/…/{de,en}.json
```

## Tickets

### CRM-07c-T1 — Client-Service und Picker

- API-Methoden, `access-scope-picker` mit Kundensuche, abhängiger Projektauswahl und gesperrten Rollen.
- **Akzeptanz:** jsdom-Tests für Tastaturbedienung, gesperrte Rollen mit Erklärung, leere Suche vs. keine Treffer.

### CRM-07c-T2 — Settings-Dialog „Zugriffe“

- Liste, Hinzufügen, Entfernen, Vorschau, 409-Konflikt mit aktuellem Stand; Zähler in der Mitgliederliste.
- **Akzeptanz:** Entfernen der letzten Zuweisung zeigt `MEMBER_WITHOUT_ROLE` verständlich; Fokus-Rückgabe nach
  Schließen.

### CRM-07c-T3 — Abschnitt „Zugriff“ in der Kundenakte

- Gruppierte Anzeige, Hinzufügen mit Vorbelegung, Entfernen; Badge „Zuständig ohne Zugriff“.
- **Akzeptanz:** Abschnitt fehlt vollständig ohne `members.manage` (nicht nur deaktiviert).

### CRM-07c-T4 — Rollen-Dialog

- Schalter, Sperrlogik, Fehlermeldungen für nicht bindbare Permission und bestehende Zuweisungen.
- **Akzeptanz:** manipulierter Request bleibt serverseitig 422 (Bestandstest aus Task 36).

### CRM-07c-T5 — Cleanup-Migration

- Preflight und `SET NOT NULL`; Drizzle-Modelle `.notNull()`; Smoke prüft `NOT NULL`.
- **Akzeptanz:** zweiter Lauf folgenlos; Preflight-Abbruch mit eindeutiger Meldung per Smoke nachgewiesen.

### CRM-07c-T6 — E2E und manuelle Abnahme

- Die zwei E2E-Szenarien aus der Ordner-README mit echten Clerk-Sessions; manueller Check Mobil, Dark/Light.

## Nicht Teil dieses Tasks

- Eigenes delegierbares Verwaltungsrecht (z. B. Kundenbetreuer vergibt selbst Zugriffe)
- Mitglied direkt nur mit gebundener Rolle anlegen
- Zuständigkeiten für Chat oder Aufgabenplanung als eigene Felder — das Modell erlaubt sie später additiv über die
  Ownership-Registry mit `requiredPermission`
