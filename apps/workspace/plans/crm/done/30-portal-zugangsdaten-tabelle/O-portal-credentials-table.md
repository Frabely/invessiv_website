# Paket O – Portal-Zugangsdaten als Tabelle

Status: **gemerged** am 18.10.2026 (`e1bd575d`). Die Nachträge bis einschließlich Nachtrag 4 beschreiben den Endstand.

## Context

Der Zugangsdaten-Dialog im Portal (`?widget=credentials`) ist noch eine gruppierte Liste mit großen Faktenblöcken
pro Eintrag (Adresse, Benutzername, Passwort, Notiz untereinander, Text-Buttons „Anzeigen/Kopieren/Ändern“).
Stunden-Dialog (Paket N) und Dateien (Paket M) nutzen inzwischen `DataTableLayout` mit fester Höhe, scrollenden
Zeilen und Mobile-Cards. Ziel: Zugangsdaten passen optisch und im Verhalten dazu, sind kompakter und schneller
erfassbar, mit klarem Platz für „Zugang hinterlegen“ und schlankerer Copy. Branch: `feat/portal-ui-optimierung`.

**Feedback zur Tabellen-Idee:** passt gut. Zugänge sind gleichförmige Datensätze, die man überfliegt, um einen
bestimmten zu finden; die Aktionen pro Zeile sind immer dieselben. Mit `DataTableLayout` (Zellen nehmen beliebige
Kinder) geht auch das gemeinsame Aufdecken von Passwort und Notiz in einer Zelle – geprüft. Icon-only ist ok, weil
jede Aktion ein benanntes `aria-label` + `title` hat („Passwort von Hosting anzeigen“).

## Entscheidungen (mit Nutzer abgestimmt)

- Aktionsspalte mit drei Icon-Buttons (`ButtonControl` `size=Icon`, `variant=Quiet`): Anzeigen/Verbergen
  (`faEye`/`faEyeSlash`), Kopieren (`faCopy` → `faCheck`), Ändern (`faPen`, nur mit `canWrite`).
- **Auge deckt Passwort und Notiz gemeinsam auf**, falls der Eintrag eine Notiz hat; die Notiz steht unter dem
  Passwort in derselben Zelle (zwei protokollierte Abrufe, je Feld eigener Intent wie bisher). Kopieren kopiert nur
  das Passwort.
- Benutzername: ruhiges Kopier-Icon direkt in der Zelle.
- „Zugang hinterlegen“ wandert in den **Dialog-Footer** (`Dialog`-Prop `footer`), rechts, `PrimaryCtaButton` – wie
  „Datei hinzufügen“ in der Fußleiste der Dateiseite. Immer sichtbar, unabhängig vom Scrollstand.

## Tabelle

`DataTableLayout` mit `fillAvailableHeight`, `responsiveMode="cards"`, in einem Wrapper mit fester Höhe
(Muster `.tableArea` aus `portal-time-entry-list.module.css`, hier großzügiger, z. B. `min(30rem, 58dvh)`), damit
nur die Zeilen scrollen und der Tabellenkopf steht. Laden/Fehler/Leer stehen ohne Tabelle da (wie Stunden).

Spalten:

| Spalte                                | Inhalt                                                                                                | Mobile-Slot              |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------ |
| Zugang                                | Typ-Icon, Bezeichnung fett, Adresse als Link bzw. Typ-Label, „Geändert am …“ und „von dir hinterlegt“ | `primary` (Row-Header)   |
| Benutzername                          | einzeilig mit Ellipse + Kopier-Icon; leer bleibt die Zelle leer                                       | `detail` + `mobileLabel` |
| Passwort                              | Maske bzw. Klartext (Mono), bei Notiz darunter Notiz-Maske/-Klartext, Countdown-Balken, Fehlerzeile   | `detail` + `mobileLabel` |
| Projekt                               | nur wenn mindestens ein Eintrag projektgebunden ist; „Alle Projekte“ für allgemeine                   | `supportingSecondary`    |
| Aktionen (visuell versteckter Header) | drei Icon-Buttons                                                                                     | `actions`                |

Sortierung: allgemeine Zugänge zuerst, dann nach Projekt (Reihenfolge aus `groupCredentials` beibehalten, aber
geflacht). Gruppen-Überschriften entfallen.

`configured === false`: Aktionen sichtbar, aber deaktiviert, Hinweisbox über der Tabelle bleibt.
Owner-Sicht: kein Footer-Button, `PortalOwnerNotice` über der Tabelle (wie bisher), Aufdecken über `canReveal`.

