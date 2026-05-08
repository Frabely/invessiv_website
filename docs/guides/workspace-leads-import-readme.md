# Workspace Leads CSV-Import

Diese README erklärt kurz, wie CSV-Dateien für den Workspace-Lead-Import aufgebaut sein sollten.

## Kurzformat

- Datei als `.csv` speichern.
- UTF-8 verwenden, mit oder ohne BOM.
- Semikolon `;` wird empfohlen, Komma `,` ist ebenfalls möglich.
- Die Spaltenreihenfolge ist egal.
- Spaltennamen müssen exakt den erlaubten Keys entsprechen.
- Unbekannte Spalten werden ignoriert.
- Ein Lead ist nur gültig, wenn `email` und zusätzlich `last_name` oder `company_name` gesetzt sind.

## Erlaubte Spalten

```csv
external_guid;email;first_name;last_name;company_name;phone;website_url;category_id;category;score;linkedin_url;instagram_url;youtube_url;status;owner;notes;improvements
```

## Pflichtfelder

Jede Datenzeile braucht:

- `email`
- entweder `last_name` oder `company_name`

Gültige Minimalbeispiele:

```csv
email;last_name
max.mustermann@example.com;Mustermann
```

```csv
email;company_name
kontakt@example.com;Beispiel GmbH
```

## Wichtige Validatoren

- `email`: muss eine gültige E-Mail-Adresse sein.
- `last_name` oder `company_name`: mindestens eines der beiden Felder muss befüllt sein.
- `website_url`: muss eine gültige URL sein, wenn gesetzt.
- `category_id`: muss eine gültige UUID einer bestehenden Kategorie sein, wenn gesetzt.
- `category`: wird nur genutzt, wenn `category_id` leer ist; muss zu einer bekannten Kategorie passen.
- `score`: muss eine ganze Zahl von `0` bis `100` sein, wenn gesetzt.
- `linkedin_url`, `instagram_url`, `youtube_url`: müssen gültige URLs sein, wenn gesetzt.
- `status`: akzeptiert interne Status-Codes oder bekannte DE/EN-Bezeichnungen; unbekannte Werte fallen auf `new` zurück
  und erzeugen eine Warnung.
- `improvements`: mehrere Einträge mit `|` trennen, zum Beispiel
  `Hero schärfen | CTA verbessern | Trust-Signale ergänzen`.

## Deduplizierung

- E-Mail-Adressen werden global dedupliziert.
- `external_guid` ist optional.
- Wenn `external_guid` gesetzt ist, muss sie eindeutig sein.
- Bereits vorhandene Leads werden nicht aktualisiert, sondern übersprungen.
- Wenn E-Mail und `external_guid` auf unterschiedliche bestehende Leads zeigen, wird die Zeile nicht importiert und im
  Report ausgewiesen.

## Limits

- Maximal 2 MB Dateigröße.
- Maximal 500 Datenzeilen.
- Ungültige Zeilen blockieren nicht den gesamten Import; gültige Zeilen werden trotzdem importiert.

## Beispiel

Eine vollständige Beispieldatei liegt hier:

```txt
plans/workspace/leads/lead-import-example.csv
```
