# Review: Portal-Dateiverwaltung – UI-Changeset

## Umfang und Gesamturteil

- Stand: Branch `feat/portal-ui-optimierung`, HEAD `c9e479f8`. Geprüft wurde der lokale Arbeitsstand gegenüber HEAD einschließlich neuer, noch unversionierter Dateien. Die separat vorgemerkte, im Arbeitsbaum fehlende `portal-step-events.ts` gehört nicht zum Datei-UI-Umbau und wurde nur inventarisiert.
- Kernumfang: Dateiseite mit festem Kopf und Fußleiste, lokalem Projektfilter, responsivem Upload-Einstieg, klickbaren Dateizeilen und Desktop-Vorschau. Mitgeprüft: gemeinsam genutzte Datei-Komponenten, Extraktion der Seitenleiste aus `PortalStepBar`, Button-Abstand und die beiden entfernten Icon-Abstände.
- **Ein bestätigtes Finding (P2): Eine laufende Video-Vorschau wird beim Öffnen der Lightbox nicht pausiert.** Keine weiteren belastbaren neuen Fehler im untersuchten Zusammenspiel gefunden. Das ist keine vollständige Sicherheits- oder Browserfreigabe der App.
- Keine Codekorrekturen, neuen Tests, Commits oder Änderungen an Regeln/Skills vorgenommen. Einzige dauerhafte Review-Ausgabe ist dieser Bericht.

## Findings

### F01 · P2 · Video läuft beim Wechsel vom Seitenpanel zur Lightbox im Hintergrund weiter

- **Fundstellen:** `apps/workspace/src/components/portal/files/portal-files-view/portal-files-view.tsx:327,349,394`, `packages/ui/src/components/files/file-preview-panel/file-preview-panel.tsx:94`, `packages/ui/src/components/files/file-preview-stage/file-preview-stage.tsx:69`.
- **Problem und Auswirkung:** Ab 1100 px ein Video im Seitenpanel starten und anschließend „Vollbild“ wählen. Der Handler setzt ausschließlich das Preview-Overlay; das Panel mit seinem bestehenden `<video>` bleibt eingebunden, während die Lightbox eine zweite `FilePreviewStage` erzeugt. Es gibt weder eine Pause-Anweisung noch eine Bindung der Panel-Wiedergabe an den Overlay-Zustand. Das erste Video läuft hinter dem modalen Dialog weiter und ist dort nicht bedienbar; startet man den zweiten Player, können zwei Tonspuren gleichzeitig laufen. Auch beim Öffnen des Upload- oder Link-Dialogs bleibt die Panel-Wiedergabe aktiv.
- **Absicherung:** Renderpfad und Handler vollständig nachvollzogen. Ein isolierter Chromium-Check mit laufendem Video und anschließendem `dialog.showModal()` lieferte `pausedBeforeModal: false` und `pausedWhileModalOpen: false`: Der native Modalzustand pausiert das Medium nicht automatisch. Das ist eine Browserprüfung des zugrunde liegenden Verhaltens, kein authentifizierter E2E-Lauf der Portalseite. Die vorhandenen Panel-/Lightbox-Tests prüfen diesen gemeinsamen Wiedergabe-Lifecycle nicht.
- **Empfehlung:** Bei aktiver Lightbox bzw. einem anderen modalen Overlay die Panel-Wiedergabe explizit pausieren oder das Panel-Medium vorübergehend ausbinden. Den Medien-Lifecycle im gemeinsamen Vorschau-Baustein kapseln und die Aktivität vom Orchestrator übergeben. Einen Regressionstest für „laufendes Panel-Video → Vollbild“ ergänzen.

## Architektur und Zusammenspiel

- **Wiederverwendung ist sinnvoll:** `FilePreviewStage` und `useFilePreviewSource` bündeln Medien-Darstellung und URL-Erneuerung; `FileEntryMeta` vereinheitlicht Metadaten. `FilePickButton` und `FileDropZone` verwenden denselben Auswahl-Hook. `PortalPageBar` trägt das gemeinsame Layout der Datei-, Onboarding- und Feedback-Fußleisten. Neue Contracts und Varianten liegen in `packages/common`; keine neue Dependency.
- **Portal bleibt getrennt:** Die Seite authentifiziert über `requirePortalReader`, nutzt Portal-DTOs und bindet Uploadrechte serverseitig. Liste und Download verwenden weiterhin die bestehenden Portal-Endpunkte und Sichtbarkeitsfilter. Das Changeset enthält keine Änderungen an Server-Handlern, Client-API-Services, DB oder Storage. Der bekannte Development-OIDC-Konfigurationsfehler aus der vorangehenden Untersuchung ist kein neuer UI-Befund.
- **URL-State:** Tab, Scope, ZIP-Auswahl und Panel-Datei werden über die vorhandene URL-Infrastruktur geführt. Der Scope-Wechsel entfernt ZIP- und Panel-Auswahl; die initiale Dateiliste ist zusätzlich an das Projekt gebunden. Das Panel löst seine Datei nur gegen die tatsächlich geladene Liste auf.
- **Bedienung und Sprachen:** Native Buttons/Links bleiben hinter der vergrößerten Zeilen-Klickfläche erhalten; Checkbox und Download sind getrennte Ziele. Das neue SegmentedControl besitzt Radiogroup-Semantik und Pfeiltastenbedienung. Änderungen an den Datei-Dictionaries sind parallel in DE und EN vorhanden. Eine vollständige WCAG-Abnahme wurde nicht durchgeführt.