**Nachtrag nach Sichtprüfung:** Eine eigene Spalte „Geändert“ machte die Tabelle im Wide-Dialog (840 px) zu breit
(Countdown lief in die Nachbarspalte, der Stift wurde abgeschnitten). Datum und „von dir hinterlegt“ stehen deshalb
in der Zugang-Zelle; der Benutzername ist einzeilig mit Ellipse (voller Wert im `title` und beim Kopieren), der
Countdown bricht in der schmalen Zelle unter den Balken um. Im Formular blendet `FormField` das native
Edge-Passwort-Auge aus, sobald ein eigener Suffix da ist (sonst zwei Augen).

## Architektur / Dateien

Aufdecken-Logik ist heute in `CredentialSecretField` gekapselt (Wert + Buttons + Ansagen in einem Baustein). In der
Tabelle liegen Wert und Buttons in verschiedenen Zellen, deshalb trennen – ohne Logik zu duplizieren:

1. **Neuer Hook `apps/workspace/src/hooks/shared/use-credential-secret.ts`**: kapselt `useRevealedSecret` +
   `wasShown` + Ansage-Text + `toggle()`/`copy()` (heute Zeilen 51–86 in `credential-secret-field.tsx`).
   Rückgabe-Typ nach `src/common/contracts/credentials/` (Export-Regel).
2. **Neuer geteilter Baustein `components/shared/credentials/credential-secret-value/`**: Maske/Klartext, Timer,
   Fehlerzeile, Live-Region (heute JSX/CSS aus `credential-secret-field`). Props: Zustand aus dem Hook, Labels,
   `multiline`, `showTimer`.
3. **`CredentialSecretField` refactoren**: nutzt Hook + `CredentialSecretValue`, rendert seine Text-Buttons wie
   bisher → CRM-Cockpit bleibt optisch und funktional unverändert.
4. **Username-Kopieren**: Copy-Feedback-Logik aus `credential-facts.tsx` (Zeilen 51–79) in Hook
   `hooks/shared/use-copy-feedback.ts` ziehen; `CredentialFacts` und die neue Zelle nutzen ihn.
5. **Portal neu**:
   - `components/portal/credentials/portal-credential-table/` – `DataTableLayout`, Spalten, `.tableArea`.
   - `components/portal/credentials/portal-credential-table-row/` – eine Zeile; hält zwei `useCredentialSecret`
     (Secret, Note nur bei `hasNote`); Auge ruft beide `toggle()`, ein Countdown (der des Passworts) sichtbar.
   - `portal-credential-row/` wird gelöscht (durch die Tabellenzeile ersetzt).
6. **`portal-credentials-dialog.tsx`**: Trust-Absatz, Aktions-Div und Gruppen-Sektionen raus; `footer` mit
   `PrimaryCtaButton` (Fokus-Ref `focus.targetRef(OverlayKind.Create)` bleibt); Tabelle statt Gruppen.
   `editButtonRef` geht an den Stift-Button der Zeile (Fokus-Rückkehr nach dem Formular bleibt).
   CSS: `.trust`, `.groups`, `.group*`, `.list` entfernen.
7. Doku: `apps/workspace/src/components/portal/AGENTS.md`, Abschnitt „Zugangsdaten“ um Tabelle, Footer, Notiz-Regel
   ergänzen; Plan-Datei unter `apps/workspace/plans/crm/<nächste Nr>-portal-zugangsdaten-tabelle/O-portal-credentials-table.md`
   (Nummer bei Umsetzung prüfen) vor der Implementierung ablegen.

Wiederverwendet: `DataTableLayout/Row/Cell/HeaderCell`, `ButtonControl`, `ButtonSize.Icon`, `ButtonVariant.Quiet`,
`PrimaryCtaButton`, `EmptyState`, `CredentialTypeIcon`, `toCredentialLink`, `groupCredentials`,
`formatTimestampDay`, `useDialogReturnFocus`, `PortalOwnerNotice`, `CREDENTIAL_LIMITS.autoHideSeconds`.

## Copy (DE + EN parallel, `copywriting`-Skill bei Umsetzung)

`dictionaries/portal/credentials/{de,en}.json`:

- `dialog.intro` (Dialog-Beschreibung, eine Zeile): „Ändert sich ein Passwort, trag es hier ein – wir arbeiten
  sofort mit dem neuen.“ (Der erste Satz „Hier liegen die Zugänge…“ sagt nur, was der Titel schon sagt.)
