# Portal-Audit · Rebranding und UI · 25.10.2026

**Stand:** `feat/improve-home-design`, Commit `1b2cd2a19dec5a985bc226d68772af53cf84e2d8`; lokaler Workspace unter `http://localhost:3001`, bereitgestelltes Kunden-Testkonto. Während der Prüfung kamen fremde lokale Branding-/Metadata-Änderungen hinzu (zum Abschluss 43 geänderte getrackte Dateien); diese wurden nicht bearbeitet. Vorher vorhandene Pläne und Reviews bleiben erhalten.

**Urteil:** Die gemeinsamen Controls sind weitgehend konsistent. Einzelne ältere Komponenten umgehen jedoch deren CTA-, Hover- und Auswahlstile. **10 Findings: 9 × P2, 1 × P3; keine bestätigten P0/P1.** Für das Ziel eines einheitlichen Kundenportals noch keine Design-Freigabe zum Merge nach `master`. Produktcode, Datenmodelle und Tests wurden nicht geändert; kein Commit oder Merge.

**Maßstab:** Orange→Blau-Aktionsverlauf aus `packages/ui/src/components/action-color/`; ruhige Secondary-Buttons mit Verlaufs-Hover, gemeinsame Text-CTAs und Form-Controls. Blaue Informationstexte, Fortschritt, Chat-Nachrichtenflächen sowie fachliche Statusfarben sind nicht pauschal Fehler. Die unterschiedlichen Widget-Farben sind laut Portal-AGENTS ausdrücklich beabsichtigt. Der vom Nutzer beanstandete blaue Leerzustands-Icon gehört ausdrücklich zum Prüfauftrag.

## Aus Kundensicht geprüft

| Bereich               | Browser-Abdeckung                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Einstieg und Header   | Anmeldung mit Passwort und Clerk-Testverifizierung; alle fünf auswählbaren Projekte; Projektmenü, mobiles Menü, Theme-Schalter; DE/EN-Ansichten                                                                     |
| Dashboard             | Widgets aller fünf Projekte; leere und gefüllte Aufgaben-/Dateiansichten; Aufgaben öffnen und Anlegen-Dialog; vorhandene erledigte Aufgaben                                                                         |
| Leistungsanfragen     | Katalog, „Etwas anderes“-Formular, Projektauswahl, eigene Anfragen mit Bestätigt/Abgelehnt                                                                                                                          |
| Dateien               | Liste, Herkunftsfilter, „Noch nichts von uns“, Mehrfachauswahl/Bulk-Leiste; Desktop-Vorschau, mobile Lightbox; Upload-/Link-Reiter und Projektzuordnung                                                             |
| Zugangsdaten          | Vorhandene Liste, Anlegen, Ändern; zusätzlich browserseitig simulierte leere Liste und Ladefehler mit erfolgreichem Retry                                                                                           |
| Stunden               | Projektansicht ohne Buchungen, Gesamtübersicht, überzogene Projekte, Buchungsliste und Käufe                                                                                                                        |
| Onboarding            | Bearbeitbarer Bogen, leerer Gruppeneintrag, Prüfschritt vollständig/unvollständig, Sprung zur fehlenden Angabe, Absende-Bestätigung; abgeschlossene Bögen mit sämtlichen erreichbaren Leseschritten                 |
| Feedback              | Drei erreichbare Projekt-Feedbackseiten; Ergebnisse, Rückfragenverlauf, frühere Runde, Browser-Zurück, aufgebrauchte Runden, Abnahme-Bestätigung, abgenommenes Projekt                                              |
| Chat                  | Öffnen/Schließen, Verlauf, Eingabe ohne Senden, Sendebutton-Hover, Anhangmenü, vorhandene Dateien wählen/markieren; Touch-Enter bleibt Zeilenumbruch                                                                |
| Benutzerkonto         | Clerk-Menü, Profil- und Sicherheitstab; keine Kontoänderung ausgelöst                                                                                                                                               |
| Darstellung/Bedienung | 1440 × 1000 und 390 × 844; Dark/Light, DE/EN als Stichproben; zusätzlicher Chromium-Touch-Kontext für Onboarding, Feedback, Chat, Dateien, Upload und Lightbox; Dialog-Fokus mit Tab, Escape und Stepper-Navigation |

