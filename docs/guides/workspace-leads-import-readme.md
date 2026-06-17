# Workspace Leads CSV-Import

Dieses Dokument beschreibt das CSV-Format für den Lead-Import im Workspace.
Es ist so geschrieben, dass es direkt an eine KI übergeben werden kann - zusammen mit dem Template oder einer
Recherche-Liste -, damit die KI daraus eine importfertige CSV-Datei erstellt.

---

## Für die KI: Kurzanweisung

Wenn du als KI dieses Dokument erhältst, gilt:

- Erstelle eine CSV-Datei mit Semikolon `;` als Trennzeichen.
- Die erste Zeile enthält exakt die Spaltenköpfe aus der Spaltenreferenz unten (Reihenfolge egal).
- Pflichtfelder müssen befüllt sein, optionale Felder bleiben leer (kein Leerzeichen, kein `-`).
- Leere optionale Felder werden einfach ausgelassen (zwei Semikola nebeneinander: `;;`).
- Spaltennamen dürfen nicht abgeändert werden.
- Jede Zeile muss einen `display_name` enthalten.
- Für neue Imports immer `pending_review` als `status` setzen. Andere Statuswerte werden für diesen Workflow nicht
  verwendet.
- Encoding: UTF-8.

---

## Format

- Trennzeichen: `;` (Semikolon empfohlen, `,` Komma funktioniert auch)
- Encoding: UTF-8, mit oder ohne BOM
- Zeilenenden: LF oder CRLF
- Spaltenreihenfolge: beliebig
- Maximale Dateigröße: 2 MB
- Maximale Anzahl Datenzeilen: 500

---

## Spaltenreferenz

| Spalte          | Pflicht | Typ            | Beschreibung                                                                                                                                                          | Beispiel                               |
| --------------- | ------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `display_name`  | **Ja**  | Text           | Anzeigename des Leads. Muss gesetzt sein.                                                                                                                             | `Anna Weber`                           |
| `email`         | **Ja**  | E-Mail         | Eindeutige E-Mail-Adresse des Leads. Muss eine gültige E-Mail sein.                                                                                                   | `anna.weber@beispiel.de`               |
| `last_name`     | Bedingt | Text           | Nachname. Pflicht, wenn `company_name` leer.                                                                                                                          | `Weber`                                |
| `company_name`  | Bedingt | Text           | Firmenname. Pflicht, wenn `last_name` leer.                                                                                                                           | `Muster GmbH`                          |
| `first_name`    | Nein    | Text           | Vorname.                                                                                                                                                              | `Anna`                                 |
| `phone`         | Nein    | Text           | Telefonnummer in beliebigem Format.                                                                                                                                   | `+49 30 123456`                        |
| `website_url`   | Nein    | URL            | Vollständige URL inkl. `https://`. Muss eine gültige URL sein.                                                                                                        | `https://beispiel.de`                  |
| `linkedin_url`  | Nein    | URL            | LinkedIn-Profilseite. Muss eine gültige URL sein.                                                                                                                     | `https://linkedin.com/in/anna-weber`   |
| `instagram_url` | Nein    | URL            | Instagram-Profilseite. Muss eine gültige URL sein.                                                                                                                    | `https://instagram.com/anna.weber`     |
| `youtube_url`   | Nein    | URL            | YouTube-Kanal. Muss eine gültige URL sein.                                                                                                                            | `https://youtube.com/@annakanal`       |
| `score`         | Nein    | Ganzzahl 0–100 | Priorisierungspunktzahl. Muss eine ganze Zahl zwischen 0 und 100 sein.                                                                                                | `72`                                   |
| `status`        | **Ja**  | Statuswert     | Prüfstatus des Leads. Für den aktuellen Import-Workflow immer `pending_review`.                                                                                       | `pending_review`                       |
| `category`      | Nein    | Text           | Kategorie-Slug. Wird nur ausgewertet, wenn `category_id` leer ist. Unbekannte Slugs führen zu einem Fehler (Zeile wird nicht importiert). Groß-/Kleinschreibung egal. | `coaches`                              |
| `category_id`   | Nein    | UUID           | UUID einer bestehenden Kategorie im System. Hat Vorrang vor `category`.                                                                                               | `3fa85f64-5717-4562-b3fc-2c963f66afa6` |
| `owner`         | Nein    | Text           | Interner Verantwortlicher (Name der Person im Team).                                                                                                                  | `Moritz`                               |
| `notes`         | Nein    | Text           | Interne Notizen. Freitext.                                                                                                                                            | `Erstkontakt über Webinar.`            |
| `improvements`  | Nein    | Pipe-Liste     | Konkrete Verbesserungsvorschläge für die Website des Leads. Mehrere Einträge mit `\|` (Leerzeichen, Pipe, Leerzeichen) trennen.                                       | `Hero schärfen \| CTA verbessern`      |
| `external_guid` | Nein    | Text/UUID      | Eindeutiger Bezeichner aus einem externen System. Muss pro Datei eindeutig sein, wenn gesetzt.                                                                        | `ext-001`                              |

