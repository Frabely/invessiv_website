# Task 21 — Portal-Dashboard

> **Merge-Einheit:** Ordner 13 · **Branch:** `feat/crm-portal-dashboard`
> **Aufwand:** L · **Abhängigkeiten:** Task 20 (Zugang), Task 10 (Projekte), Task 11 (Aufgaben)
> **Migration:** keine

> **Hinweis Neuplanung Ordner 08 (21.09.2026):** Das Aufgabenmodell hat sich geändert. Statt `done_at` /
> `done_by_side` gibt es `status` (`open | in_progress | done | cancelled`) mit `completed_at` und
> `completed_by_member_id`; ein Abschluss durch den Kunden braucht hier additiv eine Portal-Herkunft (z. B.
> `completed_by_portal_user_id`) und die Herkunft vom Kunden gestellter Aufgaben (`created_by_side`).
> `listTasks({ scope: "customer" })` existiert nicht; die Portal-Query entsteht hier neu unter `src/server/portal/`
> und filtert `visible_to_customer = true` im `WHERE`. Der Kunde sieht Status und „Wir“/„Sie“, keinen
> Mitarbeiternamen. Vor der Umsetzung neu zuschneiden.

- Projekte zeigen nur Status, Phase, nächsten Schritt, Termin und explizit freigegebenen Preview-Link;
  Budget, Stundensatz, interne Notizen und Owner fehlen vollständig.
- Bringschuld queryt `action_side = customer AND visible_to_customer = true` und filtert den
  aktiven Firmenkontext in SQL, niemals erst beim Rendering.
- Jeder aktive Kontakt der Firma darf abhaken; Actor und Zeitpunkt werden protokolliert.
- Keine Dateien, Feedbackrunden oder Chatkarten anzeigen, bevor die jeweilige spätere Einheit
  vollständig gemerged ist.

## Context

Die Seite, die der Kunde sieht, wenn er sich anmeldet. Vorlage ist der ausformulierte Entwurf:

```txt
Hallo Fabian
Website-Relaunch

Aktueller Status: Umsetzung
Onboarding ✓ → Design ✓ → Entwicklung ● → Feedback → Launch

Von dir benötigt:
☐ finale Kanzleifotos
☐ Texte Leistungsseite Arbeitsrecht
☐ Domain-Zugang

Nächster Schritt:
Erste Website-Version – 16.10.2026

Links: Preview ansehen · Dateien hochladen · Feedback geben

Stundenkontingent nach Launch: 10:00 h verfügbar
```

Alle Daten dafür existieren bereits: Projekt und Phase aus Task 09/10, Aufgaben mit
`visible_to_customer` aus Task 11, Preview-Link und nächster Schritt am Projekt. Dieser Task fügt
nichts Neues zur Datenbank hinzu — er stellt zusammen, was da ist.

Die Links „Dateien hochladen" und „Feedback geben" zeigen auf Task 22, das Stundenkontingent auf
Task 27. Beide sind hier noch nicht vorhanden und werden deshalb **weggelassen statt verlinkt** —
kein Verweis auf eine Seite, die es nicht gibt.

## Entscheidungen

| Bereich                     | Entscheidung                                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Ansprache                   | Vorname des angemeldeten Ansprechpartners; fehlt er, wird neutral ohne Namen begrüßt                                    |
| Mehrere Projekte            | Aktive Projekte untereinander, jüngstes zuerst. Archivierte gar nicht                                                   |
| Phasenleiste                | Dieselbe Komponente wie im CRM (`packages/ui`), hier in der rein darstellenden Variante                                 |
| Bringschuld                 | Aufgaben mit `action_side = customer` **und** `visible_to_customer`, offen zuerst                                       |
| Abhaken                     | Der Kunde darf seine Aufgaben abhaken; das schreibt `done_by_side = customer`                                           |
| Interne Aufgaben            | Erscheinen nie. Die Abfrage läuft über `scope: "customer"` aus Task 11                                                  |
| Nächster Schritt            | Text und Datum vom Projekt; ohne Angabe entfällt der Block                                                              |
| Noch nicht gebaute Bereiche | Werden **nicht** verlinkt. Ein Abschnitt ohne Ziel wird nicht gerendert                                                 |
| Leerer Zustand              | Kunde ohne aktives Projekt sieht eine freundliche Seite mit Kontaktmöglichkeit, keine leere Fläche                      |
| Gestaltung                  | Eigenständig, ruhig, klar — kein verkleinertes Abbild der internen Oberfläche. Der Kunde ist kein Bedienender eines CRM |

