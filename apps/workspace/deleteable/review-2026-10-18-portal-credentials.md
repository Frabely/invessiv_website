# Changeset-Review: Portal-Zugangsdaten

Stand: 18.10.2026, Branch `feat/portal-ui-optimierung`, HEAD `f2a4fc64`. Geprüft wurden die lokalen Änderungen gegen HEAD einschließlich vorgemerkter Löschungen und neuer, noch unversionierter Dateien (44 Dateien vor diesem Bericht). Kein Review der gesamten Branch-Historie gegen main.

**Nacharbeit auf Nutzerauftrag, 18.10.2026:** F01 und F02 behoben. Verbergen ist bei teilweise abgeschlossenem Reveal erlaubt und invalidiert beide Requests. Die mobile Fokus-Rückkehr registriert den sichtbaren Menü-Trigger über die neue generische `TableRowActions.menuTriggerRef`-Prop; Desktop registriert weiter den Stift. Regressionstests prüfen beide Antwortreihenfolgen mit verspäteter Antwort sowie mobile Rückkehr nach Speichern und Abbrechen. 116 fokussierte Tests, Workspace-/UI-Typechecks und gezieltes ESLint bestanden (UI-Paket mit bekanntem Next.js-pages-Hinweis). Der bestehende Browser-E2E wurde um mobile Rückkehr nach Speichern und Abbrechen erweitert, aber nicht ausgeführt. F03 bleibt unverändert offen. Die ursprünglichen Findings unten beschreiben den Review-Stand vor diesen Fixes.

## Gesamturteil

**Abschließende Eingrenzung, 18.10.2026:** Die globale Erweiterung von `TableRowActions` wurde vollständig zurückgenommen, einschließlich Touch-Konstanten und Tests. Credentials verwenden den bestehenden `ButtonControl` als direkt sichtbaren Stift in einer `DataTableCell`, auch mobil. Damit entfällt die Ursache von F02 ohne Menü-Fokus-Ref oder Media-Query. Fokus-Regressionstests und der mobile E2E-Ablauf wurden auf den direkten Stift angepasst; die frühere Nacharbeitsbeschreibung oben ist insoweit überholt.

**Weitere Nutzerentscheidung, 18.10.2026:** F03 ist als eng begrenzte Ausnahme in `packages/ui/AGENTS.md` dokumentiert. Nur das lokale Credentials-CSS darf Innenabstände und Trennlinien direkter Zeilenzellen setzen. Selektoren auf direkte Kinder eingeschränkt und redundantes `vertical-align` entfernt; keine globale Tabellenvariante eingeführt. Damit ist auch F03 für diesen Scope geklärt.

Zwei funktionale Regressionen (P2) und ein kleinerer Architekturverstoß (P3). Vor Freigabe sollten die mobile Fokus-Rückkehr und das Verbergen während eines teilweise abgeschlossenen Abrufs korrigiert werden. Keine neue Autorisierungs- oder Mandantentrennungslücke in den geprüften Pfaden gefunden; dies ist eine statische Aussage, kein durchgeführter Sicherheitstest gegen eine laufende Umgebung.

Die Aufteilung in Tabellen-Orchestrator, Zeile, geteilte Darstellung und Hooks ist nachvollziehbar. Die Extraktion von Aufdeck-/Ansage- und Benutzername-Kopierlogik vermeidet Duplikate zum CRM. Hooks, Statuskonstanten und Komponenten-Props sind passend abgelegt; Portal und Workspace verwenden weiter getrennte API-Bindungen. Der gemeinsame Auge-Button verbindet allerdings zwei unabhängig asynchrone Zustände, ohne den Fall „ein Wert sichtbar, der andere lädt noch“ korrekt zu behandeln.

## Findings

### F01 · P2 · Verbergen bleibt während des zweiten Abrufs deaktiviert

