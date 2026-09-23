# Task 46 — Aufgaben-Verzahnung und Onboarding-Fortschritt

> **Merge-Einheit:** Ordner 15c · **Branch:** `feat/crm-onboarding-abschluss`
> **Aufwand:** S · **Abhängigkeiten:** Task 11 (Aufgaben), Task 12 (Vorlagen), Task 21 (Dashboard), Task 44/45 (Bogen)
> **Migration:** keine

> **Hinweis Neuplanung Ordner 08 (21.09.2026):** Dieser Task setzt Task 12 (Vorlagen mit `title_key`) und
> `done_by_side` voraus. Task 12 ist zurückgestellt (`zurueckgestellt/12-onboarding-checkliste.md`), das
> Aufgabenmodell nutzt `status`/`completed_at`. Die Verzahnung wird zusammen mit dem Neuzuschnitt der Vorlagen
> geplant; bis dahin ist dieser Task nicht umsetzbar.

- Eine Zuordnung im Code verbindet Bogenabschnitte mit den `title_key` der Aufgaben-Vorlage.
- Absenden erledigt genau diese Aufgaben in derselben Transaktion.
- Das Portal-Dashboard zeigt den Bogen als ersten Punkt der Bringschuld, mit Fortschritt.
- Kein neues Datenmodell und keine neue Permission.

## Context

Nach Ordner 15b existieren zwei Listen nebeneinander: die Kundenaufgaben („Logo und Bildmaterial
liefern") und der Bogen, der genau das abfragt. Ohne Verzahnung hakt der Kunde nach dem Absenden
noch einmal von Hand ab — oder vergisst es, und die Bringschuld bleibt rot, obwohl alles da ist.

Dieser Task schließt die Lücke und macht den Bogen im Dashboard sichtbar.

## Entscheidungen

| Bereich             | Entscheidung                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Zuordnung           | Const-Objekt `ONBOARDING_TASK_COMPLETION`: Vorlage → Liste der `title_key`, die das Absenden erledigt                                |
| Warum explizit      | Eine Erkennung über ähnliche Titel wäre still falsch, sobald jemand eine Aufgabe umbenennt. Die Zuordnung ist typisiert und getestet |
| Umbenannte Aufgaben | Eine Aufgabe ohne `title_key` (eigener Titel, Task 12) wird nie automatisch abgehakt                                                 |
| Bereits erledigt    | Wird nicht erneut geschrieben; die Historie behält den ursprünglichen Zeitpunkt                                                      |
| Interne Aufgaben    | Bleiben unberührt — der Bogen erledigt ausschließlich Aufgaben mit `action_side = customer`                                          |
| Herkunft            | `done_by_side = customer`, Actor ist das absendende Portalmitglied                                                                   |
| Timeline            | Ein Activity-Eintrag „Bogen abgesendet, 4 Aufgaben erledigt" statt fünf Einzeleinträgen                                              |
| Transaktion         | Abhaken passiert im selben Command wie das Absenden; schlägt eines fehl, ist nichts passiert                                         |
| Dashboard           | Eigene Karte oberhalb der Bringschuld: Titel, Fortschritt, „Weiter ausfüllen" oder „Ansehen"                                         |
| Ohne Bogen          | Keine Karte, kein Platzhalter — das Dashboard verhält sich wie bisher                                                                |
| Fortschritt         | Aus `getOnboardingProgress` (Task 44); dieselbe Funktion wie im Formular                                                             |
| Nach dem Absenden   | Karte bleibt sichtbar mit Zustand „abgesendet am …" und Link in die Leseansicht                                                      |
| Reihenfolge         | Bogen vor Einzelaufgaben — er ist der größere Brocken und erledigt einen Teil davon gleich mit                                       |

## Contract

```ts
// packages/common/src/constants/crm/onboarding-task-completion.ts
/** Welche Aufgaben-Vorlagenpunkte ein abgesendeter Bogen erledigt. */
export const ONBOARDING_TASK_COMPLETION = {
  [OnboardingFormKey.WebsiteNew]: [
    "logoAndBrand",
    "imageMaterial",
    "copyPages",
    "legalPages",
  ],
  [OnboardingFormKey.WebsiteRelaunch]: ["logoAndBrand", "copyPages"],
  [OnboardingFormKey.SeoStart]: ["copyPages"],
} as const satisfies Record<OnboardingFormKey, readonly string[]>;
```

## Architektur

```txt
submitOnboarding (Task 44, erweitert)
  └─ Transaktion
       ├─ Bogen auf submitted
       ├─ UPDATE tasks
       │     WHERE project_id = $1
       │       AND title_key = ANY($2)
       │       AND action_side = 'customer'
       │       AND status <> 'done'
       ├─ eine Activity mit Anzahl der erledigten Aufgaben
       └─ interne Benachrichtigung wird in Ordner 20c nachgezogen

getPortalDashboard (Task 21, erweitert)
  └─ offener oder abgesendeter Bogen je aktivem Projekt + Fortschritt
```

## Verzeichnisstruktur

```txt
packages/common/src/constants/crm/onboarding-task-completion.ts   (+ .test.ts)
apps/workspace/src/server/portal/command-handler/submit-onboarding.command-handler.ts  (erweitert)
apps/workspace/src/server/portal/query-handler/get-portal-dashboard.query-handler.ts   (erweitert)
apps/workspace/src/components/portal/dashboard/portal-onboarding-card/
apps/workspace/src/i18n/dictionaries/portal/{dashboard,onboarding}/{de,en}.json        (erweitert)
```

## Tickets

### CRM-46-T1 — Zuordnung und Abhaken

- **Files:** `onboarding-task-completion.ts` plus Test, erweiterter Submit-Handler, Tests
- **Skills:** `best-practices`
- **Inhalt:** Typisierte Zuordnung, Massen-Update in derselben Transaktion, ein Activity-Eintrag
- **Akzeptanz:**
  - Test: jeder genannte `title_key` existiert in `TASK_TEMPLATES` — ein Tippfehler bricht den Build
  - Nur Kundenaufgaben des Projekts werden erledigt; interne bleiben offen (Test)
  - Aufgabe mit eigenem Titel (`title_key IS NULL`) wird nicht abgehakt
  - Bereits erledigte Aufgabe behält ihren ursprünglichen Zeitpunkt
  - Fehler beim Abhaken rollt das Absenden vollständig zurück

### CRM-46-T2 — Bogenkarte im Portal-Dashboard

- **Files:** `portal-onboarding-card`, erweiterter Dashboard-Query-Handler, Dictionaries, Tests
- **Skills:** `frontend-design`, `best-practices`, `copywriting`
- **Inhalt:** Karte mit Titel, Fortschritt und Zustand; Platzierung vor der Bringschuld
- **Akzeptanz:**
  - Ohne Bogen ist das Dashboard unverändert (Regressionstest)
  - Fortschritt stimmt mit der Anzeige im Formular überein
  - Abgesendeter Bogen zeigt Datum und führt in die Leseansicht
  - Tastaturfokus und Kontrast geprüft, mobil ohne horizontales Scrollen