Codeprüfung: Portal-Dateien inventarisiert (224 Dateien einschließlich Tests/CSS). Vollständig gelesen wurden insbesondere die unten genannten Fundstellen und ihre Aufrufer sowie Shell, Dashboard-/Dialog-Orchestrierung, Widget-Registry, Datei-/Credential-Ansichten, gemeinsame Attachment-/Onboarding-Bausteine, Tokens und CTA-Regeln. Kein vollständiges Backend-, Security- oder Einzeldatei-Review aller 224 Dateien.

## Findings

### F01 · P2 · Leerzustands-Icons bleiben einfarbig blau

- **Wo:** `packages/ui/src/components/empty-state/empty-state.module.css:35`; Aufrufer: `apps/workspace/src/components/portal/files/portal-file-table/portal-file-table.tsx:111`, `apps/workspace/src/components/portal/credentials/portal-credentials-dialog/portal-credentials-dialog.tsx:200`, `apps/workspace/src/components/portal/dashboard/portal-dashboard-empty-state/portal-dashboard-empty-state.tsx:17`.
- **Befund:** Dateien → Herkunft „Von uns“ zeigt bei „Noch nichts von uns“ ein blaues Inbox-Icon auf blau getönter Fläche. Dieselbe zentrale Ursache trifft leere Zugangsdaten und den Zustand ohne Projekt. Dateien real, Zugangsdaten mit simulierter leerer GET-Antwort bestätigt; projektloser Zustand im Code geprüft.
- **Richtung:** Leerzustands-Icon zentral an die gewünschte Marken-/Verlaufssprache angleichen; alle Aufrufer berücksichtigen.

### F02 · P2 · Chat-Senden überschreibt den Primary-CTA mit Blau

- **Wo:** `packages/ui/src/components/message-thread/message-composer/message-composer.module.css:92`; weitere Sonderstile in `packages/ui/src/components/message-thread/message-thread/message-thread.module.css:93` und `packages/ui/src/components/message-thread/message-thread-status/message-thread-status.module.css:15`.
- **Befund:** Chat öffnen und Text eingeben: Senden ist blau, beim Hover hellblau statt im CTA-Verlauf. Gemessen: Dark ruhend `rgb(134,172,230)`, `background-image: none`. Auch „Neue Nachrichten“ nutzt eine eigene blaue Fläche; Nachladen/Retry setzen gemeinsame Button-Stile zurück (Codebefund).
- **Richtung:** Aussehen über gemeinsame Button-Varianten/Größen ausdrücken; lokale Reset-/Farbregeln entfernen. Verstößt gegen `packages/ui/AGENTS.md`, „Wer eine UI-Komponente nutzt, stylt sie nicht um“ und „CTA-Hierarchie“.

### F03 · P2 · Chat-Anhänge haben eigene blaue Hover-/Auswahlzustände

- **Wo:** `apps/workspace/src/components/shared/chat-attachments/chat-attachment-menu/chat-attachment-menu.module.css:6`, `:21`, `:57`; `apps/workspace/src/components/shared/chat-attachments/chat-file-picker-dialog/chat-file-picker-dialog.module.css:53`.
- **Befund:** Büroklammer beim Hover: Icon und Rahmen werden rein blau, kein Verlauf. „Vorhandene Datei wählen“ → markieren: Checkbox korrekt im Verlauf, ihre Zeile dagegen blau gerahmt/getönt. Menübuttons übersteuern zusätzlich die gemeinsamen Buttons. Im Browser bestätigt.
- **Richtung:** Standard-Button-/Menüzustände und gemeinsame Auswahldarstellung verwenden. Regelbezug: `packages/ui/AGENTS.md`, Komponenten-Overrides und Aktionsfarbe.

### F04 · P2 · Datei-Anhänge verwenden einen anderen Hover als die Dateiseite

