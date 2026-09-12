# Task 29 — Aktivität und History

> **Merge-Einheit:** Ordner 20 · **Branch:** `feat/crm-stunden-und-history`
> **Aufwand:** M · **Abhängigkeiten:** Task 05 (Slot); inhaltlich profitiert er von allen vorherigen Tasks
> **Migration:** keine

- Timeline liest die gemeinsame `activities`-Tabelle aus Task 01a mit stabiler Cursor-Pagination.
- Automatische Activities sind unveränderlich; manuelle Notizen dürfen nur über protokollierte
  Korrektur geändert werden.
- Credential-Reveal auditiert nur Actor, Datensatz und Aktion, nie Geheimwerte.
- Neue CRM-Schreibpfade müssen Activity und Fachwrite atomar beziehungsweise über eine definierte
  Outboxabsicht erzeugen.

## Context

Seit Task 01 schreiben alle Handler Aktivitäten: angelegt, Status gewechselt, aus Lead konvertiert,
Zugangsdaten aufgedeckt, Datei hochgeladen, Einreichung eingegangen. Angezeigt wurde davon bisher
nichts.

Dieser Task macht die Timeline sichtbar und ergänzt das, was noch fehlt: automatische Einträge bei
Feldänderungen. Damit ist am Kunden nachvollziehbar, wer wann was geändert hat — genau das, was bei
der Frage „seit wann steht hier diese Adresse" fehlt.

Bewusst spät eingeplant: Die Timeline ist erst dann wertvoll, wenn es etwas zu erzählen gibt.

## Entscheidungen

| Bereich                | Entscheidung                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Anzeige                | Sektion im Kundendetail, aufsteigend nach Neuheit, seitenweise nachladbar                                                                |
| Komponente             | Die geteilte Timeline aus Task 02a wird **benutzt**, nicht kopiert — sie bekommt Kundeneinträge, Typ-Symbole und Texte als Props         |
| Durchgehende Historie  | Die Abfrage ist `WHERE customer_id = $1` und enthält damit automatisch die Akquise-Historie des Ursprungs-Leads (Task 08 trägt sie nach) |
| Projektfilter          | Zusätzlich nach `project_id` filterbar — die Spalte existiert seit Task 01a, es braucht keine jsonb-Abfrage                              |
| Feldänderungen         | Ein gemeinsamer Helfer vergleicht alten und neuen Datensatz und schreibt einen Eintrag je geändertem Feld                                |
| Sensible Felder        | Von der Aufzeichnung ausgenommen: verschlüsselte Inhalte. Protokolliert wird „Zugangsdaten geändert", nie der Wert                       |
| Zusammenfassung        | Mehrere Feldänderungen aus einem Speichervorgang werden zu **einem** Eintrag mit Feldliste zusammengefasst, nicht zu acht                |
| Notizen                | Manuelle Notizen sind Aktivitäten vom Typ `note`, direkt in der Timeline erfassbar                                                       |
| Bearbeiten und Löschen | Nur eigene Notizen. Automatische Einträge sind unveränderlich — ein Protokoll, das sich ändern lässt, ist keines                         |
| Akteur                 | Anzeigename wird zum Zeitpunkt des Ereignisses mitgespeichert, damit der Verlauf lesbar bleibt                                           |
| Portal                 | Die Timeline ist rein intern und hat keinen Portal-Endpunkt                                                                              |
| Filter                 | Nach Typ filterbar (nur Notizen, nur Änderungen, nur Dateien)                                                                            |

## Architektur

```txt
GET /api/workspace/crm/customers/[id]/activities?cursor=…   Permission CustomersRead
POST /api/workspace/crm/customers/[id]/activities           Notiz anlegen
PATCH/DELETE /api/workspace/crm/activities/[activityId]     nur Typ note, nur eigene

recordFieldChanges(previous, next, { customerId, actor, entityLabel })
  → vergleicht die überwachten Felder
  → ein Activity-Eintrag mit metadata: { fields: [{ name, from, to }] }
  → wird von update-customer, update-project, update-contact … aufgerufen
```

Die Feldvergleichs-Funktion ist ein eigener, getesteter Baustein und keine in jedem Handler
wiederholte Schleife.

## Verzeichnisstruktur

```txt
apps/workspace/src/server/workspace/crm/
  query-handler/list-customer-activities.query-handler.ts
  command-handler/{create,update,delete}-customer-note.command-handler.ts
  services/record-field-changes.ts             baut auf activityService aus Task 01a auf
  services/tracked-fields.ts                   welche Felder überwacht werden
apps/workspace/src/app/api/workspace/crm/customers/[id]/activities/route.ts
apps/workspace/src/app/api/workspace/crm/activities/[activityId]/route.ts

apps/workspace/src/components/workspace/crm/activity/
  customer-activity-section/
  activity-timeline/
  activity-entry/
  activity-field-changes/
  activity-note-composer/
  activity-type-filter/
apps/workspace/src/i18n/dictionaries/workspace/crm/activity/{de,en}.json
```

## Tickets

### CRM-29-T1 — Feldvergleich

