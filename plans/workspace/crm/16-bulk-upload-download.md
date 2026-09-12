# Task 16 — Bulk Upload und Download

> **Branch:** `feat/crm-dateien-bulk`
> **Aufwand:** M (rund ein Tag)
> **Abhängigkeiten:** Task 15
> **Migration:** keine

## Context

Der explizit wichtigste Teil des Dateibereichs: gebündelt hochladen und gebündelt herunterladen. Ein
Kunde schickt 40 Fotos, man braucht alle Assets eines Projekts in einem Rutsch auf der Platte.
Einzeln klicken ist hier keine Option.

Der Upload mehrerer Dateien funktioniert bereits seit Task 15 über die Warteschlange. Dieser Task
ergänzt die Mehrfachauswahl in der Liste, Sammelaktionen darauf und vor allem den ZIP-Download.

## Entscheidungen

| Bereich         | Entscheidung                                                                                                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ZIP-Erzeugung   | Serverseitig gestreamt, nicht im Browser                                                                                                                                                  |
| Begründung      | Im Browser müssten erst alle Dateien vollständig geladen werden — bei 500 MB Assets scheitert das am Arbeitsspeicher. Serverseitig wird jedes Objekt gelesen und sofort weitergeschrieben |
| Bibliothek      | `fflate` im Streaming-Modus, bereits in `apps/web` in Benutzung                                                                                                                           |
| Laufzeit        | `runtime = "nodejs"`, Antwort als Stream — kein vollständiges Puffern                                                                                                                     |
| Obergrenze      | 500 Dateien und 2 GB je Archiv; darüber eine verständliche Ablehnung mit Hinweis, die Auswahl zu verkleinern                                                                              |
| Namenskonflikte | Gleichnamige Dateien im Archiv bekommen ein Zählsuffix (`logo.png`, `logo (2).png`)                                                                                                       |
| Ordnerstruktur  | Im Archiv nach Kategorie gruppiert, damit das Entpacken sinnvoll aussieht                                                                                                                 |
| Teilfehler      | Eine unlesbare Datei bricht das Archiv nicht ab; sie wird als `_FEHLENDE-DATEIEN.txt` im Archiv dokumentiert                                                                              |
| Auswahlzustand  | React-Context, zurückgesetzt beim Wechsel von Kunde oder Filter (Muster: `leads-table-selection-provider`)                                                                                |

## Architektur

```txt
POST /api/workspace/crm/files/archive
  → withPermission(FilesRead)
  → zod: fileIds[] (max 500)
  → alle Zeilen laden, Zugehörigkeit zu EINEM Kunden prüfen
  → Gesamtgröße prüfen
  → ZIP-Stream öffnen
      für jede Datei: storage.get(key) → in den Stream
      Fehler je Datei: sammeln, weitermachen
  → falls Fehler: _FEHLENDE-DATEIEN.txt anhängen
  → Response mit Content-Disposition: attachment
```

Die Prüfung „alle Dateien gehören demselben Kunden" ist eine Sicherheitsgrenze: Ohne sie könnte eine
manipulierte Anfrage mit geratenen IDs Dateien mehrerer Kunden in ein Archiv mischen.

## Verzeichnisstruktur

```txt
apps/workspace/src/app/api/workspace/crm/files/archive/route.ts
apps/workspace/src/server/workspace/crm/
  command-handler/create-file-archive.command-handler.ts
  services/file-archive-service.ts
  services/archive-filename-service.ts        Konfliktauflösung
apps/workspace/src/components/workspace/crm/files/
  file-selection-provider/                    + -context.ts
  file-selection-toolbar/
  file-select-all-checkbox/
apps/workspace/src/client/crm/file-archive-service.ts
apps/workspace/src/i18n/dictionaries/workspace/crm/files/{de,en}.json   + Bulk-Texte
```

## Tickets

### CRM-16-T1 — Archiv-Service

- **Files:** `services/file-archive-service.ts`, `services/archive-filename-service.ts` + Tests
- **Skills:** `best-practices`, `performance`
- **Inhalt:**
  - Streaming-ZIP über `fflate`; jedes Objekt wird gelesen und sofort geschrieben, nie alles zugleich
    im Speicher gehalten
  - Konfliktauflösung für gleiche Dateinamen, Gruppierung nach Kategorie als Ordner
  - Fehlerhafte Dateien werden gesammelt und als Textdatei angehängt