- **Wo:** `packages/ui/src/components/files/file-entry-row/file-entry-row.module.css:82`, `:90`, `:136`; Portal-Aufrufer: `apps/workspace/src/components/shared/files/file-attachment-list/file-attachment-list.tsx`.
- **Befund:** Feedback → Dateianhang → Dateiname hovern: einfarbig blau (`rgb(53,104,173)` in Light). Die Haupt-Dateitabelle nutzt bereits den Verlauf. Auch Vorschau-/Downloadaktionen der Attachment-Zeile überschreiben gemeinsame Buttons. Browser und Aufrufpfad bestätigt; gilt ebenso für Onboarding-Anhänge.
- **Richtung:** Gemeinsame Text-CTA-/Dateiaktionsstile nutzen; Dateiübersicht und Anhänge gleich behandeln. Regelbezug: `packages/ui/AGENTS.md`, CTA-Hierarchie und Komponenten-Overrides.

### F05 · P2 · Mehrere Portal-Textaktionen sind weiterhin Eigenbauten

- **Wo:** `apps/workspace/src/components/portal/onboarding/onboarding-submit-step/onboarding-submit-step.module.css:56`; `apps/workspace/src/components/shared/feedback/feedback-item-text/feedback-item-text.module.css:24`, `:30`; `apps/workspace/src/components/portal/onboarding/onboarding-booking-card/onboarding-booking-card.module.css:50`; `apps/workspace/src/components/portal/dashboard/widgets/portal-completed-projects-widget/portal-completed-projects-widget.module.css:29`; `apps/workspace/src/components/portal/credentials/portal-credential-table-row/portal-credential-table-row.module.css:71`; `apps/workspace/src/components/shared/onboarding/onboarding-read-value/onboarding-read-value.module.css:11`.
- **Befund:** Fehlende Onboarding-Angabe wird als eigener neutraler Link mit orangener Unterstreichung dargestellt; im Browser bestätigt. Feedback-Aufklappen/Links bleiben blau, Chat-Fallback im Onboarding ist eine eigene Pille, Projektbesuch/Credential-URL/Antwortlinks haben jeweils eigene Hover-Regeln (Codebefunde). Damit existieren mehrere parallele Umsetzungen derselben CTA-Stufen.
- **Richtung:** Auf `TertiaryCta`/`QuaternaryCta` bzw. `SecondaryCtaLink` vereinheitlichen, reine Layoutregeln lokal behalten. `packages/ui/AGENTS.md` benennt Prüfschritt und Feedback-Aufklappen bereits als Altlasten; das dokumentiert die Abweichung, beseitigt sie für dieses Rebranding aber nicht.

### F06 · P3 · Pflichtsterne wechseln zwischen Editor und Leser die Darstellung

- **Wo:** `apps/workspace/src/components/shared/onboarding/onboarding-answer-read-view/onboarding-answer-read-view.module.css:46`; entsprechende eigene Umsetzung in `apps/workspace/src/components/shared/onboarding/onboarding-template-read-view/onboarding-template-read-view.module.css:42`.
- **Befund:** Abgeschlossenen Bogen öffnen → Leseschritt: Pflichtsterne blau; im bearbeitbaren Bogen nutzt `FormRequiredMarker` bereits den Verlauf. Leseschritte im Browser, parallele CSS-Implementierungen im Code bestätigt.
- **Richtung:** Gemeinsamen Pflichtmarker verwenden. Regelbezug: `packages/ui/AGENTS.md`, „Pflicht-Kennzeichnung und Checked im Aktionsverlauf“; Root-AGENTS, „Keine Logik-Duplikate“.

### F07 · P2 · Skalenfrage umgeht gemeinsame Radio-/Auswahlstile

