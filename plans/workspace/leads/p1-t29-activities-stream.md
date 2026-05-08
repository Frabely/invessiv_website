# P1-T29 — Activities-Stream (Implementierungs-Detailplan)

> **Übergeordneter Plan:** `plans/workspace/leads/01-list-and-detail.md`,
> Ticket P1-T29 (Zeilen 667–681).
> **Branch:** aktuell `feat/workspace-lead-section` (laufend); ggf.
> `feat/workspace-leads-activities-stream` falls eigener Branch gewünscht.
> **Skill:** `frontend-design:frontend-design`.
> **Aufwand laut übergeordnetem Plan:** 1,5h.

## Context

Im Plan `plans/workspace/leads/01-list-and-detail.md` (Zeilen 667–681) ist
Ticket **P1-T29 — Activities-Stream** definiert. P1-T28
(Detail-Side-Panel) ist bereits umgesetzt und hat einen Platzhalter-Slot:
`src/components/workspace/leads/detail/lead-detail-panel/lead-detail-panel.tsx:253-265`
mit `content.activity.placeholder` = „Der Activity Stream folgt in
P1-T29.".

Server-Seitig ist ebenfalls alles vorhanden: `getLeadById` lädt
`lead_activities` (sortiert `desc(occurred_at)`) und `lead_submissions`
(sortiert `desc(created_at)`) bereits parallel und mappt sie nach
`LeadDetailDto.activities: LeadActivityDto[]` und
`LeadDetailDto.submissions: LeadSubmissionDto[]`.

**Was fehlt:** die UI-Komponente, die diese beiden Streams im Panel
chronologisch zusammengeführt rendert, sowie die i18n-Keys für
Activity-Typen, Actor-Labels und Empty-State.

Ergebnis nach Umsetzung: Detail-Panel zeigt eine Timeline aus
`lead_activities` und `lead_submissions`, sortiert nach Timestamp DESC.
Jeder Eintrag rendert Typ-Icon, Titel, optionalen Body, Actor-Label und
lokal-formatiertes Datum. Status-Change-Activities verwenden die
bestehende `LeadStatusBadge` für „von → nach". Leere Timeline zeigt einen
verständlichen Empty-Text. DE und EN sind komplett.

## Ziel

Detail-Panel-Sektion „Aktivität" zeigt eine Timeline mit Einträgen aus
`lead_activities` und `lead_submissions`, chronologisch absteigend
zusammengeführt. Jeder Eintrag rendert Typ-Icon, Titel, optionalen Body,
Actor-Label und lokal-formatiertes Datum/Zeit. Leere Timeline zeigt einen
sinnvollen Placeholder. Keine Inline-Strings, DE und EN komplett.

## Architektur

- **Neue Server-Komponente** `LeadDetailActivities` unter
  `src/components/workspace/leads/detail/lead-detail-activities/`. Server
  Component, weil keine Interaktivität (kein Inline-Edit, kein Expand) —
  die Komponente erhält Daten als Props und rendert nur. AGENTS-Regel 5
  (Server-First) bleibt eingehalten.
- **Eingabe-Props:** `activities: LeadActivityDto[]`,
  `submissions: LeadSubmissionDto[]`, `locale: Locale`,
  `content: LeadsDetailDictionary`, `sharedContent: LeadsSharedDictionary`.
- **Merge-Logik** lebt als private Helper-Funktion innerhalb der
  Komponenten-Datei (kein eigener Hook/Util — YAGNI). Output ist ein
  Discriminated-Union-Array von Timeline-Einträgen mit gemeinsamem
  `timestamp`-Feld. Sort `DESC` nach `timestamp`. Bei Gleichstand sekundär
  nach `id` für stabile Reihenfolge.
- **Discriminated Union (UI-intern, nicht exportiert):**

  ```ts
  type TimelineEntry =
    | { kind: "activity"; timestamp: string; data: LeadActivityDto }
    | { kind: "submission"; timestamp: string; data: LeadSubmissionDto };
  ```

  `submissions` werden vor dem Merge auf `kind: "submission"` mit
  `timestamp = createdAt` gemappt; `activities` analog mit
  `timestamp = occurredAt`.

