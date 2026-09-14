# Ordner 03b — Mitglieder- und Rollenverwaltung

> **Status:** gemerged · **Branch:** `feat/crm-mitglieder-und-rollenverwaltung` · **Abhängigkeit:** Ordner 03 gemerged
> **Aufwand:** 3–4 Tage · **Reviewziel:** 100–120 Dateien · **Folgeeinheit:** Ordner 03c (Übergabe und Deaktivierung)

## Ziel und Stand nach Merge

Der Owner verwaltet Mitglieder und Rollen in der App. Ab hier arbeiten mehrere interne Nutzer mit unterschiedlichen
Rechten, und jede sichtbare Aktion respektiert die Permissions des Actors.

**Konkreter Task-Plan**

- [`02c-mitglieder-und-rollenverwaltung.md`](./02c-mitglieder-und-rollenverwaltung.md)

## Neuschnitt (13.09.2026, mit dem Nutzer abgestimmt)

Der Gesamtumfang lag geschätzt bei 140–150 Dateien und damit über dem Split-Gate von 120. Geteilt wird vertikal:

| Ordner | Inhalt                                                                                                      |
| ------ | ----------------------------------------------------------------------------------------------------------- |
| 03b    | Mitglieder anlegen, Rollen zuweisen, Custom-Rollen, Owner-Flow, Security-Events, Settings-UI, Lead-Aktionen |
| 03c    | Ownership-Registry, Übergabe, Aktivieren/Deaktivieren mit Sperre                                            |

Der Zwischenstand ist sicher: Ohne Deaktivierungspfad entsteht kein inaktives Mitglied mit offenen Zuständigkeiten.
Permissionabhängige Lead-Aktionen bleiben in 03b, weil ab diesem Merge Mitglieder ohne `leads.delete` existieren.

## Umfang

- Bereich `settings` mit Area-Permission `members.manage` in `WORKSPACE_AREA_PERMISSIONS`; Rollen-Tab mit
  `roles.manage`.
- Mitglied anlegen: Owner wählt ein noch nicht verknüpftes Clerk-Konto (Clerk Backend API); Stammdaten werden
  übernommen und beim Öffnen der Liste aus Clerk aktualisiert. Die Einladung selbst bleibt im Clerk-Dashboard.
- Mehrere Rollen zuweisen und entziehen; Vorschau der effektiven Permissions.
- Custom-Rollen erstellen, umbenennen, deaktivieren und mit delegierbaren Permissions bestücken.
- Separater Owner-Flow für Vergabe/Entzug von `workspace_owner`; letzter aktiver Owner geschützt.
- `security_events` für jede Mitglieder-, Rollen- und Owner-Änderung (CHECK um neue Typen und `role` erweitert).
- Permissionabhängige Aktionen in Leads und Outreach (z. B. Lead löschen nur mit `leads.delete`).

## Merge-Gate

- [x] Mitglied mit Custom-Rolle darf die erlaubte Aktion (200) und erhält für eine andere 403.
- [x] Rollenentzug wirkt beim nächsten Request.
- [x] Letzter aktiver Owner kann seiner Owner-Rolle nicht beraubt werden (409 mit Begründung). Der Unit-Test deckt
      Abweisung und Schreibreihenfolge ab; der DB-Integrationstest weist ohne Vorbedingung nach, dass konkurrierende
      Änderungen an Owner-Zuweisungen durch `SELECT … FOR UPDATE` serialisiert werden. **Bewusste Testabweichung vom
      ursprünglichen T8:** Ein echter Handler-zu-DB-Test für „letzter Owner → 409“ würde
      in der geteilten Dev-DB voraussetzen, alle fremden aktiven Owner zu verändern. Deshalb bleiben die 409-Abweisung
      im Handler-Unit-Test, das HTTP-Mapping im Route-Test und die Nebenläufigkeitsgarantie im DB-Integrationstest
      getrennt. Risiko: Das Zusammenspiel dieser drei Ebenen wird nicht in einem einzigen Test ausgeführt.
- [x] Custom-Rolle mit nicht delegierbarer Permission wird abgewiesen (422), auch bei manipuliertem Request.
- [x] Rollen- und Mitgliedsänderungen sind versioniert (`updateVersioned`, 409 mit aktuellem Stand).
- [x] Jede Änderung erzeugt genau einen `security_events`-Eintrag mit tatsächlichem Actor und ohne PII in Metadaten.
- [x] DB-CHECK-Werte von `security_events` entsprechen den Const-Objekten (Smoke).
- [x] Keine sichtbare Aktion ohne passende Permission — Settings, Leads und Outreach; Empty-States erklären
      Rollen- und Kandidatenbereich.
- [ ] DE/EN-Dictionaries vollständig; A11y-Smoke für Liste, Dialoge und Fokus-Reihenfolge.
      Dictionaries vollständig und Fokusfalle/Escape/Fokus-Rückgabe per jsdom-Test abgesichert. Offen: manueller
      Browser-Check (Tastatur, Mobil, Dark/Light) mit echter Clerk-Session.
- [x] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes, Integrationstests und Workspace-Build grün.

### Nachweis (13.09.2026)

| Nachweis                                                                    | Ergebnis                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------ |
| `pnpm -r lint` / `pnpm -r typecheck` / `pnpm -r test`                       | grün (Workspace 878, Web 518, Common 124)              |
| `pnpm --filter @invessiv/workspace build`                                   | grün, Route `/[locale]/settings` und API-Routen gebaut |
| Migration `0025` auf Dev-DB; `db:smoke:dev` / `crm` / `activities` / `rbac` | ok / 33 / 13 / 43 Checks ok                            |
| `access-management.integration.test.ts` (`--mode rbac-integration`)         | 4 ok, einschließlich Owner-Lock                        |
| Bestehende Integrationstests RBAC / `updateVersioned`                       | 7 ok + 1 übersprungen / 2 ok                           |

**Review-Umfang:** 200 geänderte Dateien und damit über dem Reviewziel von 100–120, an der harten Grenze von 200.
Rund 15 davon sind Plan- und Statusdokumentation (Neuschnitt 03b/03c/03d, Status 01–03, Entscheidung zum
Kundennamen), rund 20 die permissionabhängigen Lead-Aktionen samt Tests.

**Hinweis Rollout:** Migration `0025` vor dem Deploy in `preview`/`production` anwenden; ohne sie lehnt die DB die
neuen Security-Event-Typen ab und jede Mitglieds- oder Rollenänderung antwortet 500.

## Rollback

App-Revert auf Ordner 03. Angelegte Mitglieder, Rollen und Zuweisungen bleiben gültig und werden von der
Ordner-03-Auth weiter ausgewertet; es fehlt nur die Oberfläche. Die erweiterten CHECK-Constraints bleiben stehen; die
Vorversion schreibt nur `workspace_owner_bootstrapped` und ist damit kompatibel.