- **Wo:** `apps/workspace/src/components/shared/onboarding/onboarding-scale-track/onboarding-scale-track.tsx:54`; `apps/workspace/src/components/shared/onboarding/onboarding-scale-track/onboarding-scale-track.module.css:64`; Aufrufer `apps/workspace/src/components/portal/onboarding/fields/onboarding-scale-field/onboarding-scale-field.tsx`.
- **Befund:** Eigene native Radios mit unsichtbarem Input, eigenem Fokus und einfarbig blauer Checked-Fläche. Eine Skalenfrage unterscheidet sich dadurch von den bereits migrierten Radio-/Optionsfragen. **Codebestätigt; mit den vorhandenen freigegebenen Bögen nicht als Eingabe im Browser erreichbar.**
- **Richtung:** App-neutralen Skalen-Control im UI-Paket mit der gemeinsamen Auswahl-/Fokussprache vorsehen. Regelbezug: `packages/ui/AGENTS.md`, „Radio und Checkbox“ sowie Checked-/Fokus-Regeln.

### F08 · P2 · Einladungseinstieg baut Primary/Secondary selbst

- **Wo:** `apps/workspace/src/components/portal/portal-invitation-actions/portal-invitation-actions.tsx:21`; `apps/workspace/src/components/portal/portal-invitation-actions/portal-invitation-actions.module.css:16`, `:34`.
- **Befund:** Registrierung ist eine einfarbig blaue Fläche; Anmeldung wird beim Hover blau. Beide sind selbst gestylte Links statt der vorhandenen CTA-Komponenten. **Codebestätigt; kein frischer Einladungstoken mit diesem Konto vorhanden.**
- **Richtung:** `PrimaryCtaLink`/`SecondaryCtaLink` mit Next-Link nutzen. Regelbezug: `packages/ui/AGENTS.md`, CTA-Hierarchie.

### F09 · P2 · Firmenauswahl/-wechsel hat eine eigene Interaktionssprache

- **Wo:** `apps/workspace/src/components/portal/portal-company-picker/portal-company-picker.module.css:29`; `apps/workspace/src/components/portal/customer-switcher/customer-switcher.tsx:49`; `apps/workspace/src/components/portal/customer-switcher/customer-switcher.module.css:23`, `:74`.
- **Befund:** Firmenkacheln bekommen nur einen blauen Hover-Rahmen. Der Firmenwechsler baut ein eigenes `details`-Menü mit neutralen Hoverflächen; anders als die geteilten Menüs fehlt eine Escape-/Außenklick-Behandlung. **Codebestätigt; das Konto hat nur eine Firma, daher keine Browserabdeckung dieses Mehrfirmenfalls.**
- **Richtung:** Gemeinsame Auswahl-/Menübausteine und Dismiss-Verhalten nutzen; Linknavigation zwischen Firmen beibehalten. Regelbezug: Portal-AGENTS „Geteilte Bausteine“ und `packages/ui/AGENTS.md` „CTA-Hierarchie“.

### F10 · P2 · Benutzerkonto bleibt außerhalb des Portal-Designsystems

- **Wo:** `apps/workspace/src/components/portal/portal-shell/portal-shell.tsx:124`; `apps/workspace/src/components/providers/app-providers.tsx:28`.
- **Befund:** Avatar → Konto verwalten → Profil/Sicherheit: Clerk-eigene Oberflächen und Controls, violetter Standardavatar und abweichende Typografie/Radien; Texte wechseln im deutschen Portal von „du“ zu „Sie“. `UserButton` und Provider bekommen keine zentrale Appearance-Konfiguration. Im Browser bestätigt.
- **Richtung:** Kundenkonto über Clerk-Appearance zentral auf Portal-Tokens und Interaktionsfarben abstimmen; unterstützte Übersetzungen auf die Portal-Anrede prüfen. Kein eigener Auth-Flow nötig. Regelbezug: Root-AGENTS „Theme/Design“ und Portal-AGENTS „Texte“.

## Architektur und Einordnung

Die Grundlage ist sinnvoll geteilt: Shell/Widgets, Dialoge, Tabellen, Dateivorschau, Formularfelder und Uploadrahmen stammen überwiegend aus `@invessiv/ui`; Portal-DTOs und gemeinsame Attachment-Komponenten vermeiden zweite Fachimplementierungen. Das verbleibende Muster sind ältere CSS-Resets (`.send.send`, `.trigger.trigger`, `.toggle.toggle`) und selbst gebaute Links/Controls. Neue Varianten gehören in gemeinsame Komponenten, statt diese Ausnahmen lokal weiterzuführen.

