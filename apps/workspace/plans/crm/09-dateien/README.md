# Ordner 09 — Dateien

> **Merge-Einheit 9 von 16** · **Aufwand:** ~6 Tage · **Review-Umfang:** geschätzt ~120 Dateien
> **Setzt voraus:** Ordner 01, 02, 03, 06 (Projekte)
> **Migrationen:** `0029_create_files`

## Ziel

Im Monorepo existiert bisher **keine** Datei-Persistenz. Dieser Ordner legt sie an: Storage-Adapter,
Metadatenschicht, Oberfläche mit Drag-and-drop und Vorschau, gebündelter Upload und ZIP-Download.

Voraussetzung für den Kunden-Upload in Ordner 10.

## Tasks in Umsetzungsreihenfolge

| Task | Datei                              | Aufwand | Inhalt                                                  |
| ---- | ---------------------------------- | ------- | ------------------------------------------------------- |
| 13   | `13-storage-adapter.md`            | M       | `packages/storage`, Vercel-Blob- und In-Memory-Adapter  |
| 14   | `14-dateien-datenmodell-upload.md` | L       | `files` mit echten Fremdschlüsseln, dreistufiger Upload |
| 15   | `15-dateien-ui.md`                 | L       | Ablagezone, Raster, Liste, Vorschau, Freigabe-Schalter  |
| 16   | `16-bulk-upload-download.md`       | M       | Mehrfachauswahl, gestreamtes ZIP, Sammel-Löschen        |

## Nach dem Merge live

Dateibereich im Kundendetail und in der Projektkarte: hochladen, ansehen, herunterladen, für den
Kunden freigeben, mehrere auswählen und als ZIP ziehen.

## Warum diese Tasks zusammen

Der größte Ordner im Plan — und der klarste Fall für „zusammen sinnvoll, einzeln nicht deploybar":

- 13 allein ist ein Paket ohne Aufrufer
- 14 allein sind Endpunkte ohne Oberfläche
- 15 ohne 16 wäre eine Dateiliste, in der man 40 Bilder einzeln anklicken muss

Erst alle vier zusammen ergeben „Dateiverwaltung funktioniert". Bei ~120 Dateien liegt das noch klar
unter der Reviewgrenze; ein Aufsplitten würde zwei Merges ohne jeden Nutzen erzeugen.

## Vor dem Merge erledigen (Konfiguration)

- [ ] `BLOB_READ_WRITE_TOKEN` und `STORAGE_PROVIDER` in allen Vercel-Umgebungen gesetzt
- [ ] `images.remotePatterns` enthält die Blob-Domain, sonst laden keine Vorschaubilder

## Merge-Gate

- [ ] Bereinigung der Dateinamen wehrt Pfadangriffe nachweislich ab (`../../etc/passwd`, Backslashes,
      Steuerzeichen, Namen ohne Endung, Umlaute, Emoji)
- [ ] **Kein Test kontaktiert einen echten Anbieter** — alles läuft gegen den In-Memory-Adapter
- [ ] Eine zu große oder unerlaubte Datei wird beim Ticket abgelehnt, **vor** dem Hochladen
- [ ] Eine gemeldete Größe, die nicht stimmt, verhindert den Abschluss
- [ ] Eine Datei eines fremden Projekts lässt sich nicht anlegen
- [ ] Eine Zeile mit gleichzeitig gesetztem `project_id` und `submission_id` wird abgelehnt
- [ ] Das Löschen eines Projekts entfernt dessen Datei-Zeilen per Cascade; keine Zeile mit toter Kennung
- [ ] Nach hartem Löschen von Kunde oder Projekt existiert kein Storage-Objekt mehr
- [ ] Signierte URLs sind kurzlebig und danach wirkungslos
- [ ] Bei 200 Dateien werden nur die sichtbaren URLs signiert (im Netzwerk-Tab nachweisbar)
- [ ] Kein Layout-Sprung beim Laden der Vorschaubilder; blockierter `localStorage` wirft nicht
- [ ] ZIP: drei gleichnamige Dateien ergeben drei Einträge; eine unlesbare Datei bricht es nicht ab
- [ ] Mehr als 100 Dateien oder über 300 MB werden abgelehnt, bevor gelesen wird
- [ ] Ein Archiv über Dateien zweier Kunden ist nicht erzeugbar
- [ ] Neu hochgeladene Dateien sind standardmäßig **nicht** für den Kunden freigegeben
- [ ] Die Freigabe ist ohne Farbwahrnehmung erkennbar und beschriftet
- [ ] Alle Texte in DE und EN; Dark, Light, mobil ab 360 px geprüft
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün

## Bewusst noch offen

Der Kunden-Upload über das Portal (Ordner 10) nutzt später denselben Backend-Pfad. Versionierung und
Kommentare pro Datei sind bewusst nicht enthalten.
