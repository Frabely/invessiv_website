# Ordner 08 — Projektaufgaben

> **Status:** offen · **Abhängigkeiten:** 07, 07a–07c · **Aufwand:** 4–5 Tage · **Reviewziel:** 6 Changesets à 20–40
> Dateien · **Neu geplant:** 21.09.2026 (mit dem Nutzer abgestimmt)

## Ziel und Stand nach Merge

Aufgaben hängen an genau einem Projekt. Intern werden sie im Kunden-Cockpit je Projekt gepflegt, später sieht der
Kunde die für ihn freigegebenen Aufgaben im Portal. Jede Aufgabe hat einen Status, eine Seite, die gerade dran ist (wir
oder der Kunde), und einen internen Bearbeiter. Eine globale Tabelle über alle Projekte beantwortet „was ist
überfällig, was ist diese Woche fällig, worauf warten wir“; das Dashboard zeigt die eigenen überfälligen und bald
fälligen Aufgaben.

## Task-Pläne und Reihenfolge

| Datei                                                                | Task  | Inhalt                                                        | Sichtbar | Abhängig von |
| -------------------------------------------------------------------- | ----- | ------------------------------------------------------------- | -------- | ------------ |
| [`11-1-datenmodell-und-rechte.md`](./11-1-datenmodell-und-rechte.md) | 11-1  | Konstanten, Migration, Modell, Permissions `tasks.read/write` | nein     | —            |
| [`11-2-aufgaben-api.md`](./11-2-aufgaben-api.md)                     | 11-2  | Contracts, Handler, Routen, Activities                        | nein     | 11-1         |
| [`11-3-aufgaben-im-cockpit.md`](./11-3-aufgaben-im-cockpit.md)       | 11-3  | Aufgabensektion je Projekt im Kunden-Cockpit                  | ja       | 11-2         |
| [`11a-1-aufgabenuebersicht.md`](./11a-1-aufgabenuebersicht.md)       | 11a-1 | Globale Tabelle `/crm/tasks` mit URL-Filtern                  | ja       | 11-3         |
| [`11a-2-dashboard-block.md`](./11a-2-dashboard-block.md)             | 11a-2 | Dashboard-Block „Überfällig & bald fällig“                    | ja       | 11a-1        |
| [`11b-bearbeiter-uebergabe.md`](./11b-bearbeiter-uebergabe.md)       | 11b   | Offene Aufgaben in Deaktivierung/Übergabe mitzählen           | nein     | 11-2         |

Der Ordner bleibt eine Merge-Einheit auf `feat/crm-aufgaben` (Regel „ein Ordner = ein Branch“ aus
`plans/crm/AGENTS.md`). Jeder Task ist ein eigenes, reviewbares Changeset wie bei Ordner 03d und hinterlässt einen
deploybaren Stand: unsichtbare Tasks (11-1, 11-2, 11b) liefern keine UI, die auf Fehlendes zeigt. Deshalb kann jeder
Task auch einzeln gemerged werden; das ist eine bewusste Abweichung von „ein Ordner = ein PR“ und wird je Task
entschieden. 11a-2 und 11b können parallel zu 11a-1 laufen, sobald ihre Abhängigkeit steht.

## Entscheidungen

