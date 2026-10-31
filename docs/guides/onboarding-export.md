# Onboarding-Export

Der Onboarding-Export bündelt einen Onboardingbogen als ZIP: alle Fragen, alle Antworten und alle angehängten
Dateien eines Projekts. Er ist die Grundlage, um mit einer KI ein Projektbriefing abzuleiten, also Designvorgaben,
Seitenstruktur, Inhalte, Tonalität sowie technische und rechtliche Vorgaben.

- **Wo:** Cockpit → Projekt → Onboardingbogen → Button „Antworten exportieren“ im Seitenkopf.
- **Wann:** in jedem Status, vom Entwurf bis zum abgeschlossenen Bogen.
- **Wer:** jedes Mitglied mit Leserecht auf das Projekt (`projects.read`). Dateien sieht nur, wer sie auch im
  Antworten-Tab sieht (`files.read`).
- **Sprache:** Fragen und Optionen kommen in der Sprache der Oberfläche; Keys, Statuswerte, Ordner und Dateinamen
  sind englisch.

Diese Seite erklärt das Format für das Team. Im ZIP liegt dieselbe Erklärung auf Englisch als `README.md`, damit
eine KI sie zusammen mit den Daten bekommt.

## Inhalt des ZIP

| Pfad                                               | Inhalt                                                                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `README.md`                                        | Formatbeschreibung auf Englisch, für KI und Menschen.                                                       |
| `onboarding.json`                                  | Alle Fragen und Antworten. Aufbau siehe unten.                                                              |
| `files/<block>/<frage>/<datei>`                    | Datei, die genau an einer Frage hängt.                                                                      |
| `files/<block>/<gruppe>/entry-<n>/<frage>/<datei>` | Datei an einer Frage in einer Gruppe, z. B. das Porträt von Teammitglied 2.                                 |
| `files/shared/<datei>`                             | Datei, die der Kunde an mehreren Fragen angehängt hat. Sie liegt einmal hier; alle Fragen verweisen darauf. |

Dateiname des ZIP: `onboarding-<Projekttitel>-<JJJJ-MM-TT>.zip`.

## Die fünf Leseregeln

1. **Jede Frage ist da.** Unbeantwortete Fragen fehlen nicht, sie stehen mit `"answered": false` und leerer
   Antwort im JSON. Unbeantwortet heißt „noch nicht gesagt“, nie „nein“.
2. **Auch ausgeblendete Fragen sind da.** Manche Fragen erscheinen erst nach einer bestimmten Antwort. Solange die
   Bedingung nicht erfüllt ist, tragen sie `"visible": false`. Sie sind Kontext, keine fehlende Angabe.
3. **Keys sind stabil, Labels zum Lesen.** `key`-Werte wie `texts_tone` oder `design_direction` sind in jedem
   Export jedes Kunden gleich. `label`, `title` und `help` sind der Wortlaut, den der Kunde gesehen hat.
4. **Der Status sagt, wie endgültig es ist.** Vor `completed` kann der Kunde noch ändern; ein `draft` hat er noch
   gar nicht bekommen.
5. **Auswahlfragen nennen jede Option.** Jede Option steht mit `"selected": true/false` da. Was nicht gewählt
   wurde, sagt oft genauso viel.

## onboarding.json

### Oberste Ebene

| Feld            | Typ                  | Bedeutung                                                                                              |
| --------------- | -------------------- | ------------------------------------------------------------------------------------------------------ |
| `schemaVersion` | Zahl                 | Version des Formats. Steigt, wenn sich die Form ändert.                                                |
| `exportedAt`    | Zeitpunkt (ISO)      | Wann das ZIP erstellt wurde.                                                                           |
| `locale`        | `de` \| `en`         | Sprache aller Labels. Fehlt ein Text in dieser Sprache, kommt er aus einer anderen gepflegten Sprache. |
| `customerName`  | Text                 | Anzeigename des Kunden.                                                                                |
| `projectTitle`  | Text                 | Titel des Projekts.                                                                                    |
| `projectPhase`  | Text                 | Projektphase beim Export: `onboarding`, `design`, `development`, `feedback`, `launch`, `maintenance`.  |
| `templateTitle` | Text \| null         | Vorlage, aus der der Bogen entstand; null ohne Vorlage.                                                |
| `status`        | Text                 | Bogenstatus, siehe unten.                                                                              |
| `releasedAt`    | Zeitpunkt \| null    | Wann der Kunde den Bogen bekommen hat.                                                                 |
| `submittedAt`   | Zeitpunkt \| null    | Wann der Kunde zuletzt abgesendet hat.                                                                 |
| `callHeldOn`    | `JJJJ-MM-TT` \| null | Datum des Onboarding-Calls; wird beim Abschluss gesetzt.                                               |
| `completedAt`   | Zeitpunkt \| null    | Wann das Team den Bogen abgeschlossen hat.                                                             |
| `services`      | Objekt               | Die gebuchten Leistungen, siehe unten.                                                                 |
| `blocks`        | Liste                | Die Schritte des Bogens in Reihenfolge, siehe unten.                                                   |

