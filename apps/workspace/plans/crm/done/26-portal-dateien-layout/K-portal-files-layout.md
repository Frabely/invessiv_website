# Paket K – Portal-Dateien im Layout von Onboarding/Feedback

Status: **gemerged** am 18.10.2026 (`e1bd575d`). Der Endstand folgt den Nachträgen und Paket M.

> Nachtrag 17.10.2026: Liste, Reiter, Projekt-Umschalter (`SegmentedControl`), Auswahl in der Fußleiste,
> `FilePickButton` und `openOnRowClick` sind durch Paket M (`M-portal-files-table.md`) ersetzt bzw. entfernt.

## Context

Die Portalseite „Dateien“ (`/portal/[customerId]/files`) sieht noch so aus wie vor Paket J. Oben stehen der Zurück-Link, H1 und Intro. Darunter folgen eine immer sichtbare große Upload-Box, ein selbst gebauter Pillen-Umschalter für Projekt/Alle und eine Karte mit Reitern, ZIP-Werkzeugleiste und Liste. Onboarding und Feedback nutzen inzwischen `PortalStepFrame`: fester Kopf, Inhalt scrollt dazwischen, feste Fußleiste unten.

Ziel: Die Seite soll einheitlich aussehen, mobil optimiert sein und ohne neue Fachfeatures auskommen.

Entscheidungen (17.10.2026):

- **Rahmen:** `PortalStepFrame` mit `PortalStepHeader` (ohne Stepper) und einer festen Fußleiste.
- **Upload:** Der Upload ist immer möglich. Die Drag-and-drop-Fläche bleibt dauerhaft, aber flach (`compact`, eine Zeile) über den Reitern; zusätzlich stehen „Hochladen“ und „Link hinzufügen“ in der Fußleiste (Nachtrag 17.10.2026: Ablagefläche bleibt, statt nur im leeren Zustand zu erscheinen).
- **Projekt-Umschalter:** im Kopf (`summary`) mit echtem Projekttitel statt „Dieses Projekt“. Ein Wechsel lädt die Seite nicht neu.
- **ZIP-Auswahl:** Sobald etwas ausgewählt ist, wird die Fußleiste zur Auswahlleiste. Die Werkzeugleiste über der Liste entfällt.
- **Mobil zuerst:** Klickflächen ≥ 44 px und Safe Area unten. Kein Element nimmt mehr als eine Zeile ein, außer der Liste.

Vorschaubilder in der Liste sind **nicht** Teil dieses Pakets (siehe Abschnitt „Nicht im Scope“).

## Vorgehen (Projektregel: Plan + AGENTS zuerst)

1. Diesen Plan als `apps/workspace/plans/crm/26-portal-dateien-layout/K-portal-files-layout.md` ablegen.
2. Den Abschnitt „Dateien (ab Task 55)“ in `apps/workspace/src/components/portal/AGENTS.md` um die Layoutregeln aus diesem Plan ergänzen.

## Umsetzung

### 1. Fußleiste generalisieren (`components/portal/shared/`)

- Neu: `portal-page-bar/` mit den Slots `status` und `actions`. Die Hülle (Rahmen, Hintergrund, Safe Area, mobile Verteilung der Buttons auf eine eigene Zeile) wandert aus `portal-step-bar.module.css` hierher.
- `PortalStepBar` setzt sich danach aus `PortalPageBar` zusammen. Das Verhalten von Onboarding und Feedback bleibt dabei unverändert, damit es kein CSS-Duplikat gibt.

### 2. Zwei kleine, app-neutrale UI-Bausteine (`packages/ui`)

- **`FilePickButton`** (`components/files/file-pick-button/`): Ein Button mit verstecktem `<input type="file">`, gleiche Props-Logik wie `FileDropZone` (`accept`, `multiple`, `onFilesSelected`) und Optik wie `ButtonControl`/`PrimaryCtaButton`.
  - Am Handy öffnet er direkt Galerie, Kamera oder Dateien, mit einem Tipp.
  - Die Auswahl übernimmt die Logik von `FileDropZone` (`emit`, Input zurücksetzen). Die gemeinsame Logik wird in einen Helfer/Hook in `packages/ui/src/hooks/` extrahiert, damit es kein Duplikat gibt.
- **`SegmentedControl`** (`components/segmented-control/`): Radiogroup-Semantik mit Pfeiltasten, ≥ 44 px Höhe, gekürztem Text mit `title` und Werten per generischem `Value extends string`.
  - Er ersetzt den Pillen-Umschalter `.scope`.
  - Mobil nimmt er die volle Breite ein, beide Segmente sind gleich breit.
- Beide in `packages/ui/src/index.ts` exportieren und testen (Vitest wie bei den Nachbarn).

### 3. `portal-files-view` umbauen (`components/portal/files/portal-files-view/`)