Informationen wie blaue Fortschrittsbalken, nach Status gefärbte Prozessschritte, Erfolg/Fehler und die vorgeschriebenen bunten Widget-Reiter wurden bewusst nicht als CTA-Farbfehler gezählt. Geprüfte Checkboxen zeigen korrekt den Verlauf; die noch blaue Zeile im Chat-Picker ist davon getrennt (F03).

## Prüfungen und Grenzen

- Browser: Screenshots und DOM-/Computed-Style-Abgleich, echte Navigation mit dem Kundenkonto; keine JavaScript-`pageerror` in den protokollierten Hauptdurchläufen, kein horizontaler Dokumentüberlauf an den geprüften Breiten. Sichtprüfung von Desktop-/Mobile-, Light-/Dark-, Leer-, Formular-, Ergebnis- und Kontoansichten.
- Bedienung: Projektwechsel, Tabwechsel, Round-/Step-Navigation und Browser-Zurück funktionieren. Tab blieb im geprüften Dialog; Escape schließt nach dem UI-Update. Auf Touch sendet Enter keine Nachricht. Leere Aufgaben-Eingabe zeigt den Pflichtfehler; vollständiges Onboarding verlangt vor Absenden eine zusätzliche Bestätigung.
- Simuliert, nicht als echte Kontodaten ausgegeben: Zugangsdaten leer und HTTP-500 nur durch ersetzte GET-Antworten im Browser; Retry gegen echten Endpunkt erfolgreich. Keine Serverdaten dafür verändert.
- `pnpm --filter @invessiv/workspace lint`: **0 Fehler, 1 Warnung** (`src/server/tests/workspace/crm/command-handler/update-project.command-handler.test.ts:189`, ungenutztes `_omitted`).
- `pnpm --filter @invessiv/ui exec vitest run src/components/empty-state src/components/message-thread src/components/dialog src/components/checkbox-control src/components/custom-select`: **4 vorhandene Testdateien, 25 Tests bestanden**. Nicht jeder angegebene Komponentenordner besitzt einen eigenen passenden Test. Sandbox-Start zunächst mit `spawn EPERM` gescheitert; freigegebener Wiederholungslauf erfolgreich.
- Impeccable-Detektor einmal ausgeführt: generelle Warnungen zu Verlaufstext sind hier wegen des ausdrücklich gewünschten CTA-Systems keine Findings. Keine messbare Performance-Störung aus seinen Animationshinweisen abgeleitet. Ergänzend [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) für Fokus, Controls und Hover abgeglichen.
- **Nicht vollständig geprüft:** WebKit/Safari auf echtem Gerät, vollständige WCAG-/Kontrastmessung, Lighthouse/Produktionsperformance, sämtliche DE/EN × Theme × Geräte-Kombinationen, Upload/Download/ZIP bis zum Datentransfer, erfolgreiche Schreibaktionen, E-Mail-/Kalenderziele bis zum externen Abschluss, Kontoänderungen und verschachtelte Clerk-Änderungsformulare.
- **Mit diesem Datenstand nicht real erreichbar:** Mehrfirmen-/projektloser Zustand, frische Einladung, offene editierbare Feedbackrunde mit leeren Punkten/Rückfrage-Antwortformular, abgeschlossene Projekte als eigenes Widget, leere Stundenkäufe, leere eigene Leistungsanfragen/Katalog. Zustandszweige im Code berücksichtigt; keine vollständige Browserabdeckung behauptet. Die hinterlegte Kalender-URL zeigt im Testbestand auf eine allgemeine Google-Seite; vor Release mit echten Kundendaten gesondert verifizieren.
- Keine Seeds, Migrationen oder schreibende Bestands-E2E-Suite gestartet. Keine Aufgaben abgehakt, Anfragen gestellt, Dateien hochgeladen, Geheimnisse aufgedeckt oder Freigaben/Abnahmen bestätigt. Chatöffnung kann den vorgesehenen Lesestand aktualisieren; temporäre Chat-Eingaben wurden wieder geleert.
- **Merge-Gates offen:** vollständiges Monorepo-Lint/Typecheck/Test, App-Build, Conversion-/A11y-Gates und erneute Sichtprüfung nach Fixes. Dieser Bericht ist keine Merge-Freigabe. Gemeinsame UI-Änderungen vor Umsetzung nach `packages/ui/AGENTS.md` mit ihrer tatsächlichen Reichweite abstimmen.