| `status`            | Bedeutung                                      |
| ------------------- | ---------------------------------------------- |
| `draft`             | Entwurf, der Kunde hat den Bogen noch nicht.   |
| `open`              | Beim Kunden, er füllt aus.                     |
| `submitted`         | Abgesendet, das Team prüft.                    |
| `changes_requested` | Das Team hat nachgefordert, der Kunde ergänzt. |
| `completed`         | Abgeschlossen, ab jetzt unveränderlich.        |

### services

Die für das Projekt gebuchten Leistungen, so wie der Kunde sie bestätigen sollte. Nach dem Abschluss ist das der
eingefrorene Stand.

| Feld                       | Typ               | Bedeutung                                          |
| -------------------------- | ----------------- | -------------------------------------------------- |
| `confirmedAt`              | Zeitpunkt \| null | Wann der Kunde bestätigt hat; null solange offen.  |
| `note`                     | Text \| null      | Anmerkung des Kunden zu den Leistungen.            |
| `changedSinceConfirmation` | ja/nein           | Eine Leistung wurde nach der Bestätigung geändert. |
| `items`                    | Liste             | Die Leistungen.                                    |
| `items[].title`            | Text              | Titel der Leistung.                                |
| `items[].description`      | Text \| null      | Umfang der Leistung.                               |

### blocks

Ein Block ist ein Schritt des Bogens, z. B. „Unternehmen“, „Zielgruppe“, „Texte & Ansprache“, „Designrichtung“.

| Feld           | Typ          | Bedeutung                                                                                                        |
| -------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| `key`          | Text         | Stabiler Schlüssel des Blocks, z. B. `company_profile`, `texts_tone`, `brand_colors_fonts`.                      |
| `title`        | Text         | Titel, den der Kunde gesehen hat.                                                                                |
| `intro`        | Text \| null | Hinweis über den Fragen.                                                                                         |
| `reviewStatus` | Text         | Prüfung durch das Team: `pending` (noch nicht angesehen), `complete` (passt), `clarification` (Rückfrage offen). |
| `reviewNote`   | Text \| null | Rückfrage oder Anmerkung des Teams. Intern, keine Antwort des Kunden.                                            |
| `fields`       | Liste        | Die Fragen des Blocks in Reihenfolge.                                                                            |

### fields (Fragen)

| Feld                    | Typ            | Bedeutung                                                                                             |
| ----------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `key`                   | Text           | Stabiler Schlüssel der Frage innerhalb ihres Blocks.                                                  |
| `type`                  | Text           | Fragetyp, siehe Tabelle unten. Bestimmt die Form von `answer`.                                        |
| `label`                 | Text           | Die Frage, wie der Kunde sie gelesen hat.                                                             |
| `help`                  | Text \| null   | Erklärung unter der Frage.                                                                            |
| `required`              | ja/nein        | Pflichtfrage, solange sie sichtbar ist.                                                               |
| `visible`               | ja/nein        | Ob der Kunde die Frage mit den bisherigen Antworten sieht.                                            |
| `condition`             | Objekt \| null | Wann die Frage erscheint, siehe unten. Null heißt: immer sichtbar.                                    |
| `maxLength`             | Zahl \| null   | Längengrenze einer Textantwort.                                                                       |
| `minItems` / `maxItems` | Zahl \| null   | Grenzen für Dateien, Gruppeneinträge oder gewählte Optionen.                                          |
| `acceptedAssetKinds`    | Liste \| null  | Erlaubte Dateiarten einer Dateifrage (`document`, `image`, `video`, `font`, `link`); null heißt alle. |
| `answered`              | ja/nein        | Ob die Antwort überhaupt etwas enthält.                                                               |
| `answer`                | Objekt         | Die Antwort. Ihr `kind` sagt, welche Form sie hat.                                                    |