- **Render pro Eintrag:**
  - Icon (FontAwesome, abhängig vom Activity-Typ bzw. Submission)
  - Titel (`activity.title` falls gesetzt, sonst i18n-Fallback aus
    `activity.types.<type>` bzw. `activity.submission.fallbackTitle`)
  - Body (optional, `activity.body` oder Submission-Detail)
  - Status-Change-Spezialfall: zwei `<LeadStatusBadge>` für
    `previous_status` → `next_status`, gerendert nebeneinander mit
    Pfeil-Glyphe `→`.
  - Actor-Label: `actorLabel` falls gesetzt, sonst i18n-Fallback aus
    `activity.actor.<actorType>`. Submissions haben keinen Actor →
    Anzeige der i18n-Konstanten `activity.actor.system`.
  - Datum: `Intl.DateTimeFormat(locale, { dateStyle: "medium",
timeStyle: "short" })`. Reuse-Hinweis: `formatLeadCreatedAt` aus
    `src/components/workspace/leads/table/lead-table-utils.ts:40-44`
    rendert nur `dateStyle: "medium"` und ist daher unzureichend; wir
    nutzen eine lokale `formatActivityTimestamp(locale, iso)`-Funktion
    innerhalb der Komponentendatei.
- **Type-Guards für `metadata`:** `LeadActivityDto.metadata` ist
  `unknown`. Wir narrowen via Hilfsfunktion
  `getStatusChangeMetadata(metadata)`, die prüft, ob ein Objekt mit den
  Keys `previous_status` und `next_status` vorliegt, und beide Werte
  gegen `CONTACT_LEAD_STATUS_VALUES` validiert. Bei ungültigem Inhalt
  fällt der Renderer auf `body`/`title` zurück, ohne zu crashen.
- **Submissions-Channel-Label:** Aus `LeadSubmissionDto.channel`
  (`ContactRequestKind`) wird das Anzeige-Label aus
  `content.activity.channels[<channel>]` gelesen. Falls ein Channel-Wert
  fehlt (z. B. neuer ContactRequestKind), Fallback auf den
  Channel-String.

## Reuse-Punkte (kein Neubau)

- `LeadDetailDto.activities`, `.submissions` aus `getLeadById` —
  bereits geladen, sortiert.
- `LeadActivityDto`
  (`src/common/contracts/leads/lead-activity.dto.ts`),
  `LeadSubmissionDto`
  (`src/common/contracts/leads/lead-submission.dto.ts`).
- `LeadActivityType` und `LEAD_ACTIVITY_TYPES` aus
  `src/common/constants/leads/lead-activity-types.ts`.
- `LeadActorType` aus `src/common/constants/leads/lead-actor-types.ts`.
- `ContactRequestKind` (für Submission-Channel) aus
  `src/common/constants/contact/contact-request-kind.ts`.
- `LeadStatusBadge` aus `src/components/workspace/leads/shared` für
  `status_change`-Activities (Reuse mit existierender Props-Signatur
  `{ status, label, className? }`).
- `LeadsDetailDictionary` und `LeadsSharedDictionary` (`status`-Map zur
  Status-Beschriftung im StatusChange-Renderer).
- CSS-Tokens aus
  `src/components/workspace/leads/detail/lead-detail-panel/lead-detail-panel.module.css`:
  `--lead-detail-text`, `--lead-detail-text-muted`,
  `--lead-detail-border-soft`, `.section`-Spacing.
- FontAwesome-Icons (`@fortawesome/free-solid-svg-icons` +
  `@fortawesome/react-fontawesome`) — bereits installiert, keine neuen
  Dependencies.

## Datei-Struktur

```
src/
├── components/workspace/leads/detail/
│   ├── lead-detail-panel/lead-detail-panel.tsx              # EDIT
│   └── lead-detail-activities/                              # NEU
│       ├── lead-detail-activities.tsx
│       ├── lead-detail-activities.module.css
│       └── lead-detail-activities.test.tsx
└── i18n/dictionaries/workspace/leads/detail/
    ├── de.json                                              # EDIT
    └── en.json                                              # EDIT
```

Keine Änderungen an `index.ts` des Dictionaries —
`getLeadsDetailDictionary` bleibt unverändert, nur sein JSON-Inhalt
erweitert sich.

## Tickets

### T29.1 — Detail-Dictionaries `detail/{de,en}.json` erweitern

**Files:**

- Modify: `src/i18n/dictionaries/workspace/leads/detail/de.json`
- Modify: `src/i18n/dictionaries/workspace/leads/detail/en.json`

Bestehende Top-Level-Sektion `activity` enthält heute nur
`{ "placeholder": "Der Activity Stream folgt in P1-T29." }`. Diese
Sektion wird komplett ersetzt. `sections.activity` (Section-Titel im
Panel) bleibt unverändert.