## Vorschläge zur Skill-Verbesserung

Keine zusätzliche Regel nötig: Token-Prüfung, lokale Komponenten-Overrides, alternative Zustände und belegte Abdeckungslücken sind bereits im Review-Skill enthalten. Kein Skill verändert.

## Umsetzungsstand · 25.10.2026

Die zehn Findings sind im Code umgesetzt. **F01–F09 sind mit Komponentenprüfungen und isolierten Browser-Fixtures nachgeprüft. F10 ist implementiert und durch Übersetzungstests abgesichert; die visuelle Abnahme der angemeldeten Clerk-Kontoansicht bleibt offen.** Der ursprüngliche Audit oben bleibt als historische Bestandsaufnahme erhalten. Kein Commit, PR oder Merge wurde erstellt.

| Finding | Umsetzung                                                                                                                                                                                                                                                                                           | Nachprüfung                                                                                                                                                                             |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F01     | `EmptyState` nimmt eine Font-Awesome-Definition entgegen und rendert zentral `ActionIcon` auf neutraler Fläche. Sämtliche Aufrufer in Portal, CRM und Settings migriert; der alte interne Listen-Leerzustand verwendet denselben Baustein.                                                          | Gefilterte/leere Fixture, vollständige Workspace-Tests, Typecheck.                                                                                                                      |
| F02     | Lokale Button-Resets für Senden, Nachladen, neue Nachrichten und Retry entfernt. Primary/Secondary kommen aus dem bestehenden Button-System. Der Composer erhält den gemeinsamen Fokusring auf einer separaten Hülle, damit die Textarea-Höhenreplik nicht denselben Pseudoselektor belegt.         | Chat-Senden als berechneter Verlauf, Nachladen/Retry in Fixture, MessageThread-Tests; Touch-Enter bleibt Zeilenumbruch.                                                                 |
| F03     | Büroklammer `size="icon"`, Menüaktionen `size="control"`, ohne lokale Button-Overrides. Dateipicker verwendet `OptionTile` und `FormField`; Dateiname und Metadaten behalten ein reines Inhaltslayout.                                                                                              | Anhangmenü öffnen, Datei markieren, Verlaufsrahmen berechnen, Dialog per Escape schließen; acht Browserkombinationen.                                                                   |
| F04     | Dateinamen in `FileEntryRow` verwenden `QuaternaryCta`; Vorschau, Download und externe Dateiaktion die gemeinsamen Icon-Buttons/Links. Auswahlfläche im dezenten Aktionsverlauf. Destruktive Zusatzaktionen behalten Rot über einen opt-in `data-tone="danger"`-Stil im Button selbst.              | Dateizeilen-Fixture, FileEntryRow-Tests und interne Verwendungen in der Workspace-Suite.                                                                                                |
| F05     | Prüfschritt, Feedback-Aufklappen, Termin-Fallback, Projektbesuch, Credential-URL und automatisch erkannte Antwortlinks auf gemeinsame Text-/Secondary-CTAs umgestellt.                                                                                                                              | Feedback-/Termin-/Antwort-Fixtures, Prüfschritt mit Rücksprung und Fokus; Portal-/Workspace-Tests.                                                                                      |
| F06     | Antwortleser und Vorlagenvorschau verwenden `FormRequiredMarker`. Der Stern bleibt dekorativ, die Pflicht-Erklärung bleibt als Screenreader-Text erhalten.                                                                                                                                          | Je 14 gemeinsame Marker in Lese-/Vorlagen-Fixture, DE/EN; bestehende Leser-Tests.                                                                                                       |
| F07     | App-neutraler `ScaleControl` im UI-Paket mit Options-Contract unter `packages/common`, kontrolliertem Wert, optionalen Pol-/Stufenlabels, Disabled und kompakter Leseansicht. Der App-Adapter liefert weiterhin exakt fünf Stufen.                                                                  | Vier neue Control-Tests; native Pfeiltasten, Auswahl, Zurücksetzen, Disabled, Touch und Fokusring im Browser.                                                                           |
| F08     | Einladungsaktionen nutzen `PrimaryCtaLink`/`SecondaryCtaLink` mit Next-Link.                                                                                                                                                                                                                        | Einstiegs-Fixture und bestehende Einladungs-/Route-Tests; kein echter Einladungstoken eingelöst.                                                                                        |
| F09     | Firmenauswahl nutzt Secondary-Links; Firmenwechsel bleibt echte Linknavigation. Vorhandener `useDismissibleDetails` schließt bei Escape, Außenklick und Fokuswechsel.                                                                                                                               | Zwei zusätzliche Dismiss-Tests, Linkziele aus bestehenden Tests; Escape mit Fokusrückgabe und Außenklick in acht Browserkombinationen.                                                  |
| F10     | Zentrale Clerk-Appearance am gemeinsamen Provider für Portal und internen Workspace: Theme-Tokens, Schriften, Radien, Controls und gemeinsame Aktionsklassen. Unterstützte Konto-/Reverification-Texte in DE/EN-Dictionaries; rekursives Mischen erhält nicht überschriebene lokalisierte Defaults. | Drei Übersetzungstests, Typecheck und Produktionsbuild. Kein authentifizierter Clerk-Browserkontext in diesem Umsetzungslauf; Profil-/Sicherheitsdialoge deshalb noch visuell abnehmen. |