- **Akzeptanz:**
  - Test gegen den In-Memory-Adapter: Archiv enthält alle Dateien in der erwarteten Struktur
  - Test: drei gleichnamige Dateien ergeben drei unterschiedliche Einträge
  - Test: eine fehlende Datei führt zu einem gültigen Archiv plus Hinweistextdatei
  - Der Speicherverbrauch wächst nicht mit der Gesamtgröße (im Test über die Anzahl gleichzeitig
    gehaltener Puffer nachgewiesen)

### CRM-16-T2 — Archiv-Route

- **Files:** `api/workspace/crm/files/archive/route.ts`,
  `command-handler/create-file-archive.command-handler.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - `runtime = "nodejs"`, Antwort als Stream
  - Grenzen prüfen, Zugehörigkeit zu einem einzigen Kunden erzwingen
  - Dateiname des Archivs: `<Firma>-<Bereich>-<Datum>.zip`, bereinigt
- **Akzeptanz:**
  - Tests: 401/404/403; über 500 Dateien wird abgelehnt; Dateien zweier Kunden werden abgelehnt
  - `Content-Disposition` enthält einen korrekt kodierten Dateinamen mit Umlauten

### CRM-16-T3 — Mehrfachauswahl

- **Files:** `file-selection-provider/**`, `file-selection-toolbar/**`,
  `file-select-all-checkbox/**`, Einbindung in Raster und Liste
- **Skills:** `frontend-design`, `accessibility`
- **Inhalt:**
  - Auswahlkästchen in beiden Ansichten, Alle-auswählen mit unbestimmtem Zustand
  - Umschaltleiste erscheint bei Auswahl: „N ausgewählt", Aktionen Herunterladen und Löschen
  - Bereichsauswahl mit Umschalttaste
  - Auswahl wird bei Wechsel von Kunde, Projekt oder Filter geleert
- **Akzeptanz:**
  - Vollständig per Tastatur bedienbar, Auswahlanzahl über Live-Region angekündigt
  - Alle-auswählen zeigt den unbestimmten Zustand korrekt
  - Leiste überlagert keine Inhalte auf Mobil

### CRM-16-T4 — Download-Auslösung und Sammel-Löschen

- **Files:** `client/crm/file-archive-service.ts`, Sammel-Löschen im Handler und in der Leiste
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Download mit Ladezustand („Archiv wird erstellt …"), da bei vielen Dateien Sekunden vergehen
  - Sammel-Löschen mit Bestätigung, die Anzahl und Gesamtgröße nennt
  - Fehlerfall verständlich: „12 von 40 Dateien konnten nicht gelesen werden"
- **Akzeptanz:**
  - Während der Erstellung ist der Button deaktiviert, kein Doppelklick möglich
  - Abbruch der Verbindung hinterlässt keine kaputte Datei-Liste im UI
  - Alle Texte in DE und EN

## Deploy-Sicherheit

1. **Live sichtbar:** Auswahlkästchen im Dateibereich und eine Umschaltleiste mit Herunterladen und
   Löschen.
2. **Bricht nichts:** keine Migration. Der Einzeldownload aus Task 15 bleibt unverändert. `fflate`
   ist im Monorepo bereits im Einsatz, es kommt keine unbekannte Abhängigkeit hinzu.
3. **Offen:** nichts innerhalb dieses Features. Der Kunden-Upload über das Portal (Task 22) nutzt
   später denselben Datei-Backend-Pfad.

## End-to-End-Akzeptanz

1. Mehrere Dateien lassen sich auswählen, auch über Bereichsauswahl mit der Umschalttaste.
2. Der ZIP-Download liefert ein gültiges Archiv mit allen Dateien, nach Kategorie sortiert.
3. Gleichnamige Dateien erhalten unterscheidbare Namen im Archiv.
4. Eine unlesbare Datei verhindert das Archiv nicht, wird aber darin dokumentiert.
5. Mehr als 500 Dateien oder über 2 GB werden verständlich abgelehnt.
6. Ein Archiv über Dateien zweier Kunden ist nicht erzeugbar.
7. Sammel-Löschen entfernt alle ausgewählten Dateien aus Liste und Speicher.
8. Ein Archiv aus rund 300 MB Dateien lässt der Serverspeicher nicht anwachsen.
9. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