## Abdeckung

- **Geänderten/neuen Produktivcode und zugehörige Tests vollständig gelesen:** Dateienroute einschließlich Loading-Zustand; `portal-files-view`, `portal-file-list`, `portal-file-row`, `portal-file-project-label`, `portal-files-bar`; `portal-page-bar` und `portal-step-bar`; `use-portal-files`, `use-media-query`, Query-Konstanten; neue Datei-Contracts und Preview-Varianten; gemeinsame Dateizeile, Metazeile, Panel, Preview-Stage, Lightbox, Picker, Dropzone und SegmentedControl einschließlich Styles und Hooks. Die kleine Änderung am UI-Barrel wurde als Export-Diff geprüft.
- **Angrenzendes Verhalten geprüft:** StepFrame/StepHeader, Shell-Scrollregeln, paginierte Listen-Hooks, URL-/Auswahl-Hooks, Preview-/ZIP-Auswahl, Download-Hooks, Portal-Upload-/Link-Dialoge und der bestehende Client-Transport. Die vorhandene Datei-E2E-Spezifikation wurde gelesen, aber nicht ausgeführt. Die beiden fachfremden CSS-Dateien und der gemeinsame Button-Stil wurden ebenfalls gelesen.
- **Serverkontext gezielt geprüft:** Seiten-Guard, Datei-/Projektliste, Datei-Sichtbarkeits-Service und DTO-Mapping sowie Download-URL-Route und Handler. Keine erneute vollständige Prüfung der unveränderten Auth-, Upload-, Persistenz- und Storage-Infrastruktur.
- **Dokumentation:** Paket-K-Plan und die Änderungen an den Portal-/UI-Regeln geprüft; Paket L als ausdrücklich noch nicht implementierten Folgeplan eingeordnet. Thumbnails gehören nicht zur Abnahme dieses Changesets.

## Ausgeführte Prüfungen

- Workspace: `pnpm --filter @invessiv/workspace test src/components/portal/files src/hooks/shared/use-media-query.test.tsx src/common/constants/portal/portal-files-query-params.test.ts src/components/portal/onboarding src/components/portal/feedback` – **114 Tests in 10 Dateien grün**.
- Gemeinsame UI: `pnpm --filter @invessiv/ui test src/components/files src/components/file-drop-zone src/components/segmented-control` – **25 Tests in 10 Dateien grün**.
- Preview-Varianten: `pnpm --filter @invessiv/common test src/constants/ui/file-preview-stage-variants.test.ts` – **1 Test grün**.
- Workspace- und UI-Typecheck erfolgreich. UI-Lint und fokussierter ESLint-Lauf für Portal-Datei-Komponenten, neue Seitenleiste, StepBar, Media-Query-Hook, Dateilisten-Hook und Query-Konstanten erfolgreich. UI-Lint meldet lediglich den Hinweis der Next-Regel auf das fehlende `pages`-Verzeichnis des frameworkneutralen Pakets.
- `git diff --check` erfolgreich; Git weist auf bestehende LF/CRLF-Konvertierung hin.
- Isolierte Chromium-Prüfung des Video-/Dialog-Verhaltens bestätigt F01. Zusätzlicher CSS-Check des neuen Panels mit einem intrinsisch 4000 × 2000 px großen Beispielbild: Das Bild blieb innerhalb der 544 px breiten Panelspalte; kein horizontaler Überlauf in diesem Aufbau.

## Grenzen und verbleibende Abnahme

- Kein authentifizierter Browserlauf mit realen Portal-Daten, keine Live-Uploads oder externen Datenänderungen im Review. Keine neue Prüfung der Vercel-Konfiguration.
- Noch auszuführen: reale Upload-/Link-/ZIP-Flows auf Desktop und Mobilgerät, Dark/Light-Sichtung, vollständiger Keyboard-/Fokus-Smoke und die E2E-Datei-Spezifikation mit geeigneter Testumgebung.
- Kein Produktionsbuild und keine vollständigen Monorepo-Gates in diesem fokussierten Review. Die grünen Unit-Tests schließen F01 nicht aus.

## Vorschläge zur Skill-Verbesserung

Keine zusätzliche Regel erforderlich. Das Zusammenspiel gleichzeitig eingebundener Vorschauen und modaler Ansichten fällt bereits unter Lifecycle-, Zustands- und Browserprüfungen des bestehenden Skills.

## Korrektur nach Beauftragung

- **F01 behoben:** Die Portalansicht deaktiviert die Panel-Wiedergabe bei jedem geöffneten Overlay über `playbackEnabled`. `FilePreviewPanel` reicht den Zustand an die gemeinsame `FilePreviewStage` weiter; diese pausiert ihr Video explizit. Das Video bleibt eingebunden, seine Abspielposition erhalten. Schließen eines Dialogs startet es nicht automatisch erneut.
- Zwei neue Regressionstests prüfen Vollbild- und Link-Dialog einschließlich Pause-Aufruf, beibehaltenem Videoelement und Abspielposition sowie ausbleibendem automatischen Neustart. Beide Tests scheiterten vor der Korrektur und bestehen danach.
- Nach der Korrektur: **36 Tests grün** (18 Portal-Dateiansicht, 18 gemeinsame Datei-UI), Workspace-/UI-Typecheck und fokussierte ESLint-Prüfungen erfolgreich. `git diff --check` erfolgreich. Kein neuer vollständiger Build oder authentifizierter E2E-Lauf.