### Reichweite und Architektur

- Gemeinsame Änderungen gelten wie freigegeben auch für CRM, Settings und interne Listen. Für `EmptyState`, `MessageThread`, `FileEntryRow` und `LinkedText` wurden keine Verbraucher in `apps/web` gefunden. `apps/web` wurde nicht geändert; die neuen opt-in Adapter-/Gefahrstile verändern dort kein bestehendes Verhalten.
- Keine globalen Farbtoken geändert. Widget-Akzente, Informationsfarben, Prozessstatus, Erfolg/Fehler und kundenseitig gewählte Farben bleiben erhalten.
- Autosave, bedingte Sichtbarkeit, Validierung, Dateiübertragung, Berechtigungen und fachliche Antwortformate bleiben in der App. Keine API-, Datenbank-, Env- oder Dependency-Änderungen.
- Alte, nicht mehr verwendete Stylesheets des Skalen-Tracks und des internen Listen-Leerzustands entfernt. Dokumentierte CTA-Altlasten in `packages/ui/AGENTS.md` auf den tatsächlichen Stand gebracht.
- Clerk verwendet seine reguläre Appearance-/Localization-Schnittstelle. Die Token-Anbindung folgt der [Clerk-Dokumentation zu Appearance-Variablen](https://clerk.com/docs/nextjs/guides/customizing-clerk/appearance-prop/variables). Es wurde keine eigene Authentifizierung eingeführt.

### Onboarding-Abdeckung

Isolierte Fixture mit allen 14 Typen: Kurztext, Langtext, E-Mail, Telefon, URL, Einfachauswahl, Mehrfachauswahl, Ja/Nein, Skala, Farbe, Dateien, Bestätigung, Gruppe und Leistungsbestätigung. Zusätzlich ein bedingtes Feld. Die Fixture rendert die echten App-/UI-Komponenten; Speichern wird ausschließlich im Browser beantwortet. Keine vorhandenen Kundenbögen oder Serverdaten verändert.

Für **DE und EN × Dark und Light × 1440 × 1000 Desktop und 390 × 844 Chromium-Touch** wurden Eingabe, abgeschlossene Leseansicht und interne Vorlagenvorschau aufgerufen. Geprüft wurden alle Feld-Darstellungen, Pflichtmarker, Skalenwert/Fokus/Disabled/Reset, bedingtes Einblenden, ein simulierter Autosave, Prüfschritt und Fokusrücksprung, Anhangsauswahl, Dialog-Escape sowie Firmenwechsler-Escape/Außenklick. In allen acht Kombinationen keine `pageerror` und kein horizontaler Dokumentüberlauf. Vier Screenshots wurden ergänzend visuell angesehen; die automatisierte Matrix ersetzt keine vollständige manuelle Einzelabnahme jeder Ansicht.

Bestehende Tests prüfen zusätzlich Speicherfehler mit Retry, Formatfehler, bedingtes Ausblenden, Gruppen-Anlegen/Verschieben/Entfernen einschließlich Fokus und Bestätigung, Leistungsbestätigung, Datei-Anhängen/-Entfernen, Rechte und Navigation bei laufendem Upload. Ein echter Upload-Abbruch bis zur Storage-Infrastruktur wurde in diesem Lauf nicht ausgeführt.

### Qualitäts-Gates und Belege

| Prüfung                                   | Ergebnis                                                                                                                                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`                               | Grün, keine neuen Warnungen. Vorhanden: `_omitted` im Workspace-Server-Test und `<img>` im Web-Test; außerdem bekannte ESLint-Konfigurationshinweise.                                   |
| `pnpm typecheck`                          | Vollständiger Monorepo-Typecheck grün.                                                                                                                                                  |
| `pnpm test`                               | Vollständiger Lauf grün: 22 ESLint-Regeltests, Common 770, DB 165, Storage 23, UI 146, Web 552 und Workspace 4.086 bestanden. Workspace: 515 vorhandene Integrationstests übersprungen. |
| Gezielte Nachprüfung nach Konto-Ergänzung | 9 Testdateien, 92 Tests grün (Onboarding, gemeinsame Leser, Firmenwechsel, Konto-Texte); UI erneut 38 Dateien / 146 Tests grün.                                                         |
| `pnpm --filter @invessiv/workspace build` | Produktionsbuild grün. Vorhandene Turbopack-Warnung zum breiten Env-Dateimuster in `packages/db/src/core/env.ts`.                                                                       |
| Browser-Matrix                            | Acht Kombinationen erfolgreich; Eingabe, Lesen und Vorschau jeweils enthalten.                                                                                                          |
| `git diff --check`                        | Grün.                                                                                                                                                                                   |

Belege unter `portal-rebranding-fixes-2026-10-25/`: [Desktop Dark](portal-rebranding-fixes-2026-10-25/de-dark-desktop.png), [Mobile Light](portal-rebranding-fixes-2026-10-25/en-light-mobile.png), [Leser Desktop](portal-rebranding-fixes-2026-10-25/read-de-dark-desktop.png), [Leser Mobile](portal-rebranding-fixes-2026-10-25/read-en-light-mobile.png), [berechnete Zustände der Browser-Matrix](portal-rebranding-fixes-2026-10-25/results.json). Die Bilder zeigen ausdrücklich isolierte Testdaten, keine Kundenansicht. Temporärer Fixture-Server und Hilfsskripte werden vor Übergabe entfernt.

### Offene Abnahme und Rollback

- Angemeldete Clerk-Profil-/Sicherheitsansicht einschließlich verschachtelter Kontoformulare visuell in beiden Themes prüfen. Dafür lag in diesem Umsetzungslauf keine authentifizierte Browsersitzung vor. Insbesondere Clerk-generierte Avatarbilder lassen sich mit einer Appearance-Fläche allein nicht zuverlässig umfärben; vorhandene Benutzerbilder werden nicht verändert.
- Kein echter Storage-/Kalender-/E-Mail-Abschluss, kein WebKit auf echtem Gerät und keine neue Lighthouse-/vollständige WCAG-Messung. Diese Prüfungen werden nicht als bestanden ausgegeben.
- Vor Merge nach `master` bleibt ein unabhängiges Review erforderlich. Keine Merge-Freigabe durch diesen Umsetzungsnachtrag.
- Rollback: ausschließlich diesen UI-/Provider-/Dictionary-Diff zurücknehmen; keine Migration oder Datenrücknahme nötig. Security/Privacy: bestehende Guards und Übertragungswege unverändert, keine zusätzlichen Logs oder Analytics.