- **Fundstelle:** `apps/workspace/src/components/portal/credentials/portal-credential-table-row/portal-credential-table-row.tsx:190`, außerdem `toggleShown` ab Zeile 103 und die beiden unabhängigen `useCredentialSecret`-Instanzen.
- **Problem und Auswirkung:** Bei einem Zugang mit Notiz startet ein Klick zwei Requests. Sobald etwa das Passwort erfolgreich zurückkommt, ist es bereits sichtbar und der Button heißt „Verbergen“. Solange der Notiz-Request noch läuft, bleibt dieser Button durch `secret.isLoading || note.isLoading` deaktiviert. Der Nutzer kann ein sichtbares Geheimnis damit nicht sofort wieder maskieren; bei einem hängenden zweiten Request bleibt nur Auto-Hide, Tabwechsel oder Schließen. Der Transport in `src/client/shared/versioned-json-mutation-service.ts` setzt keinen eigenen Request-Timeout. Im alten Aufbau konnte das bereits geladene Feld unabhängig verborgen werden.
- **Empfehlung:** Das Verbergen immer erlauben, sobald mindestens ein Wert sichtbar ist; nur einen erneuten Start während des Ladens sperren. Beim Verbergen beide Hooks zurücksetzen, damit auch verspätete Antworten verworfen werden (die vorhandenen `hide()`-Methoden können das bereits).
- **Testlücke:** Der neue gemeinsame Reveal-Test löst beide Promises sofort auf. Ein verzögerter zweiter Request mit bereits sichtbarem ersten Wert wird nicht geprüft.

### F02 · P2 · Mobile Fokus-Rückkehr zielt auf einen versteckten Bearbeiten-Button

- **Fundstelle:** `apps/workspace/src/components/portal/credentials/portal-credential-table-row/portal-credential-table-row.tsx:276` (`ref={editButtonRef}`), gemeinsam mit `packages/ui/src/components/table-row-actions/table-row-actions.tsx:40`, dessen mobilem `.group`-CSS und `apps/workspace/src/hooks/shared/use-dialog-return-focus.ts:22`.
- **Problem und Auswirkung:** Unter 720 px liegt „Ändern“ im zunächst geschlossenen ⋮-Menü. Beim Öffnen des Formulars wird die Tabelle vollständig ausgehängt; nach Abbrechen oder Speichern entsteht `TableRowActions` mit `isMenuOpen=false` neu. Der Fokus-Hook findet den registrierten, nicht deaktivierten Stift-Button und ruft `.focus()` auf, obwohl dessen Gruppe `display:none` hat. Der Browser kann dieses Element nicht fokussieren; der Fallback wird nicht verwendet. Die Rückkehr zur ursprünglichen Zeile geht für Tastatur- und Screenreader-Nutzer verloren. Desktop funktioniert weiterhin.
- **Empfehlung:** Für mobile Rückkehr den sichtbaren ⋮-Trigger registrieren oder das Menü gezielt vor der Fokus-Rückkehr öffnen. Verfügbarkeit des Fokusziels muss auch seine tatsächliche Sichtbarkeit berücksichtigen.
- **Testlücke:** Die Fokus-Tests laufen in jsdom ohne das responsive CSS und können deshalb den versteckten Stift fokussieren. Der vorhandene E2E prüft mobile Ansichten nur für die Owner-Sicht ohne Bearbeiten-Aktion. Den Kundenfluss bei mobiler Breite nach Abbrechen und Speichern im Browser absichern.

### F03 · P3 · Neue Tabellenzeile überschreibt zentrale UI-Stile

- **Fundstelle:** `apps/workspace/src/components/portal/credentials/portal-credential-table-row/portal-credential-table-row.module.css:1` (`.row td, .row th`), außerdem `.row:last-child td/th`.
- **Problem und Auswirkung:** Die neue Portal-Zeile überschreibt Padding und Rahmen der aus `@invessiv/ui` verwendeten Tabellenzellen und von `TableRowActions`. Dies verletzt `packages/ui/AGENTS.md`, Abschnitt „Wer eine UI-Komponente nutzt, stylt sie nicht um“; eine begründete Ausnahme ist dort nicht dokumentiert. Dadurch liegen Dichte und Trennlinien derselben Tabellenbausteine zusätzlich im Portal und folgen künftigen zentralen Anpassungen nicht konsistent. Die passende neue `Touch`-Variante für Aktionsgrößen zeigt bereits den vorgesehenen Erweiterungsweg.
- **Empfehlung:** Benötigte kompakte Zelldichte und Trennlinien als app-neutrale Tabellenoption im UI-Paket bereitstellen und diese am Aufrufer wählen. Die fachliche Anordnung innerhalb der Zellen bleibt lokal.

## Abdeckung

Alle Dateien des lokalen Changesets wurden inhaltlich geprüft; gelöschte Dateien anhand ihres HEAD-Stands. Gruppierung der geprüften Änderungen:

