# Review 03b — Mitglieder- und Rollenverwaltung

> **Branch:** `feat/crm-mitglieder-und-rollenverwaltung` gegen `master` · **Stand:** 14.09.2026 (Commit `cb8572ac`)
> **Umfang:** 203 Dateien, kompletter CRM-Plan und alle betroffenen `AGENTS.md`

## Ergebnis

Solide Umsetzung: Owner-Invariante mit `SELECT … FOR UPDATE`, Versionierung über `updateVersioned`, doppelte
Delegierbarkeitsprüfung, keine PII in Events und Logs, vollständig typisierte Fehler-Maps.

**Lokal ausgeführt:** `typecheck`, `lint`, `test` (Workspace 878 grün, 16 übersprungen) und `test` (Common 124 grün).
**Nicht ausgeführt:** Workspace-Build, DB-Smokes, Integrationstest gegen die Dev-DB.

Empfehlung: Punkte 1–4 vor dem Merge beheben. Bei 5, 10, 11 und L1 greift das Architektur-Gate (sofort beheben oder
bewusst verschieben und dokumentieren).

---

## 🔴 Hoch

### 1. Kandidaten-Modell widerspricht Ordner 12

- **Wo:** `server/workspace/access/query-handler/list-clerk-candidates.query-handler.ts:20`,
  `server/workspace/access/command-handler/add-workspace-member.command-handler.ts:42`
- **Problem:** Kandidat ist ein „Clerk-Konto ohne `users`-Zeile“. Laut `12-portal-identitaet/20-portal-zugang.md:75`
  teilen sich Portal und Workspace aber dieselbe `users`-Zeile. Ein Portal-Kontakt könnte dann nie Mitglied werden:
  Er fehlt in der Kandidatenliste, und das Anlegen scheitert an `users_clerk_user_id_uidx` mit der falschen Meldung
  „bereits mit einem Mitglied verknüpft“.
- **Warum teuer:** Nach Ordner 12 heißt die Korrektur geänderte Semantik, Tests und Texte mit echten Daten.
- **Vorschlag:** Kandidat = Clerk-Konto ohne `workspace_members`-Zeile. Das Anlegen verwendet eine vorhandene
  `users`-Zeile wieder.

### 2. „Mitglied ohne Rolle“ zählt inaktive Rollen mit

- **Wo:** `revoke-workspace-owner.command-handler.ts:61`, `replace-workspace-member-roles.command-handler.ts:58`,
  `add-workspace-member.command-handler.ts:87`, `services/role-assignment-service.ts:41`
- **Problem:** Die Invariante soll verhindern, dass ein Mitglied still alle Rechte verliert. Inaktive Rollen gewähren
  aber nichts. Ein Owner mit nur einer inaktiven Zusatzrolle verliert beim Owner-Entzug trotzdem alles. Beim Ersetzen
  gilt dasselbe, wenn nur bereits zugewiesene inaktive Rollen behalten werden.
- **Vorschlag:** Auf „mindestens eine **aktive** Rolle“ prüfen, oder die Regel im Plan bewusst abschwächen.

### 3. Owner-Dialog kehrt nach 409 die Aktion um

- **Wo:** `components/workspace/settings/members/owner-change-dialog/owner-change-dialog.tsx:34`
- **Problem:** „Owner entziehen“ trifft auf einen Konflikt, weil jemand anderes schon entzogen hat. Der Dialog wechselt
  dann auf „Zum Owner machen?“ und bittet um erneute Bestätigung. Ein Reflexklick vergibt damit die Owner-Rolle, also
  das Gegenteil der Absicht. Der Code-Kommentar behauptet das Umgekehrte.
- **Vorschlag:** Hat sich die Richtung geändert, „bereits erledigt“ anzeigen statt erneut bestätigen zu lassen.

### 4. Eigenen Owner-Status entziehen führt in eine 404

- **Wo:** `members/member-row/member-row.tsx:90`, `hooks/workspace/use-versioned-mutation.ts:42`,
  `app/[locale]/(app)/settings/page.tsx:64`