| Bereich      | Entscheidung                                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Kontext      | Genau ein Projekt. Keine Kundenspalte: der Kunde folgt aus dem Projekt (wie bei `project_line_items`). Keine internen Aufgaben ohne Projekt, keine Aufgaben direkt am Kunden                     |
| Flach        | Kein Parent, keine Unteraufgaben, keine Checklisten, keine Handsortierung (`sort_order`)                                                                                                         |
| Status       | `open`, `in_progress`, `done`, `cancelled`. `cancelled` ersetzt Löschen; es gibt keinen Löschpfad. Eine Aufgabe verschwindet nur mit ihrem Projekt (`ON DELETE CASCADE`)                         |
| Wer ist dran | `action_side`: `internal` (wir) oder `customer`. „Warten auf Kunde“ ist `action_side = customer` bei offenem Status, kein eigener Status                                                         |
| Bearbeiter   | Immer genau ein aktives internes Mitglied (`assignee_member_id`). Standard: Projekt-Owner; bei Anlage und später änderbar. Ein Owner-Wechsel am Projekt überschreibt ihn nicht                   |
| Warum        | Auch bei Kundenaufgaben muss intern jemand nachhaken. Der Kunde sieht später nur „Wir“ oder „Sie“, nie den Mitarbeiternamen                                                                      |
| Sichtbarkeit | `visible_to_customer`, Standard **aus**. `action_side = customer` erzwingt `true` (DB-CHECK und Handler), sonst könnte der Kunde nie handeln. Bis zum Portal (Ordner 13) ohne Wirkung nach außen |
| Fälligkeit   | Nur Datum (`due_on`), Geschäftszeitzone Europe/Berlin. Keine Uhrzeit                                                                                                                             |
| Überfällig   | `due_on < heute (Europe/Berlin)` und Status `open` oder `in_progress`. „Bald fällig“: `due_on` heute bis heute + 7 Tage                                                                          |
| Abschluss    | `completed_at` + `completed_by_member_id`, gesetzt genau bei `done` (DB-CHECK). Wiederöffnen (`done` → `open`/`in_progress`) ist intern erlaubt und wird als Activity protokolliert              |
| Nachvollzug  | Anlage, Status-, Bearbeiter-, Seiten- und Sichtbarkeitswechsel schreiben je eine Activity mit `customer_id` und `project_id`                                                                     |
| Rechte       | `tasks.read`, `tasks.write`, beide bindbar (`scope_assignable = true`) wie `project_line_items.*`. Kundenbindung gilt für alle Projekte des Kunden, Projektbindung nur für dieses Projekt        |

## Bewusst nicht in Ordner 08

- **Vorlagen / Onboarding-Checkliste** (alter Task 12): zurückgestellt nach
  [`../zurueckgestellt/12-onboarding-checkliste.md`](../zurueckgestellt/12-onboarding-checkliste.md); eigener Ordner
  nach Nutzung der Aufgaben.
- **Glocke mit Benachrichtigungen** zu überfälligen/bald fälligen Aufgaben: Ordner 10 (Outbox und Benachrichtigungen).
  Bis dahin übernimmt der Dashboard-Block (Task 11a-2) diese Rolle.
- **Portalsicht** und **vom Kunden gestellte Aufgaben**: Ordner 13. Dort entstehen die Portal-Query (filtert
  `visible_to_customer = true` im `WHERE`) und additiv die Herkunft (`created_by_side`).
- **Serien und Reminder**: Ordner 09.
- **Kommentare und Anhänge** an Aufgaben: nicht geplant; Austausch läuft über den Kundenchat (Ordner 17/18).
- **Uhrzeit** an der Fälligkeit: nicht geplant.

## Merge-Gate (Ordner gesamt)

- [ ] DB verhindert: Aufgabe ohne Projekt, Kundenaufgabe unsichtbar, `done` ohne Abschlussdaten, Abschlussdaten ohne
      `done`, leeren Titel.
- [ ] Jede Aufgabe hat genau einen aktiven internen Bearbeiter; inaktive Mitglieder sind als neuer Bearbeiter
      abgewiesen.
- [ ] Jeder Aufgaben-Endpunkt steht in `CRM_ENDPOINT_ACCESS_RULES`; jede Query filtert über `accessScope`, jeder
      Schreibpfad prüft `canOn`. Negativtests für fremden Kunden und fremdes Projekt, fremdes Projekt antwortet 404.
- [ ] Liste im Cockpit, globale Tabelle und Dashboard-Block nutzen dieselbe Definition von „überfällig“ und
      „bald fällig“ (eine gemeinsame Pattern-Funktion, getestet).
- [ ] Status-, Bearbeiter-, Seiten- und Sichtbarkeitswechsel erzeugen nachvollziehbare Activities.
- [ ] Portalabfragen und Portal-UI werden nicht aktiviert.
- [ ] `OwnableEntity.Task` ist registriert; Deaktivierung zählt offene Aufgaben mit (Task 11b).
- [ ] Alle Texte DE und EN; Dark und Light; mobil ab 360 px ohne horizontales Scrollen der Seite.

## Rollback

Aufgabensektion, Link auf `/crm/tasks` und Dashboard-Block ausblenden; Kunden und Projekte bleiben vollständig
nutzbar. Die additive Tabelle `tasks` und die Permissions bleiben bestehen.
