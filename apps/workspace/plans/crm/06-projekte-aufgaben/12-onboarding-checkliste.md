# Task 12 — Onboarding-Checkliste

> **Branch:** `feat/crm-onboarding-vorlagen`
> **Aufwand:** S (rund ein halber Tag)
> **Abhängigkeiten:** Task 11 (Aufgaben)
> **Migration:** keine

## Context

Bei jedem neuen Webprojekt wiederholen sich dieselben Schritte: Zugänge anfragen, Logo und Bildmaterial
holen, Texte klären, Domain prüfen, Analytics einrichten, Impressum und Datenschutz abstimmen. Diese
Liste jedes Mal von Hand zu tippen, ist Verschwendung — und man vergisst zuverlässig denselben Punkt.

Dieser Task fügt Aufgaben-Vorlagen hinzu: eine Sammlung vordefinierter Aufgaben, die mit einem Klick
zu einem Projekt hinzugefügt werden, inklusive korrekt gesetzter Verantwortung und Sichtbarkeit.

## Entscheidungen

| Bereich             | Entscheidung                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Speicherort         | Vorlagen als Const-Objekt im Code, **nicht** in der Datenbank                                                                                            |
| Begründung          | Es gibt genau einen Pflegenden; eine Vorlagen-Verwaltungsoberfläche wäre mehr Aufwand als Nutzen. Eine Vorlage ändern heißt: eine Zeile im Code ändern   |
| Vorlagen            | `website_relaunch`, `website_new`, `maintenance_start`                                                                                                   |
| Beschriftungen      | Vorlagen enthalten Dictionary-Keys, keine Texte — sonst wären sie nicht übersetzbar                                                                      |
| Anwenden            | Manuell über einen Button in der Projektkarte, **nicht** automatisch beim Anlegen                                                                        |
| Begründung          | Nicht jedes Projekt braucht die volle Liste; ein automatischer Schwall von 12 Aufgaben nervt mehr, als er hilft                                          |
| Mehrfaches Anwenden | Erlaubt, aber bereits vorhandene `title_key` im selben Projekt werden übersprungen (keine Dubletten)                                                     |
| Sprache             | Die erzeugte Aufgabe speichert den **`title_key`**, nicht nur den fertigen Text                                                                          |
| Warum               | Sonst sähe ein Kunde mit englischem Portal deutsche Aufgabentitel, weil beim Anwenden deine Locale gilt. Mit dem Key rendert jede Seite in ihrer Sprache |
| Umbenennen          | Sobald du den Titel von Hand änderst, wird `title_key` auf `NULL` gesetzt — dein Text gewinnt und wird nicht mehr überschrieben                          |
| Fälligkeiten        | Als Versatz in Tagen ab Anwendungsdatum, optional je Eintrag                                                                                             |

## Contract

```ts
// packages/common/src/constants/crm/task-templates.ts
export const TaskTemplateKey = {
  WebsiteNew: "website_new",
  WebsiteRelaunch: "website_relaunch",
  MaintenanceStart: "maintenance_start",
} as const;

export interface TaskTemplateEntry {
  readonly titleKey: string; // Dictionary-Key, kein Text
  readonly responsibleSide: ResponsibleSide;
  readonly visibleToCustomer: boolean;
  readonly dueInDays: number | null;
}

export const TASK_TEMPLATES = {
  [TaskTemplateKey.WebsiteNew]: [
    {
      titleKey: "logoAndBrand",
      responsibleSide: ResponsibleSide.Customer,
      visibleToCustomer: true,
      dueInDays: 7,
    },
    {
      titleKey: "imageMaterial",
      responsibleSide: ResponsibleSide.Customer,
      visibleToCustomer: true,
      dueInDays: 7,
    },
    {
      titleKey: "copyPages",
      responsibleSide: ResponsibleSide.Customer,
      visibleToCustomer: true,
      dueInDays: 14,
    },
    {
      titleKey: "domainAccess",
      responsibleSide: ResponsibleSide.Customer,
      visibleToCustomer: true,
      dueInDays: 7,
    },
    {
      titleKey: "legalPages",
      responsibleSide: ResponsibleSide.Customer,
      visibleToCustomer: true,
      dueInDays: 14,
    },
    {
      titleKey: "hostingSetup",
      responsibleSide: ResponsibleSide.Internal,
      visibleToCustomer: false,
      dueInDays: null,
    },
    {
      titleKey: "analyticsSetup",
      responsibleSide: ResponsibleSide.Internal,
      visibleToCustomer: false,
      dueInDays: null,
    },
    {
      titleKey: "seoBasics",
      responsibleSide: ResponsibleSide.Internal,
      visibleToCustomer: false,
      dueInDays: null,
    },
  ],
  // website_relaunch, maintenance_start analog
} as const satisfies Record<TaskTemplateKey, readonly TaskTemplateEntry[]>;
```