- Der Rahmen ist `PortalStepFrame`:
  - `header` = `PortalStepHeader` mit Titel `page.heading`, `backLabel`/`backShortLabel` und `summary` = `SegmentedControl`. Der Umschalter erscheint nur, wenn `selectedProjectId` gesetzt ist; er zeigt den Projekttitel aus `projects` und „Alle Projekte“.
  - `bar` = `PortalPageBar` mit den Inhalten aus Schritt 4.
- Der Body wird zu einer ruhigen Spalte, ohne Karte `.panel`:
  - zuerst der Owner-Hinweis (wie bisher), dann `TabList` und die Liste;
  - rechts in der Reiterzeile „Alle angezeigten auswählen“ als ruhiger Ghost-Button, der mobil unter die Reiter umbricht;
  - die Fehlerzeile `actionError` bleibt über der Liste.
- **Den Scope ohne Roundtrip wechseln:** über `useUrlSearch().replace` (`scope=all` setzen bzw. entfernen, `selected` leeren).
  - `projectId` für `usePortalFiles` wird aus `search` abgeleitet statt aus der Server-Prop.
  - Der Server-Pfad in `page.tsx` liest `scope` weiter für das erste Rendern.
- **Fix in `hooks/portal/use-portal-files.ts`:** Die erste Seite vom Server wird nur genutzt, wenn neben `origin` auch der `projectId` passt. Dazu kommt `projectId` in `initial` mit hinein, damit nach einem Scope-Wechsel keine falsche Liste erscheint.
- `.intake`, `.linkRow`, `.scope` und `.panel` aus der CSS entfernen. Die Breite der Inhaltsspalte wird an Onboarding/Feedback angeglichen (`max-width` und Zentrierung im Scrollbereich).

### 4. Fußleiste der Dateien

- **Ohne Auswahl:**
  - Status links: „{shown} von {total} Dateien“ (die bestehende Formatierung von `list.shown` wird wiederverwendet).
  - Aktionen rechts: `[🔗 Link hinzufügen]` (Ghost) und `[⬆ Hochladen]` (`FilePickButton`, primär). Die Aktionen erscheinen nur mit `canUpload`.
  - In der Owner-Sicht und bei Lesekontakten steht nur der Status da.
- **Mit Auswahl (`selection.selectedIds.length > 0`):**
  - Status: „{count} ausgewählt“ plus die Hinweise `limitReached` bzw. `videoHint` (nur wenn ein **ausgewähltes** Element ein Video ist).
  - Aktionen: „Auswahl aufheben“ (Ghost) und „Als ZIP herunterladen“ (primär, `busy` → `preparing`).
- Mobil teilen sich die Buttons eine eigene Zeile (über die Hülle aus Schritt 1).
- Auf der Seite wird `FileArchiveToolbar` nicht mehr genutzt. Der Baustein bleibt für das CRM unverändert.

### 5. Flache Ablagefläche über den Reitern

- Mit `canUpload` steht über den Reitern `FileDropZone` (`compact`) mit `intake.dropLabel`/`dropHint` und darunter `intake.linkHint`, in beiden Reitern.
- Die leeren Zustände bleiben die bisherigen `EmptyState`s.

### 6. Dateizeile (`portal-file-row`)

- Der Projektname erscheint in der Metazeile nur unter „Alle Projekte“, gesteuert über die neue Prop `showProject`. Ist ein Projekt gewählt, wäre er sonst in jeder Zeile doppelt.

### 7. Texte (`src/i18n/dictionaries/portal/files/{de,en}.json`, Skill `copywriting`, du-Form)

- Neu: `page.backShort` (z. B. „Überblick“) und `bar.selected` (oder `archive.selected` wiederverwenden).
- `scope.project` entfällt, weil stattdessen der Titel kommt. `page.intro` entfällt, weil der Kopf keinen Intro-Text hat.
- `actions.upload` wird zu „Hochladen“ (kurz für die Leiste), `actions.uploadNamed` dient als zugänglicher Name.
- DE und EN werden parallel gepflegt, mit identischen Keys.

## Kritische Dateien

- `apps/workspace/src/components/portal/files/portal-files-view/portal-files-view.tsx` + `.module.css`
- `apps/workspace/src/components/portal/files/portal-file-list/portal-file-list.tsx`
- `apps/workspace/src/components/portal/files/portal-file-row/portal-file-row.tsx`
- `apps/workspace/src/hooks/portal/use-portal-files.ts`
- `apps/workspace/src/components/portal/shared/portal-step-bar/*`, neu `shared/portal-page-bar/*`
- `packages/ui/src/components/files/file-pick-button/*`, `packages/ui/src/components/segmented-control/*`, `packages/ui/src/index.ts`
- `apps/workspace/src/i18n/dictionaries/portal/files/{de,en}.json`
- Wiederverwendet: `PortalStepFrame`, `PortalStepHeader` (`components/portal/shared/`), `useUrlSearch`, `useFileSelection`, `FileDropZone`, `TabList`, `FileListFrame`, `FileEntryRow`

