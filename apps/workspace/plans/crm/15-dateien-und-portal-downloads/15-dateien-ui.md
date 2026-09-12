# Task 15 — Dateien UI

> **Verbindliche Revision 2026:** Gehört zu Merge-Einheit 15. Es gibt keine Bildvorschauen oder
> Raster, weil Version 1 ausschließlich Dokumente erlaubt.

## Verbindliche Revision

- Flache Listenansicht mit Kategorie, Name, Größe, Typ, Datum, Uploader, Inspectionstatus und
  Portalfreigabe.
- PDF darf in sicherem Overlay angesehen werden; TXT als Plaintext; Office nur Download.
- Neue Dateien sind intern. Freigabe ist eigene versionierte Mutation und wird auditiert.
- Keine Ordner, Versionen, Bilder, Bildannotation oder Dateikommentare.
- Portalquery filtert `visible_to_customer` vor DTO-Erstellung und signiert erst danach.
- Branch `feat/crm-dateien-und-portal-downloads`.

> **Branch:** `feat/crm-dateien-ui`
> **Aufwand:** L (rund zwei Tage)
> **Abhängigkeiten:** Task 14
> **Migration:** keine

## Context

Die Oberfläche über dem Datei-Backend: Dateibereich im Kundendetail und in der Projektkarte,
Drag-and-drop-Upload mit Fortschritt, Liste mit Vorschau, Einzeldownload und Löschen.

Design-Anspruch: Das ist der Bereich, in dem am häufigsten gearbeitet wird. Eine generische
Tabellenzeile mit Büroklammer-Symbol reicht nicht — Bilder brauchen sichtbare Vorschaubilder, sonst
sucht man Dateinamen statt Inhalte.

## Entscheidungen

| Bereich        | Entscheidung                                                                                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Darstellung    | Umschaltbar zwischen Raster (mit Vorschaubildern) und Liste (mit Details). Auswahl merkt sich pro Nutzer im `localStorage`                                                 |
| Vorschaubilder | Über `next/image` direkt von der signierten URL; die Blob-Domain steht seit Task 13 in `images.remotePatterns`                                                             |
| Vorschau       | Bilder und PDF in einem Overlay; alle anderen Typen zeigen ein Typ-Symbol und bieten Download                                                                              |
| Gruppierung    | Nach Kategorie (Material vom Kunden, Ergebnisse, Einreichungen, intern)                                                                                                    |
| Freigabe       | Schalter „Für den Kunden sichtbar" je Datei und als Sammelaktion; steuert `visible_to_customer` und damit die Portal-Downloads aus Task 22                                 |
| Kennzeichnung  | Freigegebene Dateien sind in Raster und Liste eindeutig markiert (Symbol **plus** Beschriftung, nicht nur Farbe) — bei einer Freigabe an Dritte darf kein Zweifel bestehen |
| Upload         | Drag-and-drop auf den Bereich plus klassischer Dateiauswahl-Button — beides, nie nur Drag-and-drop                                                                         |
| Fortschritt    | Pro Datei eine Zeile mit Fortschritt, Abbrechen und bei Fehlern Erneut versuchen                                                                                           |
| Löschen        | Mit Bestätigung, die den Dateinamen nennt                                                                                                                                  |
| Signierte URLs | Werden erst beim Bedarf geholt, nicht für die ganze Liste im Voraus                                                                                                        |

## Architektur

```txt
Server Component lädt listFiles(...) und rendert die Liste ohne URLs.
Client holt eine signierte URL erst,
  - wenn ein Vorschaubild in den Sichtbereich scrollt (IntersectionObserver), oder
  - wenn Vorschau oder Download angefordert werden.
```

Damit werden bei 200 Dateien nicht 200 URLs signiert, und abgelaufene URLs sind kein Problem, weil
sie stets frisch geholt werden.

## Verzeichnisstruktur

```txt
apps/workspace/src/components/workspace/crm/files/
  customer-files-section/
  file-grid/
  file-grid-item/
  file-list/
  file-list-row/
  file-drop-zone/
  file-upload-queue/
  file-preview-overlay/
  file-type-icon/
  services/file-url-service.ts
apps/workspace/src/hooks/workspace/crm/
  use-file-upload-queue.ts
  use-signed-file-url.ts
apps/workspace/src/i18n/dictionaries/workspace/crm/files/{de,en}.json
```

## Tickets

### CRM-15-T1 — Ablagezone und Upload-Warteschlange

- **Files:** `file-drop-zone/**`, `file-upload-queue/**`, `hooks/.../use-file-upload-queue.ts`
- **Skills:** `frontend-design`, `accessibility`
- **Inhalt:**
  - Ablagezone mit sichtbarem Zustand beim Überziehen, dazu ein echter Dateiauswahl-Button
  - Warteschlange mit begrenzter Parallelität (drei gleichzeitig), Fortschritt je Datei
  - Abbrechen je Datei und für alle; Erneut-Versuchen bei fehlgeschlagenen
  - Ablehnungsgründe direkt an der Datei („zu groß", „Dateityp nicht erlaubt"), nicht als
    Sammelmeldung
  - Die Prüfung passiert auch im Browser vor dem Ticket — eine 500-MB-Datei soll nicht erst nach dem
    Serveraufruf scheitern
