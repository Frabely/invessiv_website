# Task 02f — Zuständigkeiten übergeben

> **Merge-Einheit:** Ordner 05 · **Branch:** `feat/crm-kundenliste-und-zuweisung`
> **Aufwand:** M · **Abhängigkeiten:** Task 02d (Mitglieder-Lifecycle), Task 04 und Task 05 (Kundenakte)
> **Migration:** keine; `workspace_responsibilities_handed_over` ist seit Migration 0026 zulässig

## Kontext

Task 02d verhindert sicher, dass Mitglieder mit offenen Zuständigkeiten deaktiviert werden. Nach der Kundenakte ist
die zugrunde liegende Fachlichkeit erstmals sichtbar und realistisch prüfbar. Dieser Task ergänzt deshalb zwei
zusammengehörige Flows:

- alle offenen Zuständigkeiten eines Mitglieds an ein anderes aktives Mitglied übergeben;
- den Owner eines einzelnen Kunden wechseln.

Beide Flows verwenden dieselbe exhaustive Ownership-Registry. In Ordner 05 ist ausschließlich `customer` registriert.
Projekte, Aufgaben und Renewals erweitern die Registry später in ihren jeweiligen Merge-Einheiten.

## Entscheidungen

| Bereich        | Entscheidung                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Autorisierung  | Mitgliedsübergabe nutzt `members.manage`; Customer-Owner-Wechsel nutzt die in Ordner 04 eingeführte Schreibpermission.                                             |
| Zielmitglied   | Das Ziel braucht eine aktive Membership und einen aktiven User-Datensatz und muss sich von der Quelle unterscheiden.                                               |
| Offene Kunden  | Nur `active` und `paused` werden übertragen; archivierte Kunden behalten ihre historische Zuordnung.                                                               |
| Registry       | Der Counter-Vertrag aus Task 02d wird um Laden und versionierten Transfer erweitert und bleibt mit `satisfies Record<OwnableEntity, OwnershipAdapter>` exhaustive. |
| Writes         | Jede betroffene versionierte Entität wird ausschließlich über `updateVersioned` geändert. Alle Writes laufen in einer gemeinsamen Transaktion.                     |
| Concurrency    | Der Adapter lädt IDs und Versionen vor dem Transfer. Ein paralleler Edit erzeugt 409 und rollt die vollständige Übergabe zurück.                                   |
| Activities     | Je übergebener Entität entsteht eine `field_change`-Activity mit Feld sowie alter und neuer Member-ID; keine Namen oder E-Mails in Metadaten.                      |
| Security-Event | Eine vollständige Mitgliedsübergabe erzeugt genau ein `workspace_responsibilities_handed_over`-Event mit Ziel-ID und Counts.                                       |
| UI             | Die Mitgliederverwaltung erhält „Zuständigkeiten übergeben“ und „Alles an mich“; die Kundenakte erhält den einzelnen Owner-Wechsel.                                |
| Trennung       | Eine Übergabe deaktiviert das Quellmitglied nicht automatisch. Die Deaktivierung bleibt eine zweite bewusste Aktion.                                               |

## Contracts und Endpunkte

### `POST /api/workspace/members/[id]/handover`

Body: `{ targetMemberId: string }`

Erfolg: Quelle, Ziel und vollständige `transferredCounts: Record<OwnableEntity, number>`.

Fachfehler: ungültiger Body, Quelle/Ziel fehlt, Ziel inaktiv, Quelle gleich Ziel, keine offenen Zuständigkeiten sowie
`VERSION_CONFLICT` mit der zuerst kollidierten Entität als aktuellem Minimal-DTO.

### Customer-Owner-Wechsel

Der bestehende Customer-Update-Contract aus Ordner 04 wird für einen expliziten Owner-Wechsel wiederverwendet oder um
einen getrennten, typisierten Endpoint ergänzt. Die Entscheidung fällt zu Beginn von Ordner 05 anhand des tatsächlich
gemergten Customer-Commands; es entsteht keine zweite konkurrierende Update-Pipeline.

## Transaktionsablauf der Mitgliedsübergabe

1. Quelle und Ziel validieren; Ziel als aktiven User und aktives Mitglied laden.
2. Offene Zuständigkeiten je Registry-Adapter als deterministisch sortierte IDs und Versionen laden.
3. Bei insgesamt null Zuständigkeiten ohne Write als 409 abbrechen.
4. Jede Entität in stabiler Registry- und ID-Reihenfolge über `updateVersioned` übertragen.
5. Nach jedem erfolgreichen Write eine Activity über `activityService.createActivity` anlegen.
6. Genau ein Security-Event mit Ziel-ID und Counts schreiben.
7. Erst nach vollständigem Erfolg committen; jeder Konflikt rollt Writes, Activities und Event zurück.

## Tickets

### CRM-05-T0 — Contracts und Ownership-Adapter erweitern

- Handover-Request/-Response, Result-Union und Übergabefehler ergänzen.
- Counter-Registry aus Task 02d zum vollständigen `OwnershipAdapter` erweitern.
- **Akzeptanz:** Eine neue `OwnableEntity` ohne vollständigen Adapter bricht den Typecheck.

### CRM-05-T1 — Atomare Mitgliedsübergabe

- Handover-Command, Route, Fehlerabbildung und Client-Service implementieren.
- Pro Customer eine Activity und insgesamt genau ein Security-Event schreiben.
- **Akzeptanz:** aktive/pausierte Kunden wechseln Owner und Version; archivierte bleiben unverändert; Parallelkonflikt
  ergibt 409 ohne Teilzustand.

### CRM-05-T2 — Customer-Owner-Wechsel

- Einzelnen Owner-Wechsel in Customer-Command, API und Kundenakte integrieren.
- Spätere Kindentitäten über denselben Registry-Mechanismus mitführen.
- **Akzeptanz:** aktueller Customer und alle zu diesem Zeitpunkt registrierten offenen Kinder wechseln atomar.

### CRM-05-T3 — Mitglieder- und Kunden-UI

- Übergabedialog mit aktivem Zielmitglied und Schnellaktion „An mich übergeben“ ergänzen.
- Customer-Owner-Auswahl mit Vorschau der betroffenen Counts ergänzen.
- DE/EN, Loading-, Empty-, Konflikt- und Serverfehlerzustände vollständig umsetzen.
- **Akzeptanz:** keine inaktiven Ziele; Eingaben bleiben bei 409 erhalten; Tastatur, Fokus, Mobile, Dark und Light
  geprüft.

### CRM-05-T4 — Integration und Abschluss

- Atomare Übergabe gegen parallelen Customer-Edit mit echter DB testen.
- Activities, Security-Event, Counts, Rollback und PII-freie Metadaten prüfen.
- **Akzeptanz:** vollständige Qualitäts-Gates des Ordners 05 grün.

## Nicht Teil dieses Tasks

- Mitglieder aktivieren oder deaktivieren — Task 02d in Ordner 03c.
- Projekte, Aufgaben und Renewals vor ihrer jeweiligen Einführung registrieren.
- Automatische Deaktivierung nach erfolgreicher Übergabe.
- Historische Owner-Zuordnung archivierter Datensätze verändern.

## Rollback

Übergabeaktionen aus Mitgliederverwaltung und Kundenakte ausblenden. Bereits erfolgte Zuweisungen bleiben bestehen;
Activities und Security-Events dokumentieren sie vollständig. Der sichere Deaktivierungsblocker aus Task 02d bleibt
unabhängig davon aktiv.
