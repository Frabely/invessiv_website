# Nacharbeiten aus dem Portal-Prozesstest (bugs.txt)

> **Stand:** 03.10.2026 · **Quelle:** [`bugs.txt`](../../../deleteable/bugs.txt) · **Status:** Paket A done (Merge offen); B im Review (Merge offen); C–H offen.
> Die Task-Kürzel (A1, B2 …) sind bewusst keine CRM-Task-Nummern; wer ein Paket in `plans/crm/` übernimmt, vergibt
> dort die nächste freie Nummer (aktuell höchste: Task 70, Migration 0050).

## Ziel

Alle Punkte aus `apps/workspace/deleteable/bugs.txt` sind in kleine, einzeln lieferbare Tasks zerlegt und nach
Dringlichkeit und Aufwand geordnet. Zusätzlich ist der Standard-Onboarding-Bogen inhaltlich geprüft: ein einziger,
sauber geordneter Standardbogen „Website-Onboarding“, der alles Wichtige behält, aber deutlich weniger Pflichtfelder
und keine doppelten Fragen hat.

## Getroffene Entscheidungen (03.10.2026)

| Thema                            | Entscheidung                                                                                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Standardbogen                    | „Landingpage ausführlich“ wird überarbeitet, umbenannt in „Website-Onboarding“ und beim Start vorausgewählt. „Landingpage kompakt“ und die Kompakt-Bausteine werden archiviert.                      |
| Bausteinnamen                    | Bausteine bekommen sprechendere Titel. Die inhaltliche Prüfung der einzelnen Bausteine macht der Owner separat; dieser Plan liefert den Vorschlag.                                                   |
| Telefon Hauptansprechpartner     | optional                                                                                                                                                                                             |
| Feedbackrunde abschließen        | Der Projektschritt rückt automatisch vor. „Nächste Runde übergeben“ wird nur angeboten, wenn die nächste Runde direkt folgt.                                                                         |
| Aufgabe abhaken (Portal)         | Erledigte Aufgaben bleiben sichtbar. Der Kunde kann nur eigene Haken zurücknehmen.                                                                                                                   |
| Aufgabe für uns anlegen          | Eigene Funktion im Aufgaben-Widget, entsteht als echte Aufgabe. Intern annehmen, bearbeiten, ablehnen über die vorhandene Aufgabenverwaltung. Leistungsanfragen (Ordner 13c) bleiben davon getrennt. |
| Buchungslink                     | Projektbetreuer zuerst, Rückfall auf Kundenbetreuer (wie heute `findBookingContact`). Nur ein Link, der im neuen Tab öffnet; kein eingebetteter Kalender.                                            |
| Bearbeiter einer Kundenaufgabe   | Projektbetreuer, sonst Betreuer des Kunden.                                                                                                                                                          |
| Projektwerte im Cockpit (bugs 5) | Verhalten ist richtig und bleibt; kein Task.                                                                                                                                                         |

## Reihenfolge und Aufwand

| Paket                                        | Inhalt                                                            | bugs.txt                       | Aufwand      | Branch                                | Status             |
| -------------------------------------------- | ----------------------------------------------------------------- | ------------------------------ | ------------ | ------------------------------------- | ------------------ |
| [A](./A-feedbackrunden-projektschritt.md)    | Feedbackrunden und Projektschritt                                 | High Prio                      | 1–1,5 Tage   | `fix/crm-feedback-projektschritt`     | done (Merge offen) |
| [B](./B-cockpit-kleinteile.md)               | Kleine Cockpit-Korrekturen                                        | 1, 4, 7 (5 bleibt, wie es ist) | 1 Tag        | `fix/crm-cockpit-kleinteile`          | im Review          |
| [C](./C-onboarding-bogen-bearbeiten.md)      | Onboarding intern: Vorlage nachträglich, Bausteine mehrfach       | 2, 3                           | 1,5–2 Tage   | `fix/crm-onboarding-bogen-bearbeiten` | offen              |
| [D](./D-standardbogen-website-onboarding.md) | Standardbogen „Website-Onboarding“                                | Todo-Block                     | 1,5–2 Tage   | `feat/crm-onboarding-standardbogen`   | offen              |
| [E](./E-portal-navigation-und-termin.md)     | Kleine Portal-Korrekturen: Logo, Zurück-Link, Buchungslink        | 8, 10, 11, 14                  | 1–1,5 Tage   | `fix/portal-navigation-und-termin`    | offen              |
| [F](./F-portal-projektwechsel.md)            | Projektwechsel im Portal und projektbezogene Widgets              | 6, 9                           | 3–4 Tage     | `feat/portal-projektwechsel`          | offen              |
| [G](./G-portal-aufgaben.md)                  | Portal-Aufgaben: erledigte sichtbar, zurücknehmen, selbst anlegen | 12, 13                         | 3–4 Tage     | `feat/portal-aufgaben`                | offen              |
| [H](./H-grosse-arbeiten.md)                  | Große Arbeiten (nur vorgemerkt)                                   | „Große Arbeiten“               | eigener Plan | —                                     | offen              |

A bis E sind voneinander unabhängig. G baut auf F auf (eine neue Kundenaufgabe gehört zum gewählten Projekt).
E3 sollte vor F4 liegen, weil F4 das Ansprechpartner-Widget auf den Projektbetreuer umstellt.

## Regeln, die für alle Pakete gelten

- Portal-Handler nur unter `src/server/portal/`, kein `customerId` aus dem Request-Body, Lesen über `PortalReader`,
  Schreiben nur über `withPortalActor`; jeder neue Portal-Endpunkt mit Cross-Customer-Negativtest.
- Jeder neue CRM-Endpunkt in `CRM_ENDPOINT_ACCESS_RULES` mit Negativtests für fremden Kunden und fremdes Projekt.
- Texte nur in den Dictionaries, DE und EN gleichzeitig, Portal in Du-Form.
- Migrationsnummer beim Schreiben ermitteln; SQL-Formatierung nach `packages/db/AGENTS.md`.
- Kein Auto-Commit; Prettier nur auf einzelne geänderte Dateien (CRLF).

## Abnahme

- **Je Paket:** betroffene Unit- und Integrationstests, danach `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`,
  `pnpm --filter @invessiv/workspace build`; bei Migrationen `db:migrate` und `db:smoke` gegen die Dev-DB.
- **Paket A von Hand:** Projekt mit Schritten wie im Beispiel; Runde 1 abschließen → Anzeige und Bearbeiten-Dialog
  zeigen „Entwicklung“; „Schließen“; Runde 2 über den Kopf-Button übergeben; Runde 2 abschließen → Dialog bietet
  Runde 3 an; „Später“; Runde 3 danach übergeben.
- **Paket D von Hand:** siehe D5.
- **Pakete E bis G von Hand im Portal** mit einem Kunden mit zwei laufenden Projekten: Projekt wechseln, jedes Widget
  und die Dateiseite zeigen nur das gewählte Projekt; Logo führt zum Überblick; Zurück-Link auf allen Unterseiten;
  Termin buchen im Feedback-Gespräch und beim Ansprechpartner; Aufgabe abhaken, zurücknehmen, selbst anlegen, intern
  ablehnen und im Portal als „Abgelehnt“ sehen.