## Verzeichnisstruktur

```txt
packages/common/src/constants/crm/task-templates.ts   (+ .test.ts)
apps/workspace/src/app/api/workspace/crm/projects/[projectId]/apply-template/route.ts
apps/workspace/src/server/workspace/crm/command-handler/apply-task-template.command-handler.ts
apps/workspace/src/components/workspace/crm/tasks/apply-template-menu/
apps/workspace/src/i18n/dictionaries/workspace/crm/task-templates/{de,en}.json
```

## Tickets

### CRM-12-T1 — Vorlagen-Konstanten

- **Files:** `packages/common/src/constants/crm/task-templates.ts` + Test,
  `dictionaries/workspace/crm/task-templates/{de,en}.json`
- **Skills:** `best-practices`, `copywriting`
- **Inhalt:** Drei Vorlagen wie oben; jeder `titleKey` hat einen Eintrag in beiden Sprachdateien
- **Akzeptanz:**
  - Test prüft, dass **jeder** `titleKey` aus allen Vorlagen in DE und EN existiert — ein vergessener
    Text fällt im Test auf, nicht erst im Produktivbetrieb
  - Vorlagen als `satisfies` typisiert, sodass eine fehlende Vorlage den Compiler bricht

### CRM-12-T2 — Anwenden-Handler

- **Files:** `command-handler/apply-task-template.command-handler.ts`, Route + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Aufgaben in einer Transaktion anlegen, Fälligkeit aus `dueInDays` berechnen
  - `title_key` wird gespeichert **und** der in der aktuellen Locale aufgelöste Text als `title` —
    der Text dient als Rückfallebene, gerendert wird bei gesetztem Key über das Dictionary
  - `update-task` setzt `title_key` auf `NULL`, sobald der Titel von Hand geändert wird
  - Vorhandene `title_key` im selben Projekt werden übersprungen; das Ergebnis nennt angelegte und
    übersprungene Anzahl
- **Akzeptanz:**
  - Test: zweimaliges Anwenden erzeugt keine Dubletten, auch wenn der Titel zwischenzeitlich in einer
    anderen Sprache angewendet wurde (die Erkennung läuft über den Key, nicht über den Text)
  - Test: eine Vorlagen-Aufgabe wird im Portal des Kunden in **dessen** Sprache angezeigt
  - Test: nach manuellem Umbenennen ist `title_key` `NULL` und der Titel bleibt stabil
  - Test: Fälligkeiten liegen korrekt in der Zukunft, `null` bleibt `null`
  - Fehler mitten in der Schleife rollt alles zurück

### CRM-12-T3 — Bedienung

- **Files:** `components/workspace/crm/tasks/apply-template-menu/**`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Menü „Vorlage anwenden" in der Aufgaben-Sektion der Projektkarte
  - Vor dem Anwenden eine Vorschau: welche Aufgaben entstehen, wie viele davon für den Kunden sichtbar
  - Ergebnismeldung: „8 Aufgaben angelegt, 2 übersprungen"
- **Akzeptanz:**
  - Menü per Tastatur bedienbar, Escape schließt
  - Die Vorschau zeigt die Texte in der aktiven Sprache
  - Kein Anwenden ohne Bestätigung

## Deploy-Sicherheit

1. **Live sichtbar:** neues Menü „Vorlage anwenden" in der Aufgaben-Sektion eines Projekts.
2. **Bricht nichts:** keine Migration, keine Änderung an bestehenden Handlern. Die Vorlagen erzeugen
   gewöhnliche Aufgaben über denselben Pfad wie die manuelle Anlage.
3. **Offen:** nichts. Eigene Vorlagen pflegen zu können wäre der nächste Ausbauschritt und ist bewusst
   nicht enthalten — solange nur eine Person Vorlagen pflegt, ist die Code-Konstante der günstigere Weg.

## End-to-End-Akzeptanz

1. „Vorlage anwenden" zeigt eine Vorschau der entstehenden Aufgaben.
2. Nach der Bestätigung existieren die Aufgaben mit korrekter Verantwortung, Sichtbarkeit und Fälligkeit.
3. Ein zweites Anwenden erzeugt keine Dubletten und meldet die übersprungenen.
4. Kundensichtbare Vorlagen-Aufgaben sind als solche erkennbar.
5. Texte erscheinen in der aktiven Sprache; alle Keys sind in DE und EN vorhanden.
6. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