## Nachtrag 17.10.2026 (nach erster Sichtung)

- **Fußleiste fixiert:** Die View steht in einem Wrapper mit `data-portal-fixed-head` wie Onboarding und Feedback.
  Erst damit gibt die Shell das Scrollen an `PortalStepFrame` ab.
- **Ein Upload-Weg:** Die Ablagefläche bleibt dauerhaft (`compact`), „Hochladen“ verschwindet aus der Fußleiste.
  Dort stehen links der Link-Hinweis und rechts „Link hinzufügen“. `FilePickButton` wurde wieder entfernt.
- **Vorschau-Panel ab 1100 px:** `FilePreviewPanel` (neu in `@invessiv/ui`) neben der Liste, gewählte Datei im
  URL-Parameter `file`, „Vollbild“ öffnet die Lightbox. Lightbox und Panel teilen `file-preview-stage` und
  `use-file-preview-source`.
- Vorschaubilder in der Liste: eigener [offener Plan L](../../26-portal-dateien-layout/L-file-thumbnails.md).

### Nachtrag 2 (17.10.2026)

- Buttons: `.button` in `@invessiv/ui` setzt `gap: 0.5rem` zwischen Icon und Text; zwei Icon-`margin-right`-Notlösungen
  (Zugangsdaten-Dialog, Leistungsanfrage-Formular) entfernt.
- Upload je Bildschirm genau einmal: unter 768 px „Hochladen“ in der Fußleiste (`FilePickButton` wieder da), ab 768 px
  die Ablagefläche.
- Dateizeilen: ganze Zeile öffnet (`openOnRowClick`), kein unterstrichener Name, kein Auge.

### Nachtrag 3: Upload und Link gemeinsam in der Fußleiste (17.10.2026)

- Die primäre Dateiauswahl steht rechts neben „Link hinzufügen“ in der Fußleiste. Ab 768 px wird die kompakte
  Ablagefläche hervorgehoben (`FileDropZone` mit `prominent`), mobil bleibt der primäre Upload-Button.
- Der Cloud-Hinweis steht direkt unter dem Link-Button und ist über `aria-describedby` damit verbunden.
- Die zusätzliche Ablagefläche über den Reitern entfällt. Bei ZIP-Auswahl ersetzt weiterhin die Auswahlleiste die
  beiden Aktionen.

### Nachtrag 4: Gemeinsamer Hinzufügen-Dialog (17.10.2026)

Der Nachtrag 3 ist durch folgende Entscheidung ersetzt: Ein primärer Button „Datei hinzufügen“ öffnet
einen Dialog mit Upload als Startansicht und einem Umschalter zum Link-Formular. Bei ZIP-Auswahl stehen
„Auswahl aufheben“ und „Als ZIP herunterladen“ links davor; der Hinzufügen-Button bleibt sichtbar. Laufende Uploads
und Link-Submits sperren den Moduswechsel; Entwürfe werden nur nach Bestätigung verworfen.

## Nicht im Scope

- **Vorschaubilder in der Liste.** Heute kostet jede Vorschau einen API-Aufruf, der eine signierte URL auf das **Original** liefert (`getDownloadUrl` in `usePortalFileDownloads`). Thumbnails direkt in der Liste würden bedeuten:
  - ein Request pro Zeile;
  - Originalfotos von mehreren MB pro Bild;
  - mobil spürbar langsameres LCP und mehr Datenverbrauch.

  Sinnvoll geht das nur mit serverseitig erzeugten Thumbnails beim Upload, und das wäre ein eigenes Feature. Die Vorschau bleibt deshalb wie bisher in der Lightbox.

- Zähler an den Reitern, Filter, Suche und Gruppierung.

## Verifikation

- Unit-Tests:
  - `portal-files-view.test.tsx` anpassen: Fußleiste ohne und mit Auswahl, Scope-Wechsel ohne Navigation, leerer Zustand „Von dir“ mit und ohne `canUpload`, Owner-Sicht ohne Aktionen.
  - `use-portal-files`: Die erste Seite wird bei abweichendem `projectId` nicht genutzt.
  - Neue Tests für `FilePickButton` und `SegmentedControl`.
  - Onboarding- und Feedback-Tests bleiben grün, als Regressionstest für `PortalStepBar`.
- `pnpm --filter @invessiv/workspace test`, `pnpm -r lint`, `pnpm -r typecheck`, `pnpm --filter @invessiv/workspace build`.
- `e2e/portal-files.e2e.ts` anpassen, falls Selektoren betroffen sind (Upload-Button, ZIP), und laufen lassen.
- Sichtprüfung mit Playwright bei 375 px und 1280 px, Dark und Light:
  - Kopf einzeilig, Umschalter darunter;
  - Fußleiste über der Safe Area;
  - Fokus-Reihenfolge Kopf → Reiter → Liste → Leiste;
  - Tastaturbedienung des `SegmentedControl`.