### condition

„Erscheint, wenn bei Frage _fieldKey_ die Option _optionKey_ gewählt ist.“ Die auslösende Frage liegt im selben
Block, in einer Gruppe im selben Eintrag.

| Feld          | Bedeutung                                         |
| ------------- | ------------------------------------------------- |
| `fieldKey`    | Schlüssel der auslösenden Frage.                  |
| `optionKey`   | Schlüssel der Option, die dort gewählt sein muss. |
| `optionLabel` | Wortlaut dieser Option.                           |

### Fragetypen und ihre Antwort

| `type`                                                      | `answer.kind`  | Antwort                                                              |
| ----------------------------------------------------------- | -------------- | -------------------------------------------------------------------- |
| `short_text`, `long_text`, `email`, `phone`, `url`, `color` | `text`         | `value`: Text wie eingegeben, Farbe als Hex-Code; null wenn leer.    |
| `choice`, `multi_choice`, `yes_no`                          | `choice`       | Alle Optionen mit `selected`, siehe unten.                           |
| `scale`                                                     | `scale`        | `value` von 1 bis `steps`, dazu die Beschriftungen der beiden Enden. |
| `confirmation`, `project_services`                          | `confirmation` | `confirmed`: Haken gesetzt bzw. Leistungen bestätigt.                |
| `files`                                                     | `files`        | Liste der Dateien, siehe unten.                                      |
| `group`                                                     | `group`        | Unterfragen und Einträge, siehe unten.                               |

#### choice

| Feld                 | Bedeutung                                                               |
| -------------------- | ----------------------------------------------------------------------- |
| `multiple`           | Ja, wenn mehrere Optionen wählbar waren.                                |
| `options`            | Alle Optionen in der Reihenfolge, die der Kunde gesehen hat.            |
| `options[].key`      | Stabiler Schlüssel der Option. Ja/Nein-Fragen haben `yes` und `no`.     |
| `options[].label`    | Wortlaut der Option.                                                    |
| `options[].selected` | Ob der Kunde sie gewählt hat. Keine Option gewählt heißt unbeantwortet. |

#### scale

| Feld        | Bedeutung                                                  |
| ----------- | ---------------------------------------------------------- |
| `value`     | Gewählte Stufe von 1 bis `steps`; null wenn unbeantwortet. |
| `steps`     | Anzahl der Stufen (derzeit 5).                             |
| `lowLabel`  | Beschriftung von Stufe 1, z. B. „Locker“.                  |
| `highLabel` | Beschriftung der letzten Stufe, z. B. „Förmlich“.          |

#### confirmation

| Feld        | Bedeutung                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------- |
| `confirmed` | Haken gesetzt. Bei `project_services`: der Kunde hat die Leistungen unter `services` bestätigt. |

#### files

