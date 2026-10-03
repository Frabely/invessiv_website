# Task 54 — Mehrfachauswahl und ZIP intern

> **Status:** gemerged · **Teil-PR:** 14.4 · **Branch:** `feat/crm-dateien-4-zip`

## Gelieferter Scope

- Die interne Dateiliste bietet Mehrfachauswahl mit der gemeinsamen `CheckboxControl` aus `@invessiv/ui`.
  „Angezeigte auswählen“ berücksichtigt auch nachgeladene Seiten. Die Auswahl bleibt beim Filtern und Blättern
  in der URL (`filesSelected`) erhalten und ist an die Kunden-ID gebunden. Videos werden nicht angeboten;
  sie bleiben einzeln herunterladbar.
- „Als ZIP herunterladen“ sendet nur die ausgewählten Datei-IDs an
  `POST /api/workspace/crm/customers/[id]/files/archive`. Der Client zeigt Fehler und einen Ladezustand.
  Alle sichtbaren Texte stehen in den DE- und EN-Dictionaries.
- Vor dem ersten ZIP-Byte prüft der Server UUIDs, Duplikate, Anzahl, Gesamtgröße, Kunden-Zugehörigkeit,
  `ready`-Status, `orphaned_at` und `files.read` je Projekt. Fremde oder nicht lesbare IDs ergeben 404;
  ungültige Auswahl und Grenzüberschreitung ergeben 422. Die Antwort ist privat und nicht cachebar.
- `fflate` schreibt das ZIP über einen Node-Stream. Objekte werden nacheinander über `StorageAdapter.openReadStream`
  gelesen; der Stream berücksichtigt Backpressure. Namenskonflikte erhalten Zählsuffixe. Links stehen in
  `_LINKS.txt`, während Storage-Fehler während des Streams in `_FEHLENDE-DATEIEN.txt` aufgeführt werden.
  Provider-Fehler und Storage-Keys gelangen nicht in die Antwort oder Logs.
- Der Stream-Helfer liegt bis zur echten Zweitnutzung im internen CRM-Serverpfad. Bei der Portalroute in 14.5
  wird er nach `server/shared/files/` verschoben; die getrennten Workspace- und Portal-Handler behalten
  ihre eigene Autorisierung.

## Grenzen und Messung

- Aktuelle Obergrenzen: `MAX_ARCHIVE_FILES = 100`, `MAX_ARCHIVE_BYTES = 300 MiB`, `maxDuration = 120 s`.
  Der Stream beginnt nach 96 s keine weiteren Objektauslesevorgänge; ausgelassene Dateien erscheinen in
  `_FEHLENDE-DATEIEN.txt`. Das hält 20 % Abstand zur Routenlaufzeit. Ein bereits laufender einzelner
  Lesevorgang kann das Budget noch überschreiten.
- Messung am 28.09.2026 gegen den privaten Preview-Store (synthetische Binärdateien, sequenzielle Reads über
  den echten Adapter und ZIP-Stream, einmaliger Lauf):

  | Dateien | Nutzdaten |   ZIP-Bytes |   Dauer |
  | ------: | --------: | ----------: | ------: |
  |      10 |    50 MiB |  52.430.042 |  9,94 s |
  |      50 |   150 MiB | 157.292.602 | 32,60 s |
  |     100 |   300 MiB | 314.585.202 | 45,76 s |

  Alle 100 Testobjekte des dokumentierten Laufs wurden anschließend erfolgreich gelöscht. Die Messung
  deckt den Preview-Store ab; Netzlast und Anbieterzeiten können in Production abweichen. Ein einzelner
  Lauf begründet die Obergrenzen als Startwerte und ersetzt keine laufende Betriebsbeobachtung.

- Der Browser hält die fertige ZIP-Datei für den Download als Blob. Das betrifft maximal 300 MiB und ist auf
  speicherarmen Geräten eine bekannte Grenze; der Server hält das Archiv nicht vollständig im Speicher.

## Prüfung

- Typprüfung und gezieltes ESLint: grün.
- Unit-Tests für ZIP-Inhalt, Namenskonflikte, Links, fehlende Objekte und Fehlermeldungs-Redaktion: grün.
- HTTP-Tests für Authentifizierung, Permission und ungültige Auswahl: grün.
- CRM-Datenbankintegration für fremde Kunden, Projektrechte und Duplikate: grün.
- UI-Tests für den Dateiabschnitt: grün.

## Security, Betrieb und Rollback

Die DB-Query begrenzt alle IDs vor dem Stream auf genau einen Kunden und den Actor-Scope. Signierte URLs
werden weder an den Client geliefert noch protokolliert. Ein fehlgeschlagener Objektauslesevorgang beendet den
Download der übrigen Dateien nicht; die Fehlendatei macht die Lücke sichtbar. Für ein Rollback kann die
Archivroute samt Sammelaktion zurückgenommen werden. Vorhandene Dateien und Links bleiben erhalten.