- **Files:** `services/record-field-changes.ts`, `services/tracked-fields.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - `appendActivity` existiert bereits seit Task 01a und wird von allen Handlern seit Task 04
    benutzt — hier ist **kein** Umstellen verstreuter Direkteinfügungen nötig
  - `recordFieldChanges` vergleicht nur die in `tracked-fields.ts` gelisteten Felder und schreibt
    das Ergebnis über `activityService.appendActivity`
  - Verschlüsselte und sensible Felder sind ausdrücklich ausgenommen; für sie wird nur die Tatsache
    einer Änderung vermerkt
  - Keine Änderung ergibt **keinen** Eintrag
- **Akzeptanz:**
  - Test: eine Änderung an einem nicht überwachten Feld erzeugt keinen Eintrag
  - Test: drei geänderte Felder ergeben einen Eintrag mit drei Feldern, nicht drei Einträge
  - Test: der Wert eines sensiblen Feldes taucht nirgends im Eintrag auf
  - Test: gleiche Werte erzeugen keinen Eintrag

### CRM-29-T2 — Feldänderungen in den Handlern verdrahten

- **Files:** `update-customer`, `update-project`, `update-customer-contact`,
  `update-customer-status`, `update-retainer`, `update-renewal` + deren Tests
- **Skills:** `best-practices`
- **Inhalt:** In jedem dieser Handler vor dem Schreiben den alten Stand laden und `recordFieldChanges`
  aufrufen; das Protokollieren darf die eigentliche Änderung nie scheitern lassen
- **Akzeptanz:**
  - Tests je Handler: die Änderung erzeugt genau einen Änderungseintrag
  - Test: ein Fehler beim Protokollieren bricht die Änderung nicht ab
  - Bestehende Handler-Tests bleiben grün

### CRM-29-T3 — Notizen

- **Files:** drei Command-Handler, zwei Routen, `activity-note-composer/**` + Tests
- **Skills:** `best-practices`, `frontend-design`, `accessibility`
- **Inhalt:**
  - Notiz mit Limit 20.000 Zeichen als `text`
  - Bearbeiten und Löschen nur für eigene Notizen und nur für den Typ `note`
  - Eingabefeld mit automatischer Höhe, Zeichenzähler ab 80 Prozent, Entwurf im `localStorage`
- **Akzeptanz:**
  - Test: eine automatische Aktivität lässt sich nicht bearbeiten (404)
  - Test: fremde Notiz lässt sich nicht bearbeiten
  - Entwurf überlebt das Neuladen

### CRM-29-T4 — Timeline

- **Files:** `list-customer-activities.query-handler.ts`, `activity-timeline/**`,
  `activity-entry/**`, `activity-field-changes/**`, `activity-type-filter/**`,
  `dictionaries/workspace/crm/activity/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`, `performance`
- **Inhalt:**
  - Zeitstrahl mit Typ-Symbol, Titel, Akteur und relativer Zeitangabe („vor 2 Stunden") mit dem
    genauen Zeitpunkt im `title`-Attribut
  - Feldänderungen als „Vorher → Nachher" dargestellt, lange Werte gekürzt mit Aufklappen
  - Tagesweise Gruppierung mit Datumstrennern
  - Seitenweises Nachladen über Cursor, standardmäßig 30 Einträge
  - Typfilter über URL-Parameter
  - Metadaten werden vor der Anzeige über Typ-Wächter geprüft, nicht blind umgedeutet (bestehendes Muster aus
    `lead-detail-activities`)
- **Akzeptanz:**
  - Test: unerwartete Metadaten führen zu einer verständlichen Zeile, nicht zu einem Absturz
  - Keine N+1-Abfrage
  - Relative Zeitangaben über die Locale
  - Tastaturbedienung vollständig, Nachladen kündigt sich über eine Live-Region an

## Deploy-Sicherheit

1. **Live sichtbar:** neue Sektion „Verlauf" im Kundendetail, ab sofort mit Einträgen zu
   Feldänderungen.
2. **Bricht nichts:** keine Migration — die Tabelle existiert seit Task 01 und wurde die ganze Zeit
   befüllt. Sechs bestehende Handler bekommen einen zusätzlichen, fehlertoleranten Aufruf; ihre
   Tests bleiben unverändert gültig. Ältere Daten haben keine Feldänderungseinträge, was ein
   gültiger Zustand ist — die Timeline beginnt einfach später.
3. **Offen:** nichts. Das Portal erhält bewusst keinen Zugriff auf den Verlauf.

## End-to-End-Akzeptanz

1. Die Timeline zeigt alle bisher gesammelten Ereignisse in umgekehrter Zeitfolge.
2. Eine Änderung an den Stammdaten erzeugt einen Eintrag mit Vorher- und Nachher-Werten.
3. Mehrere Felder aus einem Speichervorgang ergeben einen zusammengefassten Eintrag.
4. Kein Eintrag enthält den Wert eines Zugangsdatensatzes.
5. Notizen lassen sich erfassen, bearbeiten und löschen; automatische Einträge nicht.
6. Der Typfilter wirkt und steht in der URL.
7. Nachladen älterer Einträge funktioniert lückenlos.
8. Unerwartete Metadaten brechen die Anzeige nicht.
9. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