- [ ] **Step 1: `detail/de.json` — `activity`-Sektion ersetzen**

```json
"activity": {
  "empty": "Noch keine Aktivität",
  "types": {
    "note": "Notiz",
    "status_change": "Status geändert",
    "inbound_submission": "Inbound-Submission",
    "import": "Import"
  },
  "actor": {
    "system": "System",
    "user": "Nutzer"
  },
  "statusChange": {
    "separator": "→",
    "fallbackBody": "Status aktualisiert"
  },
  "submission": {
    "fallbackTitle": "Inbound-Submission empfangen"
  },
  "channels": {
    "quick_contact": "Schnellkontakt",
    "project_request": "Projektanfrage",
    "discovery_call": "Discovery-Call"
  }
}
```

> Die exakten Keys unter `channels` müssen mit
> `CONTACT_REQUEST_KIND_VALUES` aus
> `src/common/constants/contact/contact-request-kind.ts` 1:1
> übereinstimmen. Vor dem Ersetzen die Liste in der Konstante prüfen
> und Keys hier spiegeln (snake_case wie in der Konstante). Falls
> weitere Channel-Werte existieren als die hier aufgeführten drei, alle
> in DE und EN ergänzen.

- [ ] **Step 2: `detail/en.json` — `activity`-Sektion ersetzen**

```json
"activity": {
  "empty": "No activity yet",
  "types": {
    "note": "Note",
    "status_change": "Status changed",
    "inbound_submission": "Inbound submission",
    "import": "Import"
  },
  "actor": {
    "system": "System",
    "user": "User"
  },
  "statusChange": {
    "separator": "→",
    "fallbackBody": "Status updated"
  },
  "submission": {
    "fallbackTitle": "Inbound submission received"
  },
  "channels": {
    "quick_contact": "Quick contact",
    "project_request": "Project request",
    "discovery_call": "Discovery call"
  }
}
```

- [ ] **Step 3: `npm run typecheck`**

Erwartet: PASS. Falls `lead-detail-panel.tsx` durch Wegfall des
`activity.placeholder`-Keys einen Type-Error wirft → Type-Error ist
gewollt; T29.4 ersetzt diese Stelle.

### T29.2 — `LeadDetailActivities`-Komponente bauen

**Files:**

- Create:
  `src/components/workspace/leads/detail/lead-detail-activities/lead-detail-activities.tsx`
- Create:
  `src/components/workspace/leads/detail/lead-detail-activities/lead-detail-activities.module.css`

#### Verhalten

- Server Component (kein `"use client"`).
- Wenn `activities.length === 0 && submissions.length === 0` ⇒
  Empty-Block mit `content.activity.empty`.
- Sonst: Merge → Sort → Liste rendern.
- Status-Change-Activity: rendert zwei `LeadStatusBadge` mit Pfeil
  dazwischen. Wenn `metadata` ungültig → fällt auf
  `content.activity.statusChange.fallbackBody` als Body zurück.
- Submission: nutzt
  `content.activity.types.inbound_submission` als Type-Label und
  `content.activity.submission.fallbackTitle` als Titel; Body zeigt
  Channel-Anzeige aus `content.activity.channels[channel]`.
- Note-/Import-Activity: Title aus
  `activity.title || content.activity.types[type]`, Body aus
  `activity.body`.
- Datumsformat: `formatActivityTimestamp(locale, iso)` — lokale
  Helper-Funktion innerhalb der Komponente:

  ```ts
  function formatActivityTimestamp(locale: string, iso: string): string {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  }
  ```

- Actor-Label:
  `data.actorLabel ?? content.activity.actor[data.actorType]`.
  Submissions haben keinen Actor → fix `content.activity.actor.system`.

#### Markup-Skelett (`lead-detail-activities.tsx`)