## Architektur

```txt
(portal)/portal/[customerId]/page.tsx   Server Component
  ├─ requirePortalActor(locale)  → { customerId, portalUserId, role }
  ├─ getPortalDashboard(customerId)      server/portal/query-handler/
  │     ├─ Kunde (Firmenname)
  │     ├─ aktive Projekte mit Phase, Preview-Link, nächstem Schritt
  │     └─ sichtbare offene Kundenaufgaben je Projekt
  └─ Rendering

POST /api/portal/[customerId]/tasks/[taskId]/done
  → withPortalActor
  → prüft: Aufgabe gehört zum Kunden der Sitzung UND ist sichtbar UND liegt beim Kunden
  → setzt done_at, done_by_side = customer
```

Die dreifache Prüfung im Abhak-Endpunkt ist wichtig: Ohne sie könnte ein Portalnutzer mit einer
geratenen Kennung eine interne Aufgabe abhaken.

## Verzeichnisstruktur

```txt
apps/workspace/src/server/portal/
  query-handler/get-portal-dashboard.query-handler.ts
  command-handler/complete-customer-task.command-handler.ts
apps/workspace/src/app/api/portal/[customerId]/tasks/[taskId]/done/route.ts

apps/workspace/src/app/[locale]/(portal)/portal/[customerId]/page.tsx     ersetzt den Platzhalter
apps/workspace/src/app/[locale]/(portal)/portal/[customerId]/loading.tsx

apps/workspace/src/components/portal/
  AGENTS.md
  dashboard/portal-greeting/
  dashboard/portal-project-card/
  dashboard/portal-phase-bar/          Hülle um packages/ui
  dashboard/portal-todo-list/
  dashboard/portal-todo-item/
  dashboard/portal-next-step/
  dashboard/portal-quick-links/
  dashboard/portal-empty-state/
apps/workspace/src/i18n/dictionaries/portal/dashboard/{de,en}.json
```

## Tickets

### CRM-21-T1 — Dashboard-Abfrage

- **Files:** `server/portal/query-handler/get-portal-dashboard.query-handler.ts` + Tests
- **Skills:** `best-practices`, `performance`
- **Inhalt:**
  - Nimmt ausschließlich die Kundenkennung aus der Sitzung entgegen
  - Lädt Kunde, aktive Projekte und je Projekt die sichtbaren Kundenaufgaben
  - Nutzt `listTasks` mit `scope: "customer"` aus Task 11, statt eine eigene Abfrage zu schreiben
- **Akzeptanz:**
  - Test: interne oder unsichtbare Aufgaben erscheinen unter keinen Umständen
  - Test: archivierte Projekte fehlen
  - Test: Kunde ohne Projekt liefert ein gültiges, leeres Ergebnis statt eines Fehlers
  - Keine N+1-Abfrage bei mehreren Projekten

### CRM-21-T2 — Abhaken durch den Kunden

- **Files:** `command-handler/complete-customer-task.command-handler.ts`, Route + Tests
- **Skills:** `best-practices`
- **Inhalt:** dreifache Prüfung wie oben; schreibt `done_by_side = customer` und eine
  `activities`-Zeile
- **Akzeptanz:**
  - Test: Aufgabe eines fremden Kunden ergibt 404 (nicht 403 — keine Existenzbestätigung)
  - Test: interne Aufgabe ergibt 404, auch wenn sie demselben Kunden gehört
  - Test: erneutes Abhaken ist folgenlos, kein Fehler
  - Der Bearbeiter sieht die Änderung sofort in seiner Aufgabenliste

### CRM-21-T3 — Portal-Gestaltung und Layout