| Feld     | Bedeutung                                                                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fileId` | ID der Datei. Dieselbe Datei an mehreren Fragen hat überall dieselbe ID. Null ohne Zugriff.                                                                                     |
| `name`   | Ursprünglicher Dateiname oder Linktitel.                                                                                                                                        |
| `kind`   | `document`, `image`, `video`, `font` oder `link`.                                                                                                                               |
| `status` | Ob die Datei im ZIP liegt, siehe unten.                                                                                                                                         |
| `path`   | Pfad im ZIP; nur bei `included` gesetzt.                                                                                                                                        |
| `url`    | Ziel eines Links (z. B. Cloud-Ordner, bestehende Website); null bei Uploads.                                                                                                    |
| `note`   | Kommentar des Kunden zur Datei.                                                                                                                                                 |
| `usedIn` | Alle Fragen, an denen die Datei hängt, in Bogenreihenfolge, diese eingeschlossen. Mehr als ein Eintrag heißt: der Kunde hat dieselbe Datei mehrfach genutzt. Leer ohne Zugriff. |

Jeder `usedIn`-Eintrag nennt eine Frage:

| Feld          | Bedeutung                                                                         |
| ------------- | --------------------------------------------------------------------------------- |
| `blockKey`    | Schlüssel des Blocks.                                                             |
| `groupKey`    | Schlüssel der Gruppe, in der die Frage liegt; null außerhalb einer Gruppe.        |
| `entryNumber` | Welcher Gruppeneintrag, ab 1 (z. B. Teammitglied 2); null außerhalb einer Gruppe. |
| `fieldKey`    | Schlüssel der Dateifrage selbst.                                                  |

| `status`     | Bedeutung                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------- |
| `included`   | Die Datei liegt im ZIP unter `path`.                                                          |
| `link`       | Keine Datei, sondern ein Link, siehe `url`.                                                   |
| `video`      | Ein Video; Videos werden nicht ins ZIP gepackt.                                               |
| `size_limit` | Weggelassen, weil das ZIP seine Größen- oder Anzahlgrenze erreicht hat (300 MB, 100 Dateien). |
| `timeout`    | Weggelassen, weil das Packen zu lange gedauert hat.                                           |
| `unreadable` | Der Speicher konnte die Datei nicht liefern.                                                  |
| `no_access`  | Es gibt eine Datei, aber wer exportiert hat, darf sie nicht öffnen. Sonst ist nichts bekannt. |

Alles außer `included` heißt trotzdem: Der Kunde hat hier etwas geliefert, es fehlt nur im ZIP.

#### group

Eine Gruppe wiederholt einen Satz Fragen, z. B. je Teammitglied oder je Referenzprojekt.

| Feld               | Bedeutung                                                                         |
| ------------------ | --------------------------------------------------------------------------------- |
| `questions`        | Die Unterfragen einmal ohne Antwort, damit sie auch ohne Eintrag bekannt sind.    |
| `entries`          | Ein Eintrag je Wiederholung. Keine Einträge heißt: der Kunde hat keinen angelegt. |
| `entries[].number` | Position des Eintrags ab 1; zugleich der Ordner `entry-<n>` seiner Dateien.       |
| `entries[].fields` | Die Unterfragen dieses Eintrags mit Antwort, aufgebaut wie jede andere Frage.     |

## Verhalten

- **Der Export scheitert nie an Dateien.** Was nicht ins ZIP passt, steht mit seinem `status` im JSON.
- **Dateizugriffe enden nach 96 Sekunden ab Request-Beginn**, einschließlich der Vorbereitung. Laufende
  Übertragungen werden abgebrochen, weitere Uploads übersprungen; beide erhalten `timeout` und `path: null`.
  Antworten und README werden anschließend noch geschrieben. Bereits übertragene Teile einer abgebrochenen
  Datei können im ZIP bleiben. Verwende ausschließlich Dateien mit `status: included` im JSON.
- **Jede Datei wird einmal gepackt.** Hängt sie an mehreren Fragen, liegt sie unter `files/shared/` und zählt nur
  einmal für die Grenzen.
- **Der Stand ist eine Momentaufnahme.** Ein offener Bogen kann sich nach dem Export noch ändern; `exportedAt` und
  `status` zeigen, wie aktuell er ist.
- **Bedingungen werden ausgewertet, nicht gefiltert.** `visible` zeigt den Stand mit den bisherigen Antworten; die
  Frage steht trotzdem im Export.
- **Prüfnotizen sind intern.** `reviewNote` ist eine Anmerkung des Teams, keine Kundenvorgabe.
- **Nichts landet in Logs.** Der Export schreibt weder Antworten noch Dateinamen in Logs oder Activities.

## Für Entwickler

| Teil                                                  | Ort                                                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Contracts (`OnboardingExportDto` und Unter-DTOs)      | `packages/common/src/contracts/crm/onboarding/export/`                                             |
| Konstanten (Antwortformen, Datei-Status, Ordnernamen) | `packages/common/src/constants/crm/onboarding/onboarding-export-*.ts`                              |
| Bogen → JSON, Ablage der Dateien                      | `apps/workspace/src/server/workspace/crm/services/onboarding/onboarding-export-mapping-service.ts` |
| README im ZIP (englisch)                              | `apps/workspace/src/server/workspace/crm/services/onboarding/onboarding-export-readme.ts`          |
| Dateiplanung, Zugriff                                 | `apps/workspace/src/server/workspace/crm/query-handler/export-onboarding-form.query-handler.ts`    |
| Route                                                 | `GET /api/workspace/crm/onboarding/forms/[formId]/export?locale=de`                                |
| Plan und Entscheidungen                               | `apps/workspace/plans/crm/32-onboarding-export/README.md`                                          |

**Wer das Format ändert,** passt das DTO, die englische README im ZIP und diese Seite an und erhöht bei einer
Formänderung `ONBOARDING_EXPORT_SCHEMA_VERSION`. `onboarding-export-readme.test.ts` schlägt fehl, sobald eine
Property oder ein Wert des Exports in einer der beiden Beschreibungen fehlt.
