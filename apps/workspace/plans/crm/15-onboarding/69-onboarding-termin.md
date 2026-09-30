# Task 69 — Onboarding-Call: Buchungslink des zuständigen Mitarbeiters

> **Vor dem Start lesen:** [`README.md`](./README.md), [`67-portal-gruppen-dateien-leistungen.md`](./67-portal-gruppen-dateien-leistungen.md)
> (Portal-Widget `onboarding`), [`68-pruefung-und-nachforderung.md`](./68-pruefung-und-nachforderung.md)
> (`project-responsible-member-service`), `../00-entscheidungen.md`, `../AGENTS.md`, scoped `AGENTS.md` unter
> `src/server/workspace/access/`, `src/components/workspace/settings/`, `src/components/portal/`.
> Ersetzt den früheren Task 47 (Ordner 15c).

> **Status:** offen · **Teil-PR:** 15.7 · **Branch:** `feat/crm-onboarding-7-termin`
> **Abhängigkeiten:** Task 68 (15.6) gemerged · **Aufwand:** 1–2 T. · **Dateien:** 35–50
> **Migration:** ja, eine (`workspace_members.booking_url`; Nummer im Repo ermitteln)

## Ziel

Am Ende des Onboardings steht ein Gespräch. Statt Terminvorschläge per Mail zu tauschen, zeigt das Portal-Widget
**ab dem Absenden** den Buchungslink des für das Projekt zuständigen Mitarbeiters. Betreut ein Mitarbeiter die Kunden
1 und 2 und der Owner den Kunden 3, sieht jeder Kunde den richtigen Kalender. Eine eigene Terminverwaltung
(Verfügbarkeiten, Absagen, Kalendersync) ist bewusst nicht Teil dieses Tasks.

## Entscheidungen

| Bereich              | Entscheidung                                                                                                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ort des Links        | `workspace_members.booking_url`, nullable, nur `https`, max. 2 048 Zeichen                                                                                                                    |
| Pflege eigener Link  | Jedes Mitglied pflegt den eigenen Link über den Dialog „Mein Buchungslink“, erreichbar im Nutzerbereich der Workspace-Sidebar (`workspace-sidebar.tsx`)                                       |
| Pflege fremder Links | Nur mit `members.manage` in der Mitgliederverwaltung (`components/workspace/settings/members/member-row`, Aktion „Buchungslink“); jede Fremdänderung schreibt einen `security_events`-Eintrag |
| Auflösung            | Über `project-responsible-member-service` (Task 68): Projekt-Owner → Kunden-Owner, nur aktive Mitglieder; das erste gefundene Mitglied **mit** gesetztem Link gewinnt                         |
| Anzeige              | Im Widget `onboarding` (kein eigenes Widget) ab Status `submitted` oder `changes_requested` bis `completed`. Auf der Portal-Bogenseite nach dem Absenden zusätzlich als Karte                 |
| Klick-zum-Laden      | Zuerst Erklärtext mit Anbieterhinweis und Schaltfläche; erst danach wird das Fremd-Widget geladen bzw. der Link in neuem Tab geöffnet. **Kein Fremdskript beim Seitenaufruf**                 |
| Einbettung           | Version 1 öffnet den Link in einem neuen Tab (`rel="noopener noreferrer"`); keine Einbettung. Damit entfällt jedes Fremdskript im Portal                                                      |
| Anbieterhinweis      | Aus der Domain abgeleitet über `BOOKING_PROVIDERS` (Const-Objekt: `calendly.com` → Calendly, `cal.com` → Cal.com, sonst „externer Terminanbieter“); Texte in DE/EN                            |
| Kein Link hinterlegt | Statt der Karte der Hinweis „Wir melden uns bei dir für einen Termin“ plus Link in den Portal-Chat, falls `portal.messages.read`                                                              |
| Datenschutzhinweis   | Karte nennt vor dem Öffnen Anbieter und Zweck in beiden Sprachen                                                                                                                              |
| Rückfall             | Link leeren blendet die Karte aus (Kontakt-Hinweis erscheint); kein Feature-Flag nötig                                                                                                        |

## Migration

```txt
workspace_members
+ booking_url text NULL
  CHECK workspace_members_booking_url_check (booking_url IS NULL
        OR (booking_url LIKE 'https://%' AND length(booking_url) <= 2048))
```

Drizzle `workspace-members.ts`, Constraint-Namen (`workspace-members-constraint-names.ts`), Smoke.

## Architektur

```txt
Workspace-API
  PATCH /api/workspace/members/me/booking-url          eigenes Mitglied, jede angemeldete Rolle
  PATCH /api/workspace/members/[id]/booking-url        members.manage, security_events bei Fremdänderung
Server
  src/server/workspace/access/command-handler/update-member-booking-url.command-handler.ts
  src/server/portal/query-handler/get-portal-onboarding-booking.query-handler.ts
      nutzt project-responsible-member-service, liefert PortalOnboardingBookingDto | null
Contract
  packages/common/src/contracts/portal/portal-onboarding-booking.dto.ts
      { memberDisplayName: string; bookingUrl: string; provider: BookingProvider }
  packages/common/src/constants/portal/booking-providers.ts   (+ Zuordnung Domain → Anbieter, Test)
UI
  src/components/workspace/settings/members/member-booking-url-dialog/   (fremd, members.manage)
  src/components/workspace/shared/own-booking-url-dialog/               (eigener Link, aus der Sidebar geöffnet)
  src/components/portal/onboarding/onboarding-booking-card/             Klick-zum-Öffnen, Hinweis, Fallback
  portal-onboarding-widget (Task 67): Zustand „Abgesendet“ + Terminzeile
```

## Tickets

### CRM-69-T1 — Buchungslink am Mitglied

- **Files:** Migration, Modell, Constraint-Namen, Handler, zwei Routen, beide Dialoge, Dictionaries, Tests
- **Skills:** `best-practices`, `copywriting`
- **Akzeptanz:**
  - Nicht-`https` und zu lange URL werden abgelehnt (Schema **und** DB)
  - Mitglied ohne `members.manage` kann fremde Links weder lesen noch schreiben (Negativtest)
  - Fremdänderung erzeugt genau einen `security_events`-Eintrag; eigene Änderung keinen
  - Leeren ist erlaubt

### CRM-69-T2 — Terminkarte im Portal

- **Files:** Query-Handler, DTO, `booking-providers`, `onboarding-booking-card`, Widget-Erweiterung, Dictionaries,
  Tests
- **Skills:** `frontend-design`, `best-practices`, `copywriting`
- **Akzeptanz:**
  - Zwei Mitarbeiter, zwei Kunden: jeder Kunde sieht den Link seines Projekt-Owners (Test)
  - Projekt-Owner ohne Link, Kunden-Owner mit Link → Link des Kunden-Owners; inaktives Mitglied liefert nie einen Link
  - Vor dem Klick keine Anfrage an den Anbieter (Netzwerktest / Test: kein `<script>`/`<iframe>` des Anbieters)
  - Ohne Link erscheint der Kontakt-Hinweis, keine leere Karte
  - Karte nur in `submitted`/`changes_requested`; in `open` und `completed` nicht
  - Tastatur, Kontrast, Dark/Light

## Merge-Gate 15.7

- [ ] Richtiger Link je Kunde, Kontakt-Fallback ohne Link, kein Fremdskript.
- [ ] Rechte-Negativtests für fremde Links; `security_events` bei Fremdänderung.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes, Workspace-Build grün.