- **Problem:** Nach dem Selbst-Entzug fehlt `members.manage`. `router.refresh()` rendert die Settings-Seite neu,
  `requireWorkspaceArea` antwortet mit `notFound()`. Der Nutzer landet ohne Erklärung in einer Sackgasse.
- **Vorschlag:** Vorher warnen und nach Erfolg auf den Workspace-Start leiten.

### 5. Harte Dateigrenze überschritten, Doku veraltet

- **Problem:** 203 geänderte Dateien. `plans/crm/AGENTS.md` setzt 200 als harte Obergrenze. Die 03b-README nennt 200,
  `00-entscheidungen.md` schätzt 100–120. Der Commit „cr fixes“ hat die Zahl erhöht, ohne dass die README nachgezogen
  wurde.
- **Vorschlag:** Zahl und Begründung in README und Entscheidungstabelle korrigieren. Die Überschreitung ausdrücklich
  als Abweichung festhalten.

### 6. Handler-Logik großteils ungetestet

- **Problem:** Handler-Tests gibt es nur für `addWorkspaceMember` (3 Fälle) und `revokeWorkspaceOwner`. Die
  Route-Tests mocken die Handler und prüfen damit nur das HTTP-Mapping. Ohne eigene Tests bleiben:
  - `createRole`, `updateRole`: Diff-Metadaten, Unique-Violation → 409, Systemrolle → 422
  - `grantWorkspaceOwner`: `AlreadyOwner` wird nirgends getestet, `NotOwner` ebenfalls nicht
  - `replaceWorkspaceMemberRoles` und `roleAssignmentService.checkAssignable`
  - `syncWorkspaceMemberProfiles` (nur gemockt) und `clerkDirectoryService`
- **Warum relevant:** Die Akzeptanzkriterien aus T2 und T4 sind damit auf Handler-Ebene nicht belegt. Die Häkchen im
  Merge-Gate sind zu optimistisch.

---

## 🟠 Mittel

### 7. Stammdaten-Sync blockiert jeden Render

`settings/page.tsx:73`: Vor dem Rendern läuft ein synchroner Clerk-Call ohne Timeout, danach gegebenenfalls ein
DB-Write, bei jedem Aufruf des Mitglieder-Tabs. Langsames Clerk heißt langsame Seite. Zusätzlich synchronisiert
`clerk-directory-service.ts:81` still nur die ersten 500 Mitglieder. **Vorschlag:** `after()` oder eine Drosselung.

### 8. Custom-Rolle kann Systemrollen im UI imitieren

`access-schemas.ts:36`, `lib/workspace/access/role-label.ts:10`: In der DB heißen Systemrollen „Workspace owner“, im
UI „Owner“ bzw. „Mitglied“. Eine Custom-Rolle „Owner“ ist daher erlaubt und steht optisch gleichwertig neben der
echten. Umgekehrt ergibt „Workspace owner“ einen `ROLE_NAME_TAKEN`, obwohl der Nutzer diesen Namen nie sieht.
**Vorschlag:** Namen zusätzlich gegen die übersetzten Systemrollen-Labels aller Locales prüfen.

### 9. `GET /members` liefert das Admin-DTO an alle Mitglieder

`app/api/workspace/members/route.ts:19`: `members.read` steckt in der Basisrolle. Damit sieht jedes Mitglied
Owner-Status, alle Rollenzuweisungen, Versionen und E-Mails. Spätere Nutzer („Zuständigkeit wählen“) koppeln sich an
dieses DTO. **Vorschlag:** ein schmales `MemberOptionDto` einführen, solange es noch keine Aufrufer gibt.

### 10. Validierungsgrenzen doppelt gepflegt

`role-form-dialog.tsx:42` und `access-schemas.ts:7` definieren `ROLE_NAME_MAX_LENGTH` und
`ROLE_DESCRIPTION_MAX_LENGTH` jeweils selbst. Die Werte können auseinanderlaufen, und die Export-Regel wird
verletzt. **Vorschlag:** nach `common/constants`.

