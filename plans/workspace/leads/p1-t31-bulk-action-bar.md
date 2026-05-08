# P1-T31 — Bulk-Action-Bar (Implementierungs-Detailplan)

> **Übergeordneter Plan:** `plans/workspace/leads/01-list-and-detail.md`,
> Ticket P1-T31 (Zeilen 710–725).
> **Branch:** `feat/workspace-lead-section` (bestehend).
> **Skill:** `frontend-design:frontend-design`.
> **Aufwand laut übergeordnetem Plan:** 2h.

## Context

Im Plan `plans/workspace/leads/01-list-and-detail.md` (Zeile 710–725) ist Ticket
**P1-T31 — Bulk-Action-Bar** als letztes UI-Ticket der Phase-1-Lead-Liste
definiert. Der Selection-State (Checkboxen pro Row + „Select all") existiert
bereits, ebenso die Server-Seite (`/api/workspace/leads/bulk`,
`bulk-edit-leads.command-handler.ts`, `bulk-action-schema.ts`,
Activity-Logging).

Was **fehlt**: die UI-Bar selbst. Solange sie nicht existiert,

- bleibt jede Selection ohne Wirkung — Nutzer können Leads anhaken, aber nicht
  in einem Schritt umstatusieren oder archivieren,
- wird die in `01-list-and-detail.md` Verifikations-Punkt 3 geforderte
  „Bulk: 3 Leads selektieren → Mark as Qualified" / „Bulk: 2 Leads selektieren
  → Archive (mit Confirm)" nicht erfüllt,
- bleibt AGENTS-Regel 12 in `src/components/workspace/leads/AGENTS.md`
  („Bei Filter-/Sort-/Sub-View-Wechsel wird die Selection geleert")
  unimplementiert,
- bleibt die in P1-T33 (E2E-Smoke) geforderte Bulk-Action ohne UI-Träger.

Ergebnis nach Umsetzung: Bulk-Action-Bar erscheint sticky am unteren
Viewport-Rand, sobald ≥1 Lead selektiert ist. Sie unterstützt
Status-Bulk-Änderung über ein Dropdown sowie Archivieren mit Confirm-Dialog.
Nach erfolgreicher Aktion wird die Selection geleert, die Liste per
`router.refresh()` aktualisiert und der neue Status/Archiv-Zustand ist
sichtbar. Die Selection wird zusätzlich automatisch geleert, sobald sich
Filter, Sort oder Pagination ändern.

## Ziel

Sticky Bulk-Action-Bar am unteren Rand der Lead-Liste, die erscheint, sobald
mindestens ein Lead selektiert ist. Unterstützt Status-Bulk-Änderung
(„Mark as …") und Archive (mit Confirm-Dialog). Nach erfolgreicher Aktion
wird die Selection geleert und die Liste per `router.refresh()` neu
gerendert.

## Architektur

- **Neue Client-Komponente** unter
  `src/components/workspace/leads/table/leads-bulk-action-bar/`, gerendert
  innerhalb der bestehenden `LeadsTableSelectionProvider`-Scope direkt in
  `LeadsTable`. Das hält die Provider-Hierarchie unverändert
  (`LeadsTableSelectionProvider` umschließt heute schon `LeadsTable`s
  tableFrame).
- **Sticky-Position:** `position: fixed; bottom: clamp(...)`,
  `left: 50%; transform: translateX(-50%);` — Bar floatet an den Viewport,
  unabhängig vom Scroll-Container der Page-Shell.
- **Selection-Reset bei Filter-/Sort-/Pagination-Wechsel:**
  `LeadsTableSelectionProvider` wird um eine Prop `selectionResetKey: string`
  erweitert. Page reicht den vorhandenen `queryString` (enthält `status`,
  `source`, `category`, `search`, `score_min`, `date_from`, `date_to`,
  `page`, `sort`) durch `LeadsTable` an den Provider. Provider clearet
  `selectedIds` per `useEffect` bei Wechsel des Keys. Damit
  AGENTS.md-Regel 12 ohne Re-Architektur eingehalten ist.
- **Status-Dropdown-Optionen:** alle Werte aus `ContactLeadStatus` ausser
  `archived` — Archivieren hat einen eigenen Button. Labels werden aus
  `LeadsSharedDictionary.status.*` gelesen (keine Duplikation).
- **Confirm-Dialog:** natives `<dialog>`-Element nach demselben CSS-Muster
  wie `add-lead-dialog/add-lead-dialog.module.css` (Backdrop + Surface).
  Confirm erscheint nur für Archive, nicht für Status-Änderungen — Status
  ist reversibel, Archive nicht.
- **API-Aufruf:** `POST /api/workspace/leads/bulk` mit dem bestehenden
  Discriminated-Union-Body (`{ action: "set_status", ids, status }` oder
  `{ action: "archive", ids }`). Auf Success → `clearSelection()` +
  `router.refresh()`. Auf Error → Inline-Fehlertext in der Bar.
- **Loading-Zustand:** während Fetch sind Bar-Controls disabled, optionaler
  inline-Spinner im aktiven Button.

## Reuse-Punkte (kein Neubau)

- `LeadsTableSelectionProvider` + `useLeadsTableSelection` —
  Selection-State.
- `LeadBulkAction` + `leadBulkActionSchema` aus
  `src/app/api/workspace/leads/bulk/bulk-action-schema.ts` (Server-Vertrag,
  nur als Referenz für Body-Shape; UI baut JSON manuell).
- `LeadsSharedDictionary.status.*` — Statuslabels.
- `ContactLeadStatus` + `CONTACT_LEAD_STATUS_VALUES` aus
  `src/common/constants/contact/contact-lead-statuses.ts` — Statuswerte.
- CSS-Muster aus
  `src/components/workspace/leads/form/add-lead-dialog/add-lead-dialog.module.css`
  für Dialog-Backdrop/-Surface.
- `--workspace-header-height`, `--color-surface-1`, `--color-surface-2`,
  `--color-cta`, `--color-cta-hover`, `--color-border`, `--color-shadow`,
  `--color-text-muted` aus `src/app/globals.css`.

## Datei-Struktur

```
src/
├── components/workspace/leads/table/
│   ├── leads-bulk-action-bar/                      # NEU
│   │   ├── leads-bulk-action-bar.tsx
│   │   ├── leads-bulk-action-bar.module.css
│   │   └── leads-bulk-action-bar.test.tsx
│   ├── leads-table/leads-table.tsx                 # EDIT
│   └── leads-table-selection-provider/
│       └── leads-table-selection-provider.tsx     # EDIT
├── app/[locale]/workspace/leads/page.tsx           # EDIT
└── i18n/dictionaries/workspace/leads/
    ├── bulk/                                       # NEU
    │   ├── de.json
    │   └── en.json
    └── index.ts                                    # EDIT
```

## Tickets

### T31.1 — Dictionaries `bulk/{de,en}.json`

**Files:**

- Create: `src/i18n/dictionaries/workspace/leads/bulk/de.json`
- Create: `src/i18n/dictionaries/workspace/leads/bulk/en.json`

- [ ] **Step 1: `bulk/de.json` anlegen**

```json
{
  "summary": {
    "selectedOne": "{count} Lead ausgewählt",
    "selectedMany": "{count} Leads ausgewählt"
  },
  "actions": {
    "setStatusLabel": "Status setzen",
    "setStatusPlaceholder": "Als … markieren",
    "archive": "Archivieren",
    "clear": "Auswahl aufheben"
  },
  "confirm": {
    "title": "Leads archivieren?",
    "messageOne": "Du bist im Begriff, {count} Lead zu archivieren. Er ist danach nur noch über den Statusfilter „Archiviert" sichtbar.",
    "messageMany": "Du bist im Begriff, {count} Leads zu archivieren. Sie sind danach nur noch über den Statusfilter „Archiviert" sichtbar.",
    "confirmLabel": "Archivieren",
    "cancelLabel": "Abbrechen"
  },
  "errors": {
    "generic": "Aktion konnte nicht ausgeführt werden. Bitte erneut versuchen."
  }
}
```

- [ ] **Step 2: `bulk/en.json` mit identischen Top-Level-Keys anlegen**

```json
{
  "summary": {
    "selectedOne": "{count} lead selected",
    "selectedMany": "{count} leads selected"
  },
  "actions": {
    "setStatusLabel": "Set status",
    "setStatusPlaceholder": "Mark as …",
    "archive": "Archive",
    "clear": "Clear selection"
  },
  "confirm": {
    "title": "Archive leads?",
    "messageOne": "You are about to archive {count} lead. It will only be visible via the “Archived” status filter afterwards.",
    "messageMany": "You are about to archive {count} leads. They will only be visible via the “Archived” status filter afterwards.",
    "confirmLabel": "Archive",
    "cancelLabel": "Cancel"
  },
  "errors": {
    "generic": "The action could not be completed. Please try again."
  }
}
```

- [ ] **Step 3: Verifikation `npm run typecheck`**

Run: `npm run typecheck`
Expected: PASS — JSON wird in T31.2 typisiert importiert.

### T31.2 — Dictionary-Loader `getLeadsBulkDictionary`

**Files:**

- Modify: `src/i18n/dictionaries/workspace/leads/index.ts`

- [ ] **Step 1: Imports + Type + Record + Loader ergänzen**

Pattern strikt 1:1 zu den bestehenden Loadern (Toolbar/Form/etc.). Konkret
im `index.ts`:

```ts
import bulkDe from "./bulk/de.json";
import bulkEn from "./bulk/en.json";

export type LeadsBulkDictionary = typeof bulkDe;

const LEADS_BULK: Record<Locale, LeadsBulkDictionary> = {
  de: bulkDe,
  en: bulkEn,
};

export function getLeadsBulkDictionary(locale: Locale): LeadsBulkDictionary {
  return LEADS_BULK[locale];
}
```

- [ ] **Step 2: `npm run typecheck`**

Run: `npm run typecheck`
Expected: PASS.

### T31.3 — `LeadsTableSelectionProvider` um `selectionResetKey` erweitern

**Files:**

- Modify:
  `src/components/workspace/leads/table/leads-table-selection-provider/leads-table-selection-provider.tsx`

Hintergrund: Provider lebt heute innerhalb von `LeadsTable`. Toolbar/Filter
kann den Provider nicht direkt aufrufen. Stattdessen reicht die Page einen
Key (serialisierter Filter-/Sort-/Pagination-State) durch, der bei jeder
URL-Änderung mutiert. Provider clearet `selectedIds` als Effekt darauf.

- [ ] **Step 1: Prop `selectionResetKey` ergänzen + Reset-Effekt**

```tsx
"use client";

import { type ReactNode, useEffect, useState } from "react";
import { LeadsTableSelectionContext } from "./leads-table-selection-context";

type LeadsTableSelectionProviderProps = {
  children: ReactNode;
  rowIds: string[];
  selectionResetKey: string;
};

export function LeadsTableSelectionProvider({
  children,
  rowIds,
  selectionResetKey,
}: LeadsTableSelectionProviderProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds([]);
  }, [selectionResetKey]);

  // ... bestehender Code unverändert (selectedCount, allSelected,
  //     someSelected, isSelected, toggleRow, toggleAll, clearSelection,
  //     return-JSX)
}
```

- [ ] **Step 2: Bestehende Tests aktualisieren**

`leads-table.test.tsx` rendert die Tabelle und damit indirekt den Provider —
Tests müssen ggf. eine `selectionResetKey`-Prop durchreichen. Verifizieren
mit `npm run test -- leads-table`.

- [ ] **Step 3: Commit**

```bash
git add src/components/workspace/leads/table/leads-table-selection-provider/
git commit -m "feat(workspace/leads): add selectionResetKey to selection provider"
```

### T31.4 — `LeadsTable` reicht `selectionResetKey` durch und rendert die Bar

**Files:**

- Modify:
  `src/components/workspace/leads/table/leads-table/leads-table.tsx`

- [ ] **Step 1: Prop-Signatur erweitern und an Provider durchreichen**

In `LeadsTableProps` ergänzen:

```ts
type LeadsTableProps = {
  // ... bestehende Props ...
  bulkContent: LeadsBulkDictionary;
};
```

Der bestehende `queryString` (bereits Prop) wird als `selectionResetKey`
benutzt:

```tsx
<LeadsTableSelectionProvider rowIds={rowIds} selectionResetKey={queryString}>
  {/* tableFrame ... */}
  <LeadsBulkActionBar bulkContent={bulkContent} sharedContent={sharedContent} />
</LeadsTableSelectionProvider>
```

- [ ] **Step 2: Imports ergänzen**

```ts
import { LeadsBulkActionBar } from "../leads-bulk-action-bar/leads-bulk-action-bar";
import type { LeadsBulkDictionary } from "@/i18n/dictionaries/workspace/leads";
```

### T31.5 — `page.tsx` lädt Bulk-Dictionary und reicht es durch

**Files:**

- Modify: `src/app/[locale]/workspace/leads/page.tsx`

- [ ] **Step 1: Import + Loader-Aufruf ergänzen**

```ts
import {
  getLeadsBulkDictionary,
  /* übrige Loader unverändert */
} from "@/i18n/dictionaries/workspace/leads";

// im Body:
const bulkContent = getLeadsBulkDictionary(locale as Locale);
```

- [ ] **Step 2: `<LeadsTable bulkContent={bulkContent} ... />` durchreichen**

Restliche Props bleiben unverändert.

- [ ] **Step 3: `npm run typecheck`**

Expected: PASS.

### T31.6 — `LeadsBulkActionBar` Komponente + Styles

**Files:**

- Create:
  `src/components/workspace/leads/table/leads-bulk-action-bar/leads-bulk-action-bar.tsx`
- Create:
  `src/components/workspace/leads/table/leads-bulk-action-bar/leads-bulk-action-bar.module.css`

#### Verhalten

- Hook `useLeadsTableSelection()` ⇒ `selectedIds`, `selectedCount`,
  `clearSelection`.
- Wenn `selectedCount === 0` ⇒ Bar wird nicht gerendert (Early-Return
  `null`).
- Lokaler State:
  - `pending: false | "set_status" | "archive"` — gibt an, welche Action
    gerade läuft, disabled alle Controls global.
  - `error: string | null` — Inline-Fehlertext unter den Controls.
  - `confirmOpen: boolean` — steuert das `<dialog>` für Archive.
- Status-Dropdown: `<select>` mit Optionen aus
  `CONTACT_LEAD_STATUS_VALUES.filter((s) => s !== ContactLeadStatus.Archived)`.
  Anzeige-Label kommt aus `sharedContent.status[value]`. Initialwert ist
  Placeholder „Als … markieren"
  (`bulkContent.actions.setStatusPlaceholder`), Auswahl triggert die Action
  sofort (kein „Apply"-Button — UX-Vereinfachung, `<select onChange>`).
- Archive-Button öffnet `<dialog>` mit Confirm. Confirm-Klick triggert die
  Archive-Action. Cancel/Backdrop-Klick schließt den Dialog ohne Aktion.
- Clear-Button (Sekundärbutton, links neben den Aktions-Buttons) ruft
  `clearSelection()`.
- Count-Label: bei `selectedCount === 1` `summary.selectedOne` mit
  `{count}`, sonst `summary.selectedMany`. Replacement minimal, ohne
  i18n-Lib —
  `String(content.summary.selectedMany).replace("{count}", String(selectedCount))`.

#### Action-Implementierung

Eine private async-Funktion `performBulkAction`:

```tsx
async function performBulkAction(
  body:
    | { action: "set_status"; ids: string[]; status: ContactLeadStatus }
    | { action: "archive"; ids: string[] },
  kind: "set_status" | "archive",
) {
  setPending(kind);
  setError(null);
  try {
    const response = await fetch("/api/workspace/leads/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      setError(bulkContent.errors.generic);
      return;
    }
    clearSelection();
    setConfirmOpen(false);
    router.refresh();
  } catch {
    setError(bulkContent.errors.generic);
  } finally {
    setPending(false);
  }
}
```

Status-Action: `performBulkAction({ action: "set_status", ids: selectedIds,
status }, "set_status")`.
Archive-Action: `performBulkAction({ action: "archive", ids: selectedIds },
"archive")`.

#### Markup-Skelett (`leads-bulk-action-bar.tsx`)

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  ContactLeadStatus,
  CONTACT_LEAD_STATUS_VALUES,
} from "@/common/constants/contact/contact-lead-statuses";
import type {
  LeadsBulkDictionary,
  LeadsSharedDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { useLeadsTableSelection } from "../leads-table-selection-provider/leads-table-selection-context";
import styles from "./leads-bulk-action-bar.module.css";

const STATUS_OPTIONS = CONTACT_LEAD_STATUS_VALUES.filter(
  (status) => status !== ContactLeadStatus.Archived,
);

type LeadsBulkActionBarProps = {
  bulkContent: LeadsBulkDictionary;
  sharedContent: LeadsSharedDictionary;
};

export function LeadsBulkActionBar({
  bulkContent,
  sharedContent,
}: LeadsBulkActionBarProps) {
  const router = useRouter();
  const { selectedIds, selectedCount, clearSelection } =
    useLeadsTableSelection();
  const [pending, setPending] = useState<false | "set_status" | "archive">(
    false,
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  const summaryTemplate =
    selectedCount === 1
      ? bulkContent.summary.selectedOne
      : bulkContent.summary.selectedMany;
  const summary = summaryTemplate.replace("{count}", String(selectedCount));

  const confirmTemplate =
    selectedCount === 1
      ? bulkContent.confirm.messageOne
      : bulkContent.confirm.messageMany;
  const confirmMessage = confirmTemplate.replace(
    "{count}",
    String(selectedCount),
  );

  async function performBulkAction(/* siehe oben */) {
    /* siehe oben */
  }

  return (
    <>
      <div
        className={styles.bar}
        role="region"
        aria-label={bulkContent.actions.setStatusLabel}
        data-pending={pending !== false}
      >
        <span className={styles.summary}>{summary}</span>
        <div className={styles.controls}>
          <label className={styles.selectLabel}>
            <span className="sr-only">
              {bulkContent.actions.setStatusLabel}
            </span>
            <select
              className={styles.select}
              defaultValue=""
              disabled={pending !== false}
              onChange={(event) => {
                const next = event.target.value as ContactLeadStatus;
                event.target.value = "";
                if (!next) return;
                void performBulkAction(
                  { action: "set_status", ids: selectedIds, status: next },
                  "set_status",
                );
              }}
            >
              <option value="" disabled>
                {bulkContent.actions.setStatusPlaceholder}
              </option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {sharedContent.status[status]}
                </option>
              ))}
            </select>
          </label>

          <button
            className={styles.archiveButton}
            disabled={pending !== false}
            onClick={() => setConfirmOpen(true)}
            type="button"
          >
            {bulkContent.actions.archive}
          </button>

          <button
            className={styles.clearButton}
            disabled={pending !== false}
            onClick={() => clearSelection()}
            type="button"
          >
            {bulkContent.actions.clear}
          </button>
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>

      {confirmOpen ? (
        <div className={styles.overlay} role="presentation">
          <dialog
            className={styles.dialog}
            open
            aria-labelledby="bulk-confirm-title"
          >
            <h2 id="bulk-confirm-title" className={styles.dialogTitle}>
              {bulkContent.confirm.title}
            </h2>
            <p className={styles.dialogMessage}>{confirmMessage}</p>
            <div className={styles.dialogActions}>
              <button
                className={styles.dialogCancel}
                disabled={pending !== false}
                onClick={() => setConfirmOpen(false)}
                type="button"
              >
                {bulkContent.confirm.cancelLabel}
              </button>
              <button
                className={styles.dialogConfirm}
                disabled={pending !== false}
                onClick={() =>
                  performBulkAction(
                    { action: "archive", ids: selectedIds },
                    "archive",
                  )
                }
                type="button"
              >
                {bulkContent.confirm.confirmLabel}
              </button>
            </div>
          </dialog>
        </div>
      ) : null}
    </>
  );
}
```

#### CSS-Skelett (`leads-bulk-action-bar.module.css`)

- `.bar` — `position: fixed; left: 50%; bottom: 1.25rem;
transform: translateX(-50%); z-index: 50;` plus `display: flex;
align-items: center; gap: 1rem; background: var(--color-surface-1);
border: 1px solid var(--color-border); border-radius: 999px;
padding: 0.5rem 1rem; box-shadow: 0 12px 32px var(--color-shadow);`.
- `.summary` — `color: var(--color-text-muted); font-weight: 600;`.
- `.controls` — `display: flex; gap: 0.5rem; align-items: center;`.
- `.select`, `.archiveButton`, `.clearButton` — Button-Tokens analog zu
  Add-Lead-Dialog-Buttons (Pillen-Form, `--color-cta`/`--color-cta-hover`
  für Archive/Status; `--color-surface-2`-Variante für Clear).
- `.overlay` — `position: fixed; inset: 0;
background: rgba(12, 10, 9, 0.72); backdrop-filter: blur(8px);
display: grid; place-items: center; z-index: 60;` (analog
  `add-lead-dialog.module.css:.overlay`).
- `.dialog` — Surface analog Add-Lead-Dialog (Surface-Gradient, Border).
- `.dialogActions` — `display: flex; justify-content: flex-end;
gap: 0.5rem;`.
- `.error` — `color: #f87171; font-size: 0.875rem;` (oder vorhandenes
  `--color-danger`-Token, falls definiert).
- `[data-pending="true"]` Variante setzt `opacity: 0.7;
pointer-events: none;`.
- Mobile-Breakpoint `@media (max-width: 640px)`: Bar wird
  `width: calc(100% - 2rem); left: 1rem; right: 1rem; transform: none;
border-radius: 1rem;`.

### T31.7 — Tests `leads-bulk-action-bar.test.tsx`

**Files:**

- Create:
  `src/components/workspace/leads/table/leads-bulk-action-bar/leads-bulk-action-bar.test.tsx`

Vorbild: `leads-toolbar.test.tsx` (mockt `next/navigation`, nutzt
`@testing-library/react`, vitest-jsdom-Env).

- [ ] **Step 1: Setup**

```tsx
// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLeadsBulkDictionary,
  getLeadsSharedDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { LeadsBulkActionBar } from "./leads-bulk-action-bar";
import { LeadsTableSelectionProvider } from "../leads-table-selection-provider/leads-table-selection-provider";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const fetchMock = vi.fn();

beforeEach(() => {
  refreshMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

function renderWithProvider(
  rowIds: string[] = ["lead-1", "lead-2"],
  selectionResetKey = "k1",
) {
  return render(
    <LeadsTableSelectionProvider
      rowIds={rowIds}
      selectionResetKey={selectionResetKey}
    >
      <LeadsBulkActionBar
        bulkContent={getLeadsBulkDictionary("de")}
        sharedContent={getLeadsSharedDictionary("de")}
      />
    </LeadsTableSelectionProvider>,
  );
}
```

- [ ] **Step 2: Tests**

1. „rendert nicht, wenn keine Selection" — Provider ohne Toggles, Bar
   sollte nicht im DOM sein.
2. „zeigt Singular-Summary bei genau einem selektierten Lead" — Selection
   per Test-Wrapper aufbauen.
3. „setzt Status via API und ruft `router.refresh` auf Erfolg" —
   Status-Select ändern → `fetch` wird mit Body
   `{ action: "set_status", ids: [...], status: "qualified" }`
   aufgerufen, nach Resolve `refresh.mock.calls.length === 1`.
4. „archiviert nach Confirm" — Archive-Button klicken → Dialog erscheint →
   Confirm klicken → `fetch` mit `{ action: "archive", ids: [...] }`.
5. „archiviert nicht bei Cancel" — Cancel im Dialog → `fetch` nicht
   aufgerufen.
6. „zeigt Fehlertext bei API-Fehler" — `fetch` resolved mit
   `{ ok: false }`, Inline-Error sichtbar.
7. „leert Selection bei `selectionResetKey`-Wechsel" — Provider rerendern
   mit neuem Key → Bar verschwindet.

Da der Provider `selectedIds` rein intern hält, sollten die Tests die
Selection über UI-Toggles aufbauen. Variante: Test-Wrapper, der zusätzlich
einen Toggle-Button rendert, der `useLeadsTableSelection().toggleRow(id)`
aufruft. Vorlage: `leads-pagination.test.tsx` zeigt, wie UI-getriebene
State-Tests aufgebaut sind.

- [ ] **Step 3: `npm run test -- leads-bulk-action-bar`**

Expected: PASS, alle 7 Cases grün.

### T31.8 — Verifikation & Akzeptanz

- [ ] **Step 1: Statische Checks**

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Expected: alle grün.

- [ ] **Step 2: Manueller Browser-Smoke (Mockup-Vergleich)**

1. `npm run dev`, einloggen mit Allowlist-Email,
   `/de/workspace/leads`.
2. 3 Leads anhaken → Bar erscheint mit Count „3 Leads ausgewählt".
3. „Als … markieren" → „Qualifiziert" → Bar disabled kurz, Liste-Reload
   zeigt drei Rows mit Status „Qualifiziert".
4. 2 Leads anhaken → „Archivieren" → Confirm-Dialog erscheint →
   „Archivieren" → Rows verschwinden aus Standardliste; `?status=archived`
   zeigt sie wieder.
5. Filter wechseln (z. B. Tab „Neu") → Selection ist leer, Bar
   verschwindet.
6. Sort wechseln → Selection ist leer.
7. Pagination weiterklicken → Selection ist leer.
8. EN-Locale auf `/en/workspace/leads` analog testen — alle Strings auf
   EN.
9. Mobile-Breakpoint (DevTools 375 px) — Bar nimmt volle Breite, Controls
   wrappen sauber.

- [ ] **Step 3: Akzeptanzkriterien aus 01-list-and-detail.md (Zeile
      723–724)**

- [x] Status-Wechsel sichtbar in Tabellen-Rows nach Refresh
- [x] Archivierte Leads verschwinden aus Standardliste
- [x] Checkbox-Selection beim Filter-Change gecleared
- [x] Kein inline-String in `.tsx`
- [x] DE und EN komplett

- [ ] **Step 4: Final-Commit**

```bash
git add src/components/workspace/leads/table/leads-bulk-action-bar/ \
        src/components/workspace/leads/table/leads-table/ \
        src/components/workspace/leads/table/leads-table-selection-provider/ \
        src/i18n/dictionaries/workspace/leads/bulk/ \
        src/i18n/dictionaries/workspace/leads/index.ts \
        src/app/[locale]/workspace/leads/page.tsx
git commit -m "feat(workspace/leads): add bulk-action-bar (P1-T31)"
```

## Konventions-Compliance (Selbst-Check)

- ✅ Keine Inline-Strings — alles aus `bulk/{de,en}.json` oder
  `shared/{de,en}.json`.
- ✅ DE+EN identische Top-Level-Keys, gleicher Commit.
- ✅ Komponentenordner-Konvention
  (`leads-bulk-action-bar/leads-bulk-action-bar.{tsx,module.css,test.tsx}`).
- ✅ Server-vs-Client: Bar ist `"use client"` weil
  URL-/Selection-/Fetch-Logik; Provider war bereits Client-Komponente.
- ✅ Mutationen über `/api/workspace/leads/bulk`, `router.refresh()` nach
  Success — exakt wie AGENTS-Regel 8 fordert.
- ✅ Selection-Provider Rule 12: Reset bei
  Filter/Sort/Pagination-Wechsel.
- ✅ Keine Imports aus `src/server/**` in Komponenten — nur
  DTOs/Constants.
- ✅ Keine PII in URL/Logs — Bar referenziert nur Lead-IDs.
- ✅ Co-locierte Tests, weil interaktive Komponente (Rule 14).
- ✅ Status-Labels werden zentral aus `shared/de.json` aufgelöst, keine
  Duplikation.
- ✅ Confirm-Dialog folgt CSS-Pattern aus `add-lead-dialog`, kein
  generischer Dialog-Provider eingeführt — keine YAGNI-Verletzung.

## Risiken / offene Punkte

- **`<select>`-Styling für Dark-Surface:** Das native `<select>` muss mit
  Custom-Caret-Pfeil und korrekten Hover-Tokens versehen werden
  (Add-Lead-Dialog hat in seiner CSS bereits eine Vorlage für
  `select`-Hintergrund/Caret — diese Vorlage übernehmen, nicht neu
  erfinden).
- **Sticky-vs-Fixed:** Wenn die Workspace-Shell intern eine
  `overflow-y: auto`-Region hat und die Bar visuell „kleben" soll, kann
  `position: sticky; bottom: 0;` nötig sein. Der Plan setzt
  `position: fixed`, weil aktuell kein internes Scroll-Container-Pattern
  beobachtet wurde. Beim Browser-Smoke verifizieren; falls hinterm
  Workspace-Header verdeckt → auf sticky umstellen und Container-Scope
  prüfen.
- **`selectionResetKey` und Add-Lead-Dialog-Open:** Beim Öffnen des
  Add-Lead-Dialogs setzt die Page einen `?create`-Param — dadurch ändert
  sich `queryString`. Das clearet die Selection auch beim Dialog-Öffnen.
  Akzeptabel, weil Dialog visuell die Bar überlagert. Falls unerwünscht:
  aus `queryString` vor Übergabe `create` herausfiltern. Im Plan zunächst
  „akzeptiert".

## Out of Scope (für P1-T31)

- Keep-Selection-Across-Pages (in P1 explizit nicht angefordert).
- Kategorie-Bulk-Edit, Owner-Bulk-Edit (nicht im Ticket-Umfang).
- Hard-Delete (laut 01-list-and-detail.md „Bulk-Aktionen"-Tabelle: kein
  Hard-Delete in P1).
- Optimistic UI-Updates (keine optimistische Statusänderung;
  Server-Refresh nach Erfolg ist robust genug).
