# Task 02f — Zuständigkeiten übergeben

> **Merge-Einheit:** Ordner 22a · **Branch:** `feat/crm-kundenorganisation-und-uebergabe`
> **Aufwand:** M · **Abhängigkeiten:** Task 02d (Mitglieder-Lifecycle), Task 04 und Task 05 (Kundenakte)
> **Migration:** keine; `workspace_responsibilities_handed_over` ist seit Migration 0026 zulässig

## Kontext

Task 02d verhindert sicher, dass Mitglieder mit offenen Zuständigkeiten deaktiviert werden. Nach der Kundenakte ist
die zugrunde liegende Fachlichkeit erstmals sichtbar und realistisch prüfbar. Dieser Task ergänzt den noch fehlenden
domänenübergreifenden Flow:

- alle offenen Zuständigkeiten eines Mitglieds an ein anderes aktives Mitglied übergeben.

Der einzelne Customer-Owner-Wechsel ist bereits seit Ordner 20a verfügbar und überschreibt keine Kindentitäten. Bei
Umsetzung in Ordner 22a sind alle bis dahin besitzbaren Kunden-, Projekt-, Aufgaben-, Renewal- und Chat-Entitäten in
der exhaustiven Ownership-Registry registriert. Jede Domäne hat zuvor ihre individuelle Zuweisung und ihren
Registry-Eintrag geliefert.

## Entscheidungen

| Bereich        | Entscheidung                                                                                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Autorisierung  | Mitgliedsübergabe nutzt `members.manage`; das Ziel muss je Entität das in der Registry deklarierte Recht besitzen.                                                         |
| Zielmitglied   | Das Ziel braucht eine aktive Membership und einen aktiven User-Datensatz und muss sich von der Quelle unterscheiden.                                                       |
| Offene Kunden  | Nur `active` und `paused` werden übertragen; archivierte Kunden behalten ihre historische Zuordnung.                                                                       |
| Registry       | Der Counter-Vertrag aus Task 02d wird um Laden und versionierten Transfer erweitert und bleibt mit `satisfies Record<OwnableEntity, OwnershipAdapter>` exhaustive.         |
| Writes         | Jede betroffene versionierte Entität wird ausschließlich über `updateVersioned` geändert. Alle Writes laufen in einer gemeinsamen Transaktion.                             |
| Concurrency    | Der Adapter lädt IDs und Versionen vor dem Transfer. Ein paralleler Edit erzeugt 409 und rollt die vollständige Übergabe zurück.                                           |
| Deaktivierung  | Die Übergabe sperrt die Membership des Ziels (`FOR SHARE`) und prüft `active`; die Deaktivierung sperrt dieselbe Zeile vor der Zählung. Siehe Task 02d, „Bekannte Grenze“. |
| Activities     | Je übergebener Entität entsteht eine `field_change`-Activity mit Feld sowie alter und neuer Member-ID; keine Namen oder E-Mails in Metadaten.                              |
| Security-Event | Eine vollständige Mitgliedsübergabe erzeugt genau ein `workspace_responsibilities_handed_over`-Event mit Ziel-ID und Counts.                                               |
| UI             | Die Mitgliederverwaltung erhält „Zuständigkeiten übergeben“ und „Alles an mich“ samt Vorschau der betroffenen Counts.                                                      |
| Trennung       | Eine Übergabe deaktiviert das Quellmitglied nicht automatisch. Die Deaktivierung bleibt eine zweite bewusste Aktion.                                                       |

## Contracts und Endpunkte

### `POST /api/workspace/members/[id]/handover`

Body: `{ targetMemberId: string }`

Erfolg: Quelle, Ziel und vollständige `transferredCounts: Record<OwnableEntity, number>`.

Fachfehler: ungültiger Body, Quelle/Ziel fehlt, Ziel inaktiv, Quelle gleich Ziel, keine offenen Zuständigkeiten sowie
`VERSION_CONFLICT` mit der zuerst kollidierten Entität als aktuellem Minimal-DTO.

## Transaktionsablauf der Mitgliedsübergabe

1. Quelle und Ziel validieren; Ziel als aktiven User und aktives Mitglied laden.
2. Offene Zuständigkeiten je Registry-Adapter als deterministisch sortierte IDs und Versionen laden.
3. Bei insgesamt null Zuständigkeiten ohne Write als 409 abbrechen.
4. Jede Entität in stabiler Registry- und ID-Reihenfolge über `updateVersioned` übertragen.
5. Nach jedem erfolgreichen Write eine Activity über `activityService.createActivity` anlegen.
6. Genau ein Security-Event mit Ziel-ID und Counts schreiben.
7. Erst nach vollständigem Erfolg committen; jeder Konflikt rollt Writes, Activities und Event zurück.

## Tickets

### CRM-22a-T0 — Contracts und Ownership-Adapter erweitern

- Handover-Request/-Response, Result-Union und Übergabefehler ergänzen.
- Counter-Registry aus Task 02d zum vollständigen `OwnershipAdapter` erweitern.
- **Akzeptanz:** Eine neue `OwnableEntity` ohne vollständigen Adapter bricht den Typecheck.

### CRM-22a-T1 — Atomare Mitgliedsübergabe

- Handover-Command, Route, Fehlerabbildung und Client-Service implementieren.
- Pro übergebener Entität eine Activity und insgesamt genau ein Security-Event schreiben.
- **Akzeptanz:** aktive/pausierte Kunden wechseln Owner und Version; archivierte bleiben unverändert; Parallelkonflikt
  ergibt 409 ohne Teilzustand.

### CRM-22a-T2 — Mitglieder-UI

- Übergabedialog mit aktivem Zielmitglied und Schnellaktion „An mich übergeben“ ergänzen.
- Vorschau der betroffenen Counts nach Entitätstyp ergänzen.
- DE/EN, Loading-, Empty-, Konflikt- und Serverfehlerzustände vollständig umsetzen.
- **Akzeptanz:** keine inaktiven Ziele; Eingaben bleiben bei 409 erhalten; Tastatur, Fokus, Mobile, Dark und Light
  geprüft.

### CRM-22a-T3 — Integration und Abschluss

- Atomare Übergabe gegen parallele Edits verschiedener Entitätstypen mit echter DB testen.
- Activities, Security-Event, Counts, Rollback und PII-freie Metadaten prüfen.
- **Akzeptanz:** vollständige Qualitäts-Gates des Ordners 22a grün.

## Nicht Teil dieses Tasks

- Mitglieder aktivieren oder deaktivieren — Task 02d in Ordner 03c.
- Kunden-Owner einzeln ändern — Task 08a in Ordner 20a.
- Projekte, Aufgaben, Renewals oder Conversations vor ihrer jeweiligen Einführung registrieren.
- Automatische Deaktivierung nach erfolgreicher Übergabe.
- Historische Owner-Zuordnung archivierter Datensätze verändern.

## Rollback

Übergabeaktionen aus der Mitgliederverwaltung ausblenden. Bereits erfolgte Zuweisungen bleiben bestehen;
Activities und Security-Events dokumentieren sie vollständig. Der sichere Deaktivierungsblocker aus Task 02d bleibt
unabhängig davon aktiv.
