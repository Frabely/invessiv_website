# 02 — Server-Zuarbeit für die Zugriffs-UI

> **Ordner:** 07c · **Aufwand:** M · **Hängt ab von:** — · **Blockiert:** 03, 05, 06, 07, 08
> **Migration:** keine

## Warum

Die Schreib- und Lesewege für gebundene Rollen existieren, liefern aber nur Fremdschlüssel.
`WorkspaceMemberAccessScopeDto` trägt weder das Mitglied noch Anzeigenamen. Damit ist der Abschnitt
„Zugriff" in der Kundenakte („wer hat hier welche Rolle") **technisch nicht baubar**, und jede Liste müsste
Namen im Client nachladen. Dieser Task schließt die Lücke, bevor UI darauf gesetzt wird — Ordner-Regel:
keine UI auf unvollständige Handler.

## Umfang

### 1. Mitglied im Scope-DTO

`packages/common/src/contracts/auth/workspace-member-access-scope.dto.ts` erhält `workspaceMemberId`.
Ohne dieses Feld ist eine Liste je Kunde nicht zuordenbar. Docstring benennt ausdrücklich, dass es die
`workspace_members.id` ist und nicht die `users.id`.

### 2. Read-Model mit Anzeigedaten

Neues DTO `packages/common/src/contracts/auth/access-scope-entry.dto.ts`:

| Feld                                                | Inhalt                                                    |
| --------------------------------------------------- | --------------------------------------------------------- |
| `id`                                                | Zuweisungs-Id, adressiert Mutationen                      |
| `workspaceMemberId`, `memberDisplayName`            | Wer                                                       |
| `roleId`, `roleName`, `roleSystemKey`, `roleActive` | Welche Rolle; `systemKey` für die Dictionary-Beschriftung |
| `scope`                                             | bestehende `AccessScopeDto`-Union                         |
| `customerNumber`, `customerDisplayName`             | Wo, Kundenebene                                           |
| `projectTitle`                                      | Wo, Projektebene; `null` bei Kundenbindung                |
| `assignedByUserId`, `assignedAt`                    | Herkunft der Zuweisung                                    |

`WorkspaceMemberAccessScopeDto` bleibt als schmales Command-Ergebnis bestehen; das Read-Model ist der
Listen-Typ. Beide nebeneinander zu halten ist billiger, als das Command-Ergebnis mit Joins zu belasten.

Umsetzung:

- `access-scope-read-service.ts` joint `roles`, `customers`, `projects` und `workspace_members`.
- Row-Shape nach `packages/common/src/contracts/auth/rows/`.
- Mapping in eigener `access-scope-entry-mapping-service.ts` — Mapping gehört nie inline in den
  Query-Handler (`src/server/AGENTS.md`).
- Sortierung: Kundenname, dann Projekte, dann Rollenname. Stabil, damit die Baumdarstellung nicht springt.

### 3. Zähler am Mitglied

`WorkspaceMemberDto` erhält die Anzahl gebundener Zuweisungen. Der Wert wird in
`workspace-member-read-service.ts` mitgeladen, nicht nachgezählt. Docstring: reine Anzeige, autorisiert nie.

`hasActiveRole` berücksichtigt gebundene Rollen bereits über `memberActiveAccessService` — prüfen und im
Test festhalten, nicht neu bauen.

### 4. Kunden-Lookup für den Picker

Eigener Query-Handler unter `server/workspace/access/query-handler/`, getrennt von `listCustomers`.

- Gate: `members.manage`.
- **Bewusst nicht scope-gefiltert.** Begründung, die in die `AGENTS.md` des Ordners wandert:
  `members.manage` ist ein nicht delegierbares Verwaltungsrecht. Wer Zugriffe vergibt, muss jeden Kunden
  benennen können — sonst kann ein Verwalter ohne `customers.read` niemandem Zugriff geben. Der CRM-Filter
  aus Task 37 bleibt davon unberührt, weil dieser Weg **nie** CRM-Daten liefert.
- Rückgabe ausschließlich `id`, `customerNumber`, `displayName`. Keine Ansprechpartner, keine Adressen,
  keine Kennzahlen, keine Zugangsdaten.
- Suche auf Anzeigename und Kundennummer, Begrenzung über `AccessFieldLimits`.
- Route unter `api/workspace/members/…` oder `api/workspace/access/…` — **nicht** unter `crm/`, damit die
  Endpunkt-Registry `CRM_ENDPOINT_ACCESS_RULES` nicht mit einem Nicht-CRM-Pfad vermischt wird.

### 5. Projekte je Kunde für den Baum

Die bestehende Route `api/workspace/crm/customers/[id]/projects` wird genutzt. Zu prüfen: Sie ist
scope-gefiltert. Für einen Verwalter ohne CRM-Zugriff liefert sie nichts. Ergibt die Prüfung, dass das
zutrifft, wird die Projektliste analog zu Punkt 4 als schmaler Lookup unter `access/` ergänzt (`id`, `title`,
`customerId`) statt den CRM-Filter aufzuweichen. **Diese Entscheidung wird beim Umsetzen
belegt, nicht geraten.**