```tsx
import {
  faCircleCheck,
  faClockRotateLeft,
  faFileImport,
  faNoteSticky,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  CONTACT_LEAD_STATUS_VALUES,
  type ContactLeadStatus,
} from "@/common/constants/contact/contact-lead-statuses";
import type { ContactRequestKind } from "@/common/constants/contact/contact-request-kind";
import {
  LeadActivityType,
  type LeadActivityType as LeadActivityTypeUnion,
} from "@/common/constants/leads/lead-activity-types";
import type { LeadActorType } from "@/common/constants/leads/lead-actor-types";
import type { LeadActivityDto } from "@/common/contracts/leads/lead-activity.dto";
import type { LeadSubmissionDto } from "@/common/contracts/leads/lead-submission.dto";
import { LeadStatusBadge } from "@/components/workspace/leads/shared";
import type { Locale } from "@/config/i18n";
import type {
  LeadsDetailDictionary,
  LeadsSharedDictionary,
} from "@/i18n/dictionaries/workspace/leads";

import styles from "./lead-detail-activities.module.css";

type LeadDetailActivitiesProps = {
  activities: LeadActivityDto[];
  submissions: LeadSubmissionDto[];
  locale: Locale;
  content: LeadsDetailDictionary;
  sharedContent: LeadsSharedDictionary;
};

type TimelineEntry =
  | {
      kind: "activity";
      timestamp: string;
      sortKey: string;
      data: LeadActivityDto;
    }
  | {
      kind: "submission";
      timestamp: string;
      sortKey: string;
      data: LeadSubmissionDto;
    };

type StatusChangeMetadata = {
  previous_status: ContactLeadStatus;
  next_status: ContactLeadStatus;
};

function getStatusChangeMetadata(
  metadata: unknown,
): StatusChangeMetadata | null {
  if (!metadata || typeof metadata !== "object") return null;
  const record = metadata as Record<string, unknown>;
  const previous = record.previous_status;
  const next = record.next_status;
  const validPrev =
    typeof previous === "string" &&
    (CONTACT_LEAD_STATUS_VALUES as readonly string[]).includes(previous);
  const validNext =
    typeof next === "string" &&
    (CONTACT_LEAD_STATUS_VALUES as readonly string[]).includes(next);
  if (!validPrev || !validNext) return null;
  return {
    previous_status: previous as ContactLeadStatus,
    next_status: next as ContactLeadStatus,
  };
}

function buildTimeline(
  activities: LeadActivityDto[],
  submissions: LeadSubmissionDto[],
): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...activities.map<TimelineEntry>((activity) => ({
      kind: "activity",
      timestamp: activity.occurredAt,
      sortKey: `${activity.occurredAt}:${activity.id}`,
      data: activity,
    })),
    ...submissions.map<TimelineEntry>((submission) => ({
      kind: "submission",
      timestamp: submission.createdAt,
      sortKey: `${submission.createdAt}:${submission.id}`,
      data: submission,
    })),
  ];
  return entries.sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1));
}

function formatActivityTimestamp(locale: string, iso: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

const ACTIVITY_TYPE_ICON: Record<LeadActivityTypeUnion, typeof faNoteSticky> = {
  [LeadActivityType.Note]: faNoteSticky,
  [LeadActivityType.StatusChange]: faClockRotateLeft,
  [LeadActivityType.InboundSubmission]: faPaperPlane,
  [LeadActivityType.Import]: faFileImport,
};

export function LeadDetailActivities({
  activities,
  submissions,
  locale,
  content,
  sharedContent,
}: LeadDetailActivitiesProps) {
  const timeline = buildTimeline(activities, submissions);

  if (timeline.length === 0) {
    return <p className={styles.empty}>{content.activity.empty}</p>;
  }

  return (
    <ol className={styles.timeline}>
      {timeline.map((entry) => (
        <li className={styles.item} key={`${entry.kind}:${entry.data.id}`}>
          {entry.kind === "activity"
            ? renderActivity(entry.data, content, sharedContent, locale)
            : renderSubmission(entry.data, content, locale)}
        </li>
      ))}
    </ol>
  );
}

function renderActivity(
  activity: LeadActivityDto,
  content: LeadsDetailDictionary,
  sharedContent: LeadsSharedDictionary,
  locale: string,
) {
  const icon = ACTIVITY_TYPE_ICON[activity.type] ?? faCircleCheck;
  const typeLabel = content.activity.types[activity.type];
  const title = activity.title ?? typeLabel;
  const actorLabel =
    activity.actorLabel ??
    content.activity.actor[activity.actorType as LeadActorType];
  const timestamp = formatActivityTimestamp(locale, activity.occurredAt);

  return (
    <article className={styles.entry}>
      <span className={styles.icon} aria-hidden="true">
        <FontAwesomeIcon icon={icon} />
      </span>
      <div className={styles.body}>
        <header className={styles.header}>
          <span className={styles.typeLabel}>{typeLabel}</span>
          <time className={styles.timestamp} dateTime={activity.occurredAt}>
            {timestamp}
          </time>
        </header>
        <h4 className={styles.title}>{title}</h4>
        {activity.type === LeadActivityType.StatusChange ? (
          renderStatusChange(activity, content, sharedContent)
        ) : activity.body ? (
          <p className={styles.bodyText}>{activity.body}</p>
        ) : null}
        <p className={styles.actor}>{actorLabel}</p>
      </div>
    </article>
  );
}

function renderStatusChange(
  activity: LeadActivityDto,
  content: LeadsDetailDictionary,
  sharedContent: LeadsSharedDictionary,
) {
  const meta = getStatusChangeMetadata(activity.metadata);
  if (!meta) {
    return (
      <p className={styles.bodyText}>
        {activity.body ?? content.activity.statusChange.fallbackBody}
      </p>
    );
  }
  return (
    <div className={styles.statusChange}>
      <LeadStatusBadge
        status={meta.previous_status}
        label={sharedContent.status[meta.previous_status]}
      />
      <span className={styles.statusSeparator} aria-hidden="true">
        {content.activity.statusChange.separator}
      </span>
      <LeadStatusBadge
        status={meta.next_status}
        label={sharedContent.status[meta.next_status]}
      />
    </div>
  );
}

function renderSubmission(
  submission: LeadSubmissionDto,
  content: LeadsDetailDictionary,
  locale: string,
) {
  const channelLabel =
    content.activity.channels[submission.channel as ContactRequestKind] ??
    submission.channel;
  const timestamp = formatActivityTimestamp(locale, submission.createdAt);
  return (
    <article className={styles.entry}>
      <span className={styles.icon} aria-hidden="true">
        <FontAwesomeIcon icon={faPaperPlane} />
      </span>
      <div className={styles.body}>
        <header className={styles.header}>
          <span className={styles.typeLabel}>
            {content.activity.types.inbound_submission}
          </span>
          <time className={styles.timestamp} dateTime={submission.createdAt}>
            {timestamp}
          </time>
        </header>
        <h4 className={styles.title}>
          {content.activity.submission.fallbackTitle}
        </h4>
        <p className={styles.bodyText}>{channelLabel}</p>
        <p className={styles.actor}>{content.activity.actor.system}</p>
      </div>
    </article>
  );
}
```

