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