## Umsetzungsstand

**Umgesetzt.** Abweichungen und Befunde beim Bauen:

- **Projekt-Lookup war nötig.** Punkt 5 ist belegt: `listProjectsByCustomer` filtert über
  `accessScope(actor, Permission.ProjectsRead)`; ein Verwalter ohne `projects.read` bekäme dort nichts. Der schmale
  Lookup unter `access/` ist deshalb gebaut (`GET …/access/customers/[id]/projects`).
- **Suche als `GET …?search=`**, nicht als POST. Die Clerk-Suche läuft nur wegen E-Mail-Adressen als POST; die
  CRM-Kundensuche übergibt `search` per Query. Der Lookup folgt der CRM-Konvention.
- **`hasActiveRole` war schon richtig, der Zähler nicht vorhanden.** Der Mapper bekommt jetzt die gebundenen Zeilen
  samt Rollenstatus statt eines `Set` und leitet Zähler **und** aktive Rolle daraus ab. Der Zähler zählt auch
  Zuweisungen inaktiver Rollen (der Dialog listet sie), `hasActiveRole` nur aktive.
- **Endpunkt-Konstante und Pfad-Helfer sind schon hier entstanden** (`WorkspaceApiEndpoint.AccessCustomers`,
  `accessCustomerProjectsEndpoint`), weil die Routen sie brauchen. Task 03 nutzt sie nur noch.
- **Die bestehenden `GET`-Listen liefern jetzt `AccessScopeEntryDto`** statt des schlanken DTO. Sie hatten noch
  keinen Konsumenten.
- **Gegen die Entwicklungsdatenbank belegt:** `access-scope-read.integration.test.ts` (10 Tests: Joins, Sortierung,
  Zähler, Lookup) läuft grün. Er ist Teil von `db:smoke:access`, gesperrt hinter `RBAC_DB_INTEGRATION`, und räumt
  seine Fixture-Zeilen wieder ab (nach dem Lauf geprüft: keine Reste).
- **Projekt-Lookup ohne Limit und ohne Existenzprüfung, mit Absicht.** Ein Limit würde Projekte im Baum still
  abschneiden; ein Kunde hat realistisch wenige. Eine unbekannte Kunden-Id liefert eine leere Liste statt 404, weil
  der CRM-Pfad keinen Löschpfad hat und die Id vom Picker selbst stammt.
- **Nummernsuche listet den exakten Treffer zuerst.** Die Suche bleibt ein Teilstring-Treffer (`"12"` findet auch 112),
  aber bei rein numerischer Eingabe steht die Kundennummer mit genau diesem Wert vorn. Sonst fällt sie bei 25
  Treffern in Namensreihenfolge aus dem Ergebnis; der Integrationstest belegt das mit einem Köder-Kunden. Der Helfer
  `parseExactCustomerNumber` ignoriert Werte außerhalb des Integer-Bereichs, statt die Abfrage scheitern zu lassen.
- **Offen, nicht Teil dieses Tasks:** Der Lookup filtert nicht nach Kundenstatus — archivierte Kunden erscheinen im
  Picker. Ob das gewollt ist, entscheidet Task 05, wo die Anzeige entsteht.
- **`"K0012"` findet nichts**, nur `"12"` — wie die CRM-Kundenliste. Eine gemeinsame Normalisierung wäre eine Änderung
  an beiden Stellen.

## Sicherheit

- Kein Handler nimmt eine `customerId` aus der Anfrage, um daraus Rechte abzuleiten — die Lookups sind rein
  lesend und liefern nur Kennung und Bezeichnung.
- Security-Events bleiben unverändert; dieser Task ändert keinen Schreibweg.
- Keine E-Mail-Adressen in den Lookup-Antworten, keine PII in Logs.

## Tests

- Mapping-Service-Test unter `src/server/tests/workspace/access/services/` mit allen Feldern, `projectTitle`
  ist `null` bei Kundenbindung, inaktive Rolle wird als solche gemeldet.
- Query-Handler-Tests unter `src/server/tests/workspace/access/query-handler/` (der Ordner ist heute leer).
- Route-Test für den Kunden-Lookup: 401 ohne Session, 403 ohne `members.manage`, Erfolgsfall liefert **ausschließlich**
  die drei erlaubten Felder.
- Test, dass der Lookup auch für einen Actor ohne `customers.read` Treffer liefert — das ist der Kern der
  Entscheidung und darf nicht still verloren gehen.

## Akzeptanz

- Eine Liste je Kunde nennt Mitglied und Rolle ohne Nachladen im Client.
- Der Zähler am Mitglied stimmt mit der Anzahl Zeilen im Zugriffs-Dialog überein.
- Der Kunden-Lookup gibt keine CRM-Inhalte preis; der Negativtest belegt es feldweise.

## Regelergänzung

`src/server/workspace/access/AGENTS.md`: Der Kunden- und Projekt-Lookup der Zugriffsverwaltung ist bewusst
nicht scope-gefiltert, liefert nur Kennung, Nummer und Bezeichnung und liegt nie unter einem CRM-Pfad.