- **Files:** `components/portal/AGENTS.md`, `portal-greeting/**`, `portal-project-card/**`,
  `portal-phase-bar/**`, `portal-next-step/**`, `dictionaries/portal/dashboard/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Eigenständige, ruhige Gestaltung mit großzügigem Weißraum; mobil zuerst, da Kunden häufig am
    Telefon schauen
  - Phasenleiste in der darstellenden Variante, abgeschlossene und aktuelle Phase ohne
    Farbwahrnehmung unterscheidbar
  - Nächster Schritt mit über die Locale formatiertem Datum; überfällig sichtbar, aber ohne Drohton
  - Genau eine H1, semantische Gliederung
- **Akzeptanz:**
  - Mobil ab 360 px ohne horizontales Scrollen
  - Dark und Light korrekt
  - Tastaturbedienung und Fokus-Reihenfolge geprüft
  - Texte in DE und EN, Tonfall freundlich und ohne internen Fachjargon

### CRM-21-T4 — Bringschuld-Liste

- **Files:** `portal-todo-list/**`, `portal-todo-item/**`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Checkboxen mit optimistischer Anzeige und Rücknahme bei Fehlschlag
  - Erledigte eingeklappt unter „Erledigt (N)"
  - Fälligkeit, wenn gesetzt; überfällig gekennzeichnet
  - Sind alle erledigt: bestätigende Meldung statt leerer Liste
- **Akzeptanz:**
  - Zustandswechsel über Live-Region angekündigt
  - Fehlgeschlagenes Abhaken stellt den Haken sichtbar zurück und erklärt den Fehler
  - Checkbox ist mindestens 44 mal 44 Pixel groß (Berührungsziel)

### CRM-21-T5 — Schnellzugriffe und leerer Zustand

- **Files:** `portal-quick-links/**`, `portal-empty-state/**`
- **Skills:** `frontend-design`, `copywriting`, `accessibility`
- **Inhalt:**
  - Nur vorhandene Ziele verlinken: Preview, wenn eine URL gesetzt ist. Hochladen und Feedback
    erscheinen erst mit Task 22 — dort ebenso der Download freigegebener Ergebnisse —, das Stundenkontingent erst mit
    Task 27
  - Preview-Link öffnet in neuem Tab mit `rel="noreferrer"` und erkennbarem Hinweis
  - Leerer Zustand: freundlicher Text plus Mailadresse des Betreuers
- **Akzeptanz:**
  - Kein Link führt auf eine nicht existierende Seite
  - Der leere Zustand wirkt nicht wie ein Fehler
  - Texte in DE und EN

## Deploy-Sicherheit

1. **Live sichtbar:** Der eingeladene Kunde sieht statt der Platzhalterseite sein echtes Dashboard.
2. **Bricht nichts:** keine Migration. Neu ist genau ein Portal-Endpunkt (Abhaken), dreifach geprüft.
   Der interne Bereich bleibt unberührt; die Aufgabenliste dort zeigt nun zusätzlich, wer abgehakt
   hat — eine Ergänzung, kein Umbau.
3. **Offen:** Hochladen, Feedback, Chat und Stundenkontingent. Abgesichert dadurch, dass die
   entsprechenden Abschnitte gar nicht erscheinen, solange ihr Ziel fehlt — der Kunde sieht keinen
   Hinweis auf etwas Unfertiges.

## End-to-End-Akzeptanz

1. Der Kunde sieht Begrüßung, Projekt, Phasenleiste, Bringschuld und nächsten Schritt.
2. Die Phasenleiste zeigt dieselbe Phase wie das CRM.
3. Nur kundensichtbare, dem Kunden zugewiesene Aufgaben erscheinen.
4. Abhaken wirkt sofort und ist im CRM sichtbar, inklusive Vermerk, dass der Kunde es war.
5. Eine fremde oder interne Aufgabenkennung lässt sich nicht abhaken.
6. Mehrere aktive Projekte erscheinen untereinander, archivierte nicht.
7. Ein Kunde ohne Projekt sieht eine freundliche, keine kaputte Seite.
8. Kein Link zeigt auf eine noch nicht gebaute Seite.
9. Mobil, Dark und Light geprüft; Tastaturbedienung vollständig.
10. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