> Hinweise: `LeadStatusBadge` ist hier als Wiederverwendung markiert.
> Falls seine Props-Signatur
> `label: string; status: ContactLeadStatus | "all"` nicht den
> `archived`-Wert für StatusBadges erlaubt, vor dem Implementieren die
> Component-Datei prüfen
> (`src/components/workspace/leads/shared/lead-status-badge/`); ggf.
> minimal nur den hier verwendeten Status-Werte-Bereich zulassen.
> `ACTIVITY_TYPE_ICON`-Map ist `as const`-konform — Ergänzung von neuen
> Typen erzwingt Typecheck-Fehler, was gewünscht ist
> (Single-Source-of-Truth via `LEAD_ACTIVITY_TYPES`).

#### CSS-Skelett (`lead-detail-activities.module.css`)

- `.empty` — `color: var(--lead-detail-text-muted); font-size: 0.9rem;
margin: 0;`.
- `.timeline` — `list-style: none; padding: 0; margin: 0;
display: flex; flex-direction: column; gap: 0.75rem;`.
- `.item` — `border: 1px solid var(--lead-detail-border-soft);
border-radius: 0.75rem; padding: 0.75rem 1rem;
background: rgba(255, 255, 255, 0.02);`.
- `.entry` — `display: grid; grid-template-columns: auto 1fr;
gap: 0.75rem;`.
- `.icon` — `width: 2rem; height: 2rem; border-radius: 999px;
display: grid; place-items: center;
background: var(--color-surface-2);
color: var(--lead-detail-text);`.
- `.body` — `display: flex; flex-direction: column; gap: 0.25rem;
min-width: 0;`.
- `.header` — `display: flex; justify-content: space-between;
align-items: center; gap: 0.5rem; flex-wrap: wrap;`.
- `.typeLabel` — `text-transform: uppercase; font-size: 0.7rem;
letter-spacing: 0.04em; color: var(--lead-detail-text-muted);
font-weight: 600;`.
- `.timestamp` — `font-size: 0.75rem;
color: var(--lead-detail-text-muted);
font-variant-numeric: tabular-nums;`.
- `.title` — `font-size: 0.95rem; margin: 0;
color: var(--lead-detail-text); font-weight: 600;`.
- `.bodyText` — `margin: 0; font-size: 0.875rem;
color: var(--lead-detail-text); white-space: pre-wrap;`.
- `.actor` — `margin: 0; font-size: 0.75rem;
color: var(--lead-detail-text-muted);`.
- `.statusChange` — `display: flex; align-items: center; gap: 0.5rem;
flex-wrap: wrap;`.
- `.statusSeparator` — `color: var(--lead-detail-text-muted);
font-weight: 600;`.