- **Akzeptanz:**
  - Upload per Tastatur auslösbar, Fortschritt über eine Live-Region angekündigt
  - Warteschlange überlebt einen Fehler einzelner Dateien, die übrigen laufen weiter
  - Verlassen der Seite bei laufendem Upload warnt

### CRM-15-T2 — Raster, Liste, Typ-Symbole

- **Files:** `file-grid/**`, `file-grid-item/**`, `file-list/**`, `file-list-row/**`,
  `file-type-icon/**`, `hooks/.../use-signed-file-url.ts`, `services/file-url-service.ts`
- **Skills:** `frontend-design`, `performance`, `accessibility`
- **Inhalt:**
  - Raster mit Vorschaubildern für Bilder, Typ-Symbol sonst; Liste mit Name, Größe, Typ, Datum,
    Uploader
  - Nachladen der Vorschaubilder erst im Sichtbereich, Platzhalter in fester Größe (kein
    Layout-Sprung)
  - Ansichtswahl in `localStorage`, mit `try/catch` abgesichert (private Fenster, blockierter Speicher)
  - Dateigröße und Datum über die Locale formatiert
- **Akzeptanz:**
  - Bei 200 Dateien werden nur die sichtbaren URLs signiert (im Netzwerk-Tab nachweisbar)
  - Kein Layout-Sprung beim Laden der Vorschaubilder
  - Blockierter `localStorage` führt nicht zu einem Fehler, nur zur Standardansicht

### CRM-15-T3 — Vorschau-Overlay

- **Files:** `file-preview-overlay/**`
- **Skills:** `frontend-design`, `accessibility`
- **Inhalt:**
  - Bilder und PDF im Overlay, Blättern mit Pfeiltasten, Schließen mit Escape
  - Kopfzeile mit Dateiname und den Aktionen Download und Löschen
  - Nicht darstellbare Typen zeigen Symbol, Name, Größe und Download-Button
- **Akzeptanz:**
  - Fokusfalle aktiv, Fokus kehrt nach dem Schließen auf die auslösende Kachel zurück
  - Blättern springt nicht über Dateien, die keine Vorschau haben
  - Auf Mobil bildschirmfüllend und ohne horizontales Scrollen

### CRM-15-T4 — Sektion und Verdrahtung

- **Files:** `customer-files-section/**`, Einbindung in Detail-Panel und Projektkarte,
  `dictionaries/workspace/crm/files/{de,en}.json`
- **Skills:** `frontend-design`, `copywriting`, `accessibility`
- **Inhalt:**
  - Gruppierung nach Kategorie mit Anzahl je Gruppe
  - Beim Upload im Projektkontext wird die Kategorie sinnvoll vorbelegt
  - Freigabe-Schalter je Datei; beim Umschalten eine kurze Rückmeldung, was der Kunde jetzt sieht
  - Leerer Zustand, der erklärt, wofür der Bereich gedacht ist, statt nur „Keine Dateien"
  - Löschbestätigung nennt den Dateinamen
- **Akzeptanz:**
  - Dateien landen am richtigen Besitzer (Kunde oder Projekt)
  - Nach dem Upload erscheint die Datei ohne manuelles Neuladen
  - Die Freigabe ist ohne Farbwahrnehmung erkennbar und per Tastatur umschaltbar
  - Neu hochgeladene Dateien sind standardmäßig **nicht** freigegeben
  - Alle Texte in DE und EN

## Deploy-Sicherheit

1. **Live sichtbar:** neuer Dateibereich im Kundendetail und in der Projektkarte, voll funktionsfähig.
2. **Bricht nichts:** keine Migration, keine Änderung bestehender Handler. Ohne konfigurierten
   Storage zeigt der Bereich einen klaren Hinweis statt eines Absturzes — der Upload-Button ist dann
   deaktiviert und beschriftet.
3. **Offen:** Mehrfachauswahl und ZIP-Download (Task 16). In diesem Task gibt es bewusst noch keine
   Auswahlkästchen, also auch keine Aktion ohne Wirkung.

## End-to-End-Akzeptanz

1. Dateien lassen sich per Drag-and-drop und per Dateiauswahl hochladen, mehrere gleichzeitig.
2. Der Fortschritt ist je Datei sichtbar, Abbrechen und Erneut-Versuchen funktionieren.
3. Zu große oder unerlaubte Dateien werden mit Begründung abgelehnt, bevor sie hochgeladen werden.
4. Bilder zeigen Vorschaubilder, andere Typen ein passendes Symbol.
5. Vorschau für Bilder und PDF funktioniert inklusive Blättern und Tastaturbedienung.
6. Download liefert die Originaldatei mit korrektem Namen.
7. Löschen entfernt die Datei aus Liste und Speicher.
8. Bei 200 Dateien bleibt die Seite flüssig; nur sichtbare Vorschaubilder werden geladen.
9. Dark und Light korrekt, mobil ab 360 px ohne horizontales Scrollen.
10. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