---

## Gültige Kategoriewerte

Das Feld `category` akzeptiert folgende Slugs (case-sensitive):

| Slug                      | Bezeichnung (DE)     | Bezeichnung (EN)        |
| ------------------------- | -------------------- | ----------------------- |
| `coaches`                 | Coaches              | Coaches                 |
| `craftspeople`            | Handwerker           | Craftspeople            |
| `local-service-providers` | Lokale Dienstleister | Local Service Providers |
| `small-b2b-providers`     | Kleine B2B-Anbieter  | Small B2B Providers     |
| `consultants`             | Berater              | Consultants             |
| `photographers`           | Fotografen           | Photographers           |

Ein unbekannter Slug ist ein **Fehler** - die betroffene Zeile wird nicht importiert und im Report ausgewiesen.
Alternativ kann `category_id` (UUID) direkt angegeben werden; sie hat Vorrang vor `category`.

---

## Gültige Statuswerte

Der Status-Wert wird normalisiert (Groß-/Kleinschreibung egal). Akzeptiert werden ausschließlich die englischen
snake_case-Werte:

| Status (intern)        | Akzeptierte Eingabe    | Bedeutung                                  |
| ---------------------- | ---------------------- | ------------------------------------------ |
| `new`                  | `new`                  | Neu                                        |
| `pending_review`       | `pending_review`       | Zu prüfen                                  |
| `contacted`            | `contacted`            | Kontaktiert                                |
| `connection_requested` | `connection_requested` | Verbindung angefragt (Connect/Follow raus) |
| `connected`            | `connected`            | Verbunden                                  |
| `follow_up`            | `follow_up`            | Wiedervorlage                              |
| `not_reached`          | `not_reached`          | Nicht erreicht                             |
| `reminder`             | `reminder`             | Erinnerung                                 |
| `responded`            | `responded`            | Geantwortet                                |
| `qualified`            | `qualified`            | Qualifiziert                               |
| `proposal`             | `proposal`             | Angebot                                    |
| `on_hold`              | `on_hold`              | Pausiert                                   |
| `won`                  | `won`                  | Gewonnen                                   |
| `lost`                 | `lost`                 | Verloren                                   |
| `archived`             | `archived`             | Archiviert                                 |

Unbekannte Werte werden auf `pending_review` zurückgesetzt und im Report als Warnung ausgewiesen.
Für neue Importdateien ist `pending_review` die feste Voreinstellung.

---

## Improvements — Hinweise für die KI

Das Feld `improvements` enthält konkrete, umsetzbare Verbesserungsvorschläge für die Website des Leads.
Ziel ist es, Schwachstellen zu benennen, die im Rahmen eines Projekts behoben werden könnten.

Typische Kategorien:

- **Conversion**: `Hero schärfen`, `CTA verbessern`, `Preisseite ergänzen`
- **Vertrauen**: `Trust-Signale ergänzen`, `Referenzen ergänzen`, `Über-uns-Seite überarbeiten`
- **Performance**: `Mobile-Performance verbessern`, `Ladezeit optimieren`
- **Inhalt**: `Case Studies ergänzen`, `FAQ hinzufügen`, `SEO-Texte überarbeiten`
- **Technik**: `Cookie-Banner aktualisieren`, `HTTPS einrichten`, `Kontaktformular reparieren`

Mehrere Einträge mit `|` trennen:

```
Hero schärfen | CTA verbessern | Trust-Signale ergänzen
```

---

## Deduplizierung

- E-Mail-Adressen werden global dedupliziert - bereits vorhandene Leads werden übersprungen.
- `external_guid` ist optional. Wenn gesetzt, muss sie innerhalb der Datei eindeutig sein.
- Wenn E-Mail und `external_guid` auf unterschiedliche bestehende Leads zeigen, wird die Zeile übersprungen und im
  Report ausgewiesen.