> Tokens stammen aus `lead-detail-panel.module.css`. Falls
> `--lead-detail-border-soft` o. ä. dort nicht als CSS-Custom-Property
> definiert ist, sondern direkt mit Werten aus `globals.css` arbeitet,
> beim Implementieren auf die in `lead-detail-panel.module.css` aktuell
> verwendeten Variablen syncen, statt neue zu erfinden.

### T29.3 — Tests `lead-detail-activities.test.tsx`

**Files:**

- Create:
  `src/components/workspace/leads/detail/lead-detail-activities/lead-detail-activities.test.tsx`

Vorbild: `lead-detail-panel.test.tsx`. Server Components werden in
vitest mit `@testing-library/react` problemlos gerendert (kein
„use server"-Boundary innerhalb der Komponente). `next/navigation` ist
hier irrelevant, weil keine Hooks verwendet werden — kein Mock nötig.

- [ ] **Step 1: Setup**

```tsx
// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  getLeadsDetailDictionary,
  getLeadsSharedDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { LeadActivityType } from "@/common/constants/leads/lead-activity-types";
import { LeadActorType } from "@/common/constants/leads/lead-actor-types";
import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { ContactRequestKind } from "@/common/constants/contact/contact-request-kind";
import type { LeadActivityDto } from "@/common/contracts/leads/lead-activity.dto";
import type { LeadSubmissionDto } from "@/common/contracts/leads/lead-submission.dto";

import { LeadDetailActivities } from "./lead-detail-activities";

const baseActivity: LeadActivityDto = {
  id: "act-1",
  type: LeadActivityType.Note,
  title: "Erstkontakt notiert",
  body: "Lead hat heute zurückgerufen.",
  metadata: null,
  occurredAt: "2026-04-12T10:30:00.000Z",
  actorType: LeadActorType.User,
  actorId: "user_123",
  actorLabel: "Moritz",
};

const baseSubmission: LeadSubmissionDto = {
  id: "sub-1",
  requestId: "req-abc",
  channel: ContactRequestKind.QuickContact,
  locale: "de",
  consentAcceptedAt: "2026-04-13T08:00:00.000Z",
  submissionStartedAt: null,
  createdAt: "2026-04-13T08:00:00.000Z",
};

function renderActivities(
  overrides: {
    activities?: LeadActivityDto[];
    submissions?: LeadSubmissionDto[];
  } = {},
) {
  return render(
    <LeadDetailActivities
      activities={overrides.activities ?? []}
      submissions={overrides.submissions ?? []}
      locale="de"
      content={getLeadsDetailDictionary("de")}
      sharedContent={getLeadsSharedDictionary("de")}
    />,
  );
}
```

- [ ] **Step 2: Tests**

1. „rendert Empty-Text bei leeren Streams" — `renderActivities()`
   zeigt `content.activity.empty`.
2. „rendert Note-Activity mit Titel, Body, Actor-Label" —
   `renderActivities({ activities: [baseActivity] })` → Titel, Body
   und `Moritz` sind sichtbar.
3. „rendert Status-Change-Activity mit zwei Status-Badges" — Activity
   vom Typ `StatusChange` mit
   `metadata: { previous_status: "new", next_status: "qualified" }`
   → beide Status-Labels („Neu", „Qualifiziert") sind sichtbar; Pfeil
   `→` aus `statusChange.separator` ist sichtbar.
4. „fällt bei ungültiger Status-Change-Metadata auf body/fallback" —
   Activity ohne valide metadata → `statusChange.fallbackBody` wird
   gerendert, kein Crash.
5. „rendert Submission als Timeline-Eintrag" —
   `renderActivities({ submissions: [baseSubmission] })` → Channel-Label
   „Schnellkontakt" und Submission-Type-Label sichtbar.
6. „mergt + sortiert chronologisch DESC" — Activity vom 12.04.
   plus Submission vom 13.04. → Im DOM erscheint die Submission **vor**
   der Activity (Top-Down).
7. „nutzt Actor-Type-Fallback wenn `actorLabel` fehlt" — Activity mit
   `actorLabel: null, actorType: "system"` → `System` ist sichtbar.
8. „rendert beide Locales" — minimaler Smoke-Test mit `locale="en"`
   und `getLeadsDetailDictionary("en")` → englischer Empty-Text und
   englische Type-Labels sichtbar.

- [ ] **Step 3: Run**

Run: `npm run test -- lead-detail-activities`
Expected: PASS, alle 8 Cases grün.

### T29.4 — Detail-Panel auf neuen Activity-Stream umstellen

**Files:**

- Modify:
  `src/components/workspace/leads/detail/lead-detail-panel/lead-detail-panel.tsx`

- [ ] **Step 1: Import + Render-Stelle ersetzen**

In Zeile 1–19 ergänzen:

```tsx
import { LeadDetailActivities } from "../lead-detail-activities/lead-detail-activities";
```

Zeilen 253–265 (Activity-Section) ersetzen:

```tsx
<section className={styles.section} aria-labelledby="lead-activity-title">
  <div className={styles.sectionHeader}>
    <h3 className={styles.sectionTitle} id="lead-activity-title">
      {content.sections.activity}
    </h3>
    <button className={styles.disabledButton} disabled type="button">
      {content.actions.viewFullProfile}
    </button>
  </div>
  <LeadDetailActivities
    activities={lead.activities}
    submissions={lead.submissions}
    locale={locale}
    content={content}
    sharedContent={sharedContent}
  />
</section>
```

Der `<p className={styles.emptyText}>{content.activity.placeholder}</p>`
(Zeile 264) entfällt — Empty-Handling übernimmt jetzt die neue
Komponente.

- [ ] **Step 2: Bestehender Detail-Panel-Test prüfen**

`lead-detail-panel.test.tsx` rendert das Panel mit minimalen Lead-Daten
ohne Activities/Submissions. Falls dort hartkodiert auf
`activity.placeholder` getestet wird, Assertion auf
`activity.empty` umstellen oder den Test für die neue Empty-Logik
anpassen.

- [ ] **Step 3: Run**

Run: `npm run test -- lead-detail-panel`
Expected: PASS.

### T29.5 — Verifikation & Akzeptanz

- [ ] **Step 1: Statische Checks**

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Erwartet: alle grün.

- [ ] **Step 2: Manueller Browser-Smoke**

1. `npm run dev`, einloggen mit Allowlist-Email,
   `/de/workspace/leads`.
2. Lead mit Inbound-Submission (z. B. Quick-Contact-Eintrag) öffnen
   per Row-Click → Detail-Panel zeigt Activity-Sektion mit dem
   Submission-Eintrag (Channel-Label, Datum, Type-Label
   „Inbound-Submission", Actor „System").
3. Lead manuell anlegen (T30 läuft parallel; Fallback: Lead mit
   `source = manual` aus DB) und Status z. B. via Bulk-Bar (T31) auf
   `qualified` ändern → Detail-Panel zeigt zusätzlich eine
   `status_change`-Activity mit zwei Status-Badges und Pfeil.
4. Lead ohne Activities und ohne Submissions → Empty-Text „Noch keine
   Aktivität" wird gerendert.
5. Locale auf `/en/workspace/leads` wechseln → Empty-Text und alle
   Type-Labels auf Englisch; Datums-Formate folgen `en`-Locale.
6. Lead mit ≥3 Activities und ≥1 Submission → DOM-Reihenfolge ist
   chronologisch absteigend, neuester Eintrag oben.
7. Activity mit `actorLabel = null` → Renderer zeigt
   `actor.system` oder `actor.user` aus dem Dictionary.

- [ ] **Step 3: Akzeptanzkriterien aus 01-list-and-detail.md (Zeile
      679–680)**

- [x] Lead mit Inbound-Submission UND manueller Activity zeigt beide
      chronologisch
- [x] Leere Timeline zeigt sinnvollen Text
- [x] Kein inline-String in `.tsx`
- [x] DE und EN komplett

- [ ] **Step 4: Commit**

```bash
git add src/components/workspace/leads/detail/lead-detail-activities/ \
        src/components/workspace/leads/detail/lead-detail-panel/lead-detail-panel.tsx \
        src/i18n/dictionaries/workspace/leads/detail/de.json \
        src/i18n/dictionaries/workspace/leads/detail/en.json
git commit -m "feat(workspace/leads): add activities stream to detail panel (P1-T29)"
```

## Konventions-Compliance (Selbst-Check)

- ✅ Komponentenordner-Konvention
  (`lead-detail-activities/lead-detail-activities.{tsx,module.css,test.tsx}`)
  — AGENTS-Regel 2.
- ✅ Eine Komponente pro Datei; private Render-Helper
  (`renderActivity`, `renderStatusChange`, `renderSubmission`) sind
  Hilfsfunktionen, keine zusätzlichen exportierten Komponenten —
  Regel 3 bleibt eingehalten.
- ✅ Lokales Styling über `*.module.css`, keine Inline-Styles, keine
  globalen Klassen — Regel 4.
- ✅ Server-First: Komponente ist Server Component; kein
  `"use client"` — Regel 5. Keine Hooks, keine Browser-APIs.
- ✅ i18n verpflichtend: alle sichtbaren Strings aus
  `LeadsDetailDictionary` bzw. `LeadsSharedDictionary`. Keine
  Inline-Texte, keine `locale === "de" ? … : …` Branches — Regel 6.
- ✅ Kontrakt-Grenzen: Komponente importiert nur DTOs aus
  `src/common/contracts/leads/**` und Constants aus
  `src/common/constants/leads/**` und
  `src/common/constants/contact/**`. Kein Import aus `src/server/**` —
  Regel 7.
- ✅ Keine Mutationen → keine API-Calls → Regel 8 nicht relevant
  (Read-Only-Komponente).
- ✅ Keine PII in Logs/URLs — Regel 13. `actorLabel` und Lead-Felder
  werden nur gerendert, nicht geloggt; `actor_id` wird bewusst nicht
  angezeigt.
- ✅ Co-localisierte Tests — Regel 14 (Renderer-Logik mit Type-Guards
  verdient Tests; auch bei einer reinen Server-Komponente sinnvoll).
- ✅ Reuse: `LeadStatusBadge`, `LeadsSharedDictionary.status`,
  `formatActivityTimestamp` (lokal) — keine Duplikation der
  Status-Labels — Regel 15.
- ✅ Const-Objekt-Pattern für `ACTIVITY_TYPE_ICON`-Map (Single-Source
  via `LeadActivityType`) — `src/common/CLAUDE.md`-Regeln eingehalten.
- ✅ DTOs in camelCase; `metadata` snake_case-Keys (`previous_status`,
  `next_status`) entsprechen dem im 01-list-and-detail.md (Zeile 130)
  fixierten Vertrag der `lead_activities.metadata`.

## Risiken / offene Punkte

- **`LeadStatusBadge`-Props:** Falls die Komponente `archived` o. ä.
  nicht als gültigen Wert akzeptiert, vor T29.2 in
  `src/components/workspace/leads/shared/lead-status-badge/` Props
  prüfen. Bei Bedarf eigenständig erweitern (eigenes Ticket) oder im
  Renderer auf ein einfacheres Inline-Status-Label fallen.
- **`ContactRequestKind`-Werte:** Die Channel-Keys im Dictionary
  müssen exakt mit den Werten der Konstante in
  `src/common/constants/contact/contact-request-kind.ts`
  übereinstimmen. Vor Commit Werte verifizieren; ggf. weitere Channels
  (z. B. `newsletter`, …) in DE und EN ergänzen.
- **`metadata`-Keys snake_case vs. camelCase:** Im
  01-list-and-detail.md (Zeile 130) sind die erlaubten Keys explizit
  als `previous_status`, `next_status`, `submission_id`,
  `import_batch_id` fixiert. Wir halten daran fest, weil das
  DTO-`metadata: unknown` ist und Server-Mapper diese Keys 1:1
  durchreichen. Falls künftig ein Mapper auf camelCase normalisiert,
  Type-Guard und Channel-Map entsprechend anpassen.
- **Locale-Liste für `Intl.DateTimeFormat`:** Übergeben wird
  `Locale = "de" | "en"`; beide Werte sind valide BCP-47-Tags. Kein
  Risiko.
- **Bestehender Test `lead-detail-panel.test.tsx`:** Falls der Test
  heute auf `content.activity.placeholder` prüft, fällt er nach T29.1
  rot aus. Anpassung in T29.4 Step 2 dokumentiert.

## Out of Scope (für P1-T29)

- Inline-Edit/Add neuer Notes (Notes werden gemäß übergeordnetem Plan
  an einer anderen Stelle in P1 angelegt; T29 rendert nur).
- Pagination/Infinite-Scroll der Timeline (nur initialer Load aus
  `LeadDetailDto`).
- Filter pro Activity-Type (nicht im übergeordneten Ticket gefordert).
- Echtzeit-Updates über WebSocket/Server-Sent-Events.
- Audit-/Permission-Anzeige (`actorId` wird bewusst nicht in der UI
  gerendert).