### 11. Constraint-Namen als verstreute String-Literale

`roles_realm_name_uidx` steht in `create-role.command-handler.ts:19` und in `update-role.command-handler.ts:23`,
die `users_*`-Namen in `add-workspace-member.command-handler.ts:24`. Wird ein Index umbenannt, wird aus der 409 still
eine 500 (Verstoß gegen „Doppelte Tabellenmetadaten vermeiden“). **Vorschlag:** Konstanten neben dem Drizzle-Modell.

### 12. Rollen-Dialog nach Konflikt mit veralteter Auswahl

`member-roles-dialog.tsx:61`: `choices` basiert auf `initialRoleIds` statt auf `mutation.current`. Enthält der frische
Stand eine inaktive Rolle, die vorher nicht zugewiesen war, fehlt sie in der Auswahl. Beim erneuten Speichern wird sie
still entfernt.

---

## 🟡 Niedrig und Regelabweichungen

| #   | Stelle                                                                                            | Befund                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | `client/access/access-api-service.ts:33`                                                          | `CONFLICT_STATUS = 409`: Statuscodes gehören laut `plans/crm/AGENTS.md` aus `HttpResponseCode`, nicht als nackte Zahl                                               |
| L2  | `role-selection.ts:14`, `role-assignment-service.ts:36`, `workspace-member-mapping-service.ts:33` | Prüfen `SystemRoleKey` außerhalb von `auth/`. Fachlich Verwaltung, keine Autorisierung; `auth/AGENTS.md` und `settings/AGENTS.md` sollten das ausdrücklich erlauben |
| L3  | `workspace-sidebar-items.ts:3`                                                                    | Erweitert einen Literal-Union-Typ statt Const-Objekt (Altbestand)                                                                                                   |
| L4  | `common/constants/ui/workspace-dialog-sizes.ts`                                                   | Pflicht-Konstantentest fehlt                                                                                                                                        |
| L5  | `services/role-read-service.ts:19`                                                                | `Promise.all` auf einer Transaktion (neon-serverless) funktioniert nur durch Queue-Verhalten des Clients, lieber sequentiell                                        |
| L6  | `packages/db/scripts/run-migrations.ts:64`                                                        | Statements laufen ohne Transaktion, deshalb ist `DROP` + `ADD CONSTRAINT` in `0025` nicht atomar. Geringes Risiko, weil ein zweiter Lauf den Zustand repariert      |
| L7  | `members/clerk-candidates/route.ts:24`                                                            | Validiert in der Route, alle anderen Endpunkte im Command                                                                                                           |
| L8  | `clerk-directory-service.ts:56`                                                                   | Ohne Suche: Filter erst nach dem Limit der 100 neuesten Konten. Sind diese alle verknüpft, erscheint „Kein freies Konto“, obwohl ältere freie Konten existieren     |
| L9  | `access-management.integration.test.ts`                                                           | Belegt die Sperre nur auf SQL-Ebene, nicht „letzter Owner → 409“ über den Handler (T8). In der README dokumentiert, sollte als bewusste Abweichung stehen bleiben   |

---

## Plankonformität

- **Wie geplant:** Endpunkte und Statuscodes, Security-Event-Typen und Metadaten, Owner-Lock, Rollen-Tab-Gate,
  Settings-UI mit Empty-States, permissionabhängige Lead-Aktionen, DE/EN-Dictionaries mit identischen Schlüsseln.
- **Nicht im Plan, aber sinnvoll:** `workspace-member-version-service`, `postgres-error-service`,
  `access-mutation-route`, `use-versioned-mutation`, `member-row`, `role-row`. Sie fehlen in der Verzeichnisstruktur
  von `02c` und erklären einen Teil der Dateiüberschreitung.
- **Zu Recht offen:** manueller A11y-Check im Browser (Tastatur, Mobil, Dark/Light) mit echter Clerk-Session.
