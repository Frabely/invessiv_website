# Task 47 — Onboarding-Termin beim zuständigen Mitarbeiter

> **Merge-Einheit:** Ordner 15c · **Branch:** `feat/crm-onboarding-abschluss`
> **Aufwand:** S · **Abhängigkeiten:** Task 02c (Mitgliederverwaltung), Task 21 (Dashboard), Task 46
> **Migration:** ja — additive Spalte `workspace_members.booking_url`

- Buchungslink ist eine Eigenschaft des Mitarbeiters, nicht des Kunden.
- Der Kunde sieht den Link des Projekt-Owners, ersatzweise des bei der Kundenanlage vorhandenen technischen
  Kunden-Owners.
- Das externe Widget lädt erst nach einem ausdrücklichen Klick, nie beim Seitenaufruf.
- Ohne konfigurierten Link erscheint ein Kontakthinweis statt einer toten Karte.
- Keine eigene Terminverwaltung in Version 1.

## Context

Am Ende des Onboardings steht ein Gespräch. Heute entsteht es über drei Mails mit Terminvorschlägen.
Ein Buchungslink des zuständigen Mitarbeiters beendet das — und zwar genau des zuständigen: Betreut
ein Mitarbeiter die Kunden 1 und 2 und der Owner den Kunden 3, sieht jeder Kunde den richtigen
Kalender.

Eine eigene Terminverwaltung mit Verfügbarkeiten, Absagen und Kalendersynchronisation ist bewusst
nicht Teil von Version 1. Sie bleibt als eigene Merge-Einheit später möglich und ändert an diesem
Datenmodell nichts.

## Entscheidungen

| Bereich                 | Entscheidung                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ort des Links           | `workspace_members.booking_url`, nullable, nur `https`                                                                                                                |
| Pflege                  | Jedes Mitglied pflegt den eigenen Link im Profil; fremde Links nur mit `members.manage`                                                                               |
| Auflösung               | Projekt-Owner → technischer Kunden-Owner → kein Link                                                                                                                  |
| Warum diese Reihenfolge | Das Gespräch führt, wer das Projekt macht. Der bei der Kundenanlage gesetzte technische Kunden-Owner ist der Rückfall, wenn das Projekt keinen abweichenden Owner hat |
| Deaktiviertes Mitglied  | Ein Link eines inaktiven Mitglieds wird nie ausgeliefert; die Auflösung fällt weiter                                                                                  |
| Anzeige                 | Karte im Portal-Dashboard, sichtbar sobald der Bogen abgesendet ist und die Projektphase noch `onboarding` ist                                                        |
| Abgeschlossen           | Kein neues Feld: Der Termin gilt als erledigt, sobald die Projektphase über `onboarding` hinaus ist. Die Karte verschwindet dann                                      |
| Einbettung              | Widget im Portal, aber **Klick-zum-Laden**: zuerst Erklärtext und Schaltfläche, erst danach wird das Skript nachgeladen                                               |
| Warum zwei Schritte     | Ein beim Seitenaufruf geladenes Fremdskript überträgt Daten ohne Zutun des Kunden und widerspricht der Regel, externe Skripte nur lazy zu laden                       |
| Datenschutzhinweis      | Die Karte nennt Anbieter und Zweck vor dem Laden, in beiden Sprachen                                                                                                  |
| Kein Link hinterlegt    | Statt der Karte ein Hinweis mit Verweis auf den Chat beziehungsweise die hinterlegte Kontaktmöglichkeit                                                               |
| Validierung             | `https`, maximal 2048 Zeichen; keine serverseitige Erreichbarkeitsprüfung der URL                                                                                     |
| Protokoll               | Änderung des eigenen oder eines fremden Buchungslinks erzeugt einen `security_events`-Eintrag, wenn sie fremd ist                                                     |
| Rückfallweg             | Feature-Flag `portalBookingCardEnabled`, serverseitig, Standard aus bis der Flow vollständig ist                                                                      |

## Contract

```ts
// packages/common/src/contracts/crm/onboarding-booking.dto.ts
export interface OnboardingBookingDto {
  memberDisplayName: string;
  bookingUrl: string;
  providerLabelKey: string; // z. B. "calendly"
}
```

## Migration

```txt
workspace_members
  + booking_url text NULL  CHECK (booking_url IS NULL
                                  OR (booking_url LIKE 'https://%'
                                      AND length(booking_url) <= 2048))
```

## Architektur

```txt
getPortalDashboard (erweitert)
  └─ resolveOnboardingBooking(projectId)
       ├─ Projekt-Owner aktiv und booking_url gesetzt?   → dessen Link
       ├─ sonst technischer Kunden-Owner aktiv und gesetzt? → dessen Link
       └─ sonst null                                     → Kontakthinweis

Settings → Profil
  PATCH /api/workspace/access/members/[memberId]/booking-url
    ├─ eigenes Mitglied: erlaubt
    └─ fremdes Mitglied: members.manage + security_events
```

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_add_workspace_member_booking_url.sql
packages/db/src/record-configuration/crm/workspace-members.ts            (erweitert)
packages/common/src/contracts/crm/onboarding-booking.dto.ts

apps/workspace/src/app/api/workspace/access/members/[memberId]/booking-url/route.ts
apps/workspace/src/server/workspace/access/command-handler/update-member-booking-url.command-handler.ts
apps/workspace/src/server/portal/query-handler/resolve-onboarding-booking.query-handler.ts
apps/workspace/src/components/workspace/settings/members/member-booking-url-field/
apps/workspace/src/components/portal/dashboard/portal-booking-card/
apps/workspace/src/i18n/dictionaries/portal/dashboard/{de,en}.json       (erweitert)
```

## Tickets

### CRM-47-T1 — Buchungslink am Mitglied

- **Files:** Migration, Drizzle-Modell, Command-Handler, Route, Settings-Feld, Tests
- **Skills:** `best-practices`
- **Inhalt:** Pflege des eigenen Links, fremde Links nur mit `members.manage`, Protokoll
- **Akzeptanz:**
  - Nicht-`https` und zu lange URL werden abgelehnt (DB und Schema)
  - Mitglied ohne `members.manage` kann fremde Links weder lesen noch schreiben (Negativtest)
  - Fremdänderung erzeugt genau einen `security_events`-Eintrag
  - Leeren des Feldes ist erlaubt und entfernt die Karte im Portal

### CRM-47-T2 — Terminkarte im Portal

- **Files:** `resolve-onboarding-booking.query-handler.ts`, `portal-booking-card`, Dictionaries,
  Feature-Flag, Tests
- **Skills:** `frontend-design`, `best-practices`, `copywriting`
- **Inhalt:** Auflösungsreihenfolge, Klick-zum-Laden mit Anbieterhinweis, Kontaktfallback
- **Akzeptanz:**
  - Netzwerktest: vor dem Klick geht keine Anfrage an den Buchungsanbieter
  - Zwei Mitarbeiter, zwei Kunden: jeder Kunde sieht den richtigen Link (Test)
  - Inaktives Mitglied liefert keinen Link
  - Ohne Link erscheint der Kontakthinweis, keine leere Karte
  - Karte verschwindet, sobald die Projektphase über `onboarding` hinaus ist
  - Tastaturbedienung, Kontrast, Dark und Light geprüft