- `dialog.trust` **entfällt** in der Liste. Die Verschlüsselung steht weiterhin im Formular (`form.notice`) und im
  Leer-Zustand; „Jeder Abruf wird protokolliert“ ist Innensicht und gehört nicht prominent in die Kundenansicht.
- `empty.description` kürzen: „Meist brauchen wir drei: Domain-Anbieter, Hosting und E-Mail-Konto. Hinterlege sie
  hier statt per Mail – Passwort und Notiz speichern wir verschlüsselt.“
- Neu: `table.label`, `table.columns.{access,username,secret,project,changed,actions}`, `table.allProjects`,
  `row.fromYou` → „von dir“ (Du-Form, statt „Von euch hinterlegt“), `row.secretChanged` entfällt zugunsten der
  Spalte. `groups.*` entfällt, falls nirgends sonst genutzt.
- Dictionary-Typen (`PortalCredentialsDictionary`, `CredentialFactsLabels`) mitziehen; benannte Untertypen in
  `common/contracts/` statt Indexed Access.

## Tests

- `portal-credentials-dialog.test.tsx` anpassen: Tabelle, Footer-Button nur mit `canWrite`, Owner-Hinweis,
  Auge deckt Passwort + Notiz auf (zwei Reveal-Calls mit `Show`), Kopieren nur Secret (`Copy`), Stift öffnet Formular
  und Fokus kehrt zurück, `configured=false` deaktiviert.
- Unit-Test für `use-credential-secret` (Ansage-Logik, aus bisherigen Field-Tests übernommen) und `use-copy-feedback`.
- CRM-Tests `customer-credentials-section.test.tsx` müssen unverändert grün bleiben (Regression des Refactors).

## Verifikation

1. `pnpm --filter @invessiv/workspace lint`, `typecheck`, `test` (Portal-, Shared-, CRM-Credentials-Tests).
2. `pnpm --filter @invessiv/workspace build`.
3. Sichtprüfung per Playwright im Portal: Desktop (Tabelle, nur Zeilen scrollen, Footer steht), < 720 px
   (Mobile-Cards), Dark + Light, Aufdecken mit Countdown, Kopieren-Feedback, Owner-Sicht, Leer-Zustand.
4. CRM-Cockpit-Sektion Zugangsdaten kurz gegenprüfen (unverändert).
5. Nicht committen – Nutzer reviewed selbst.

## Nachtrag 2 (18.10.2026)

- Aktionen laufen über `TableRowActions` wie in den übrigen Tabellen; neue Größe `TableRowActionSize.Touch`
  (`packages/common/src/constants/ui/table-row-action-sizes.ts`) gibt 44-px-Ziele, mobil hinter ⋮.
- Der Dialog nutzt die neue Größe `DialogSize.Large` (1080 px). Damit hat „Geändert“ wieder eine eigene Spalte;
  „Von dir“ ist ein Badge neben dem Titel. Die Zugang-Zelle hat höchstens zwei Zeilen.
- Mobil stehen Benutzername, Passwort, Projekt und Geändert als Zeilen mit Beschriftung links und Wert rechts.

## Nachtrag 3 (18.10.2026)

- Spalte „Von“ mit `PortalOriginBadge` (`components/portal/shared/portal-origin-badge`), den jetzt auch die
  Dateitabelle nutzt; mobil steht es ohne eigenes Label rechts neben dem Datum in der Zeile „Geändert“.
- Anzeigen und Kopieren gehören zum Passwort und stehen in dessen Zelle (Raster: Wert links, Icons rechts,
  Countdown darunter), immer sichtbar. Zeilen-Aktion ist nur noch „Ändern“, mobil hinter ⋮. Die Tabellenkomponente
  blieb dafür unverändert.

## Nachtrag 4 (18.10.2026)

- „Ändern“ steht auf Desktop und Mobile direkt als `ButtonControl` (`Icon`, `Quiet`) in einer `DataTableCell`.
  Für eine einzelne Aktion entfällt das ⋮-Menü; die Fokus-Rückkehr geht immer zum sichtbaren Stift.
- Die nur hierfür eingeführten Änderungen an `TableRowActions` (Touch-Größe, Disabled-Stile, Menü-Fokus-Ref)
  und `TableRowActionSize` entfallen vollständig. Die 44-px-Klickfläche liefert der bestehende Icon-Button.
  Dies ersetzt die entsprechenden Entscheidungen in Nachtrag 2 und 3.