- **Portal:** neuer `portal-credential-table` und `portal-credential-table-row` jeweils mit CSS; bisherige gelöschte `portal-credential-row`; `portal-credentials-dialog` mit CSS und Tests; neuer `portal-origin-badge`; Verwendung in `portal-file-table-row`.
- **Geteilte Credentials / CRM:** `credential-facts`, `credential-secret-field`, `credential-type-icon`, neue `credential-secret-value` und `credential-username-copy`, jeweils einschließlich CSS; CRM-`credential-row` und CSS.
- **Zustände / Logik:** neue `use-credential-secret` und `use-copy-feedback` samt Tests; `CopyFeedbackStatus` und Konstantentest.
- **UI-Pakete:** `DialogSize` und Test, Dialog-CSS; `FormField` und CSS; `TableRowActions` mit CSS und Tests; neue `TableRowActionSize` samt Test.
- **Texte / Dokumentation / E2E:** beide vollständigen Credentials-Dictionaries DE/EN, geänderte Portal-AGENTS-Regeln, neuer Umsetzungsplan und `portal-credentials.e2e.ts`.

Relevante unveränderte Zusammenhänge wurden zusätzlich verfolgt: `useRevealedSecret` (Fristen, Tabwechsel, Request-Invalidierung, Clipboard), `useDialogReturnFocus`, `usePortalCredentials`, `groupCredentials`, Portal-Credentials-API und gemeinsamer Transport, Portal-Formularbindung, Credentials-Contracts, `DataTableLayout` und seine Mobile-Cards sowie `Dialog` und dessen Fokusverhalten. Serverseitig wurden List-/Reveal-Handler, `portalCredentialService` und gemeinsamer `credentialRevealService` geprüft: Rechte und Kunden-/Projektfilter bleiben serverseitig; Listen enthalten nur Metadaten, jeder Feldabruf wird getrennt autorisiert und protokolliert. Keine Server-, Schema- oder Persistenzänderungen im Changeset.

Geprüfte Logik umfasst außerdem bedingte Projektspalte und Reihenfolge, leere Benutzernamen, sichere Link-Darstellung, Herkunftszuordnung für Credentials und Dateien, `canReveal`/`canWrite`/`configured`, Remount-Schlüssel bei Versions-/Berechtigungsänderungen, Footer-Erstellen, Formularwechsel, Kopierfeedback und neue UI-Größen. Hieraus keine weiteren belastbaren neuen Fehler abgeleitet. Die gemeinsamen Hooks bewahren die bisherigen Schutzmechanismen; der kombinierte Button verursacht F01.

## Prüfungen und Grenzen

- Workspace: 13 fokussierte Testdateien, **115 Tests bestanden** (neue Hooks, bestehender Secret-Hook, Portal- und CRM-Credentials, Konstanten).
- UI-Paket: Dialog, FormField, TableRowActions: **7 Tests bestanden**.
- Common-Paket: DialogSize und TableRowActionSize: **2 Tests bestanden**.
- **124 Tests insgesamt bestanden.** Erste Sandbox-Läufe waren mit `spawn EPERM` blockiert; Wiederholungen mit Freigabe außerhalb der Sandbox waren erfolgreich.
- Typecheck für Workspace, UI und Common: **bestanden**.
- Lint UI und Common: **bestanden**, jeweils mit ESLint-Hinweis auf fehlendes Next.js-`pages`-Verzeichnis im app-neutralen Paket.
- Workspace-Lint: **bestanden**, eine Warnung zu ungenutztem `_omitted` in der unveränderten `src/server/tests/workspace/crm/command-handler/update-project.command-handler.test.ts:189`.
- Kein App-Build, keine vollständigen rekursiven Merge-Gates und kein realer Clerk-/DB-E2E ausgeführt. Der E2E verändert Daten und Rollen; für diesen Review wurde keine externe Testumgebung eingerichtet. Keine Live-Browser-, Screenreader-, Kontrast- oder Theme-Prüfung. Die beiden funktionalen Findings sind aus dem konkreten Zustands-/CSS-Zusammenspiel belegt, nicht durch einen neuen Test reproduziert.
- Keine Änderungen an Produktivcode, Tests, Regeln oder Skills vorgenommen. Secret-Dateien, generierte Ausgaben und Dependencies wurden nicht als Changeset-Quellcode geprüft.

## Vorschläge zur Skill-Verbesserung

Keine Ergänzung erforderlich: Asynchronität, Teilfehler, Fokusbedienung und CSS-/Architekturregeln sind im bestehenden Review-Skill bereits enthalten.
