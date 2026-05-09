# Plan 02 — Lead bearbeiten über bestehenden Dialog

> Folge-Plan zu `01-list-and-detail.md`. Vollständiger Implementierungs-Plan mit allen Tasks:
> `~/.claude/plans/nutze-den-bestehenden-dialog-nifty-puffin.md`. Diese Datei ist die kuratierte Repo-Variante.

## Ziel

Lead-Bearbeitung über denselben Dialog wie für Create. Trigger an zwei Stellen:

- Pencil-Icon im `LeadDetailPanel`-Header (links neben Close).
- Sticky Action-Spalte rechts in der Lead-Tabelle, ein Icon-Button pro Zeile.

Server-Bausteine sind alle vorhanden (`updateLead`, `getLeadById`, `PATCH /api/workspace/leads/[id]`,
`updateLeadSchema`). Es fehlt nur Client-Service, URL-Verkabelung, Dialog-Mode-Switch und die zwei Trigger.

## Architektur-Entscheidungen

| #   | Entscheidung                                                                                        | Konsequenz                                                                                |
| --- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | `AddLeadDialog` → `LeadFormDialog` mit `mode: "create" \| "edit"` und `initialLead?: LeadDetailDto` | Eine Komponente, ein Layout, ein Schema. Submit-Switch nur an einer Stelle.               |
| 2   | Neuer URL-Param `LeadListQueryParam.Edit = "edit"` mit Lead-ID als Wert                             | Symmetrisch zu `?create`, deep-linkbar, SSR-tauglich.                                     |
| 3   | Sticky Action-Spalte rechts (`position: sticky; right: 0`)                                          | Fallback auf reguläre letzte Spalte, falls ein `overflow: hidden`-Vorfahre Sticky bricht. |
| 4   | Pencil-Icon: `faPenToSquare` aus `@fortawesome/free-solid-svg-icons`                                | Bestehendes FontAwesome-Pattern (analog `faPlus`, `faChevronLeft`).                       |

## Tasks (Reihenfolge)

1. **URL-Helper:** `LeadListQueryParam.Edit`, `buildLeadEditHref`, `buildLeadDialogCloseHref`, `parseEditLeadId`.
2. **Contracts:** `UpdateLeadRequestDto`, `UpdateLeadResult`, `AddLeadFormValues` → `LeadFormValues` (Rename).
3. **Mapper:** `mapLeadDetailDtoToLeadFormValues`, `mapLeadFormValuesToUpdateLeadRequestDto`.
4. **Client-Service:** `leadsService.updateLead(id, payload)` + Vitest-Cases (200 / 400 / 404 / 409).
5. **Dialog umstellen:** Folder-Rename `add-lead-dialog/` → `lead-form-dialog/`, Mode-Prop, `initialLead`-Prop,
   Submit-Switch, `useEffect`-`reset` bei `initialLead`-Wechsel.
6. **Page:** `parseEditLeadId`, ggf. `getLeadById(editId)` laden, redirect bei null, Dialog mit `mode`/`initialLead`/
   `editLeadId` rendern.
7. **i18n:** `form/{de,en}.json` um Edit-Texte (`title.edit`, `description.edit`, `submit.edit`, `success.edit`);
   `table` und `detail` Dictionaries um `actions.edit`. DE+EN immer im selben Commit.
8. **Detail-Panel:** Edit-Link im Header neben Close (Prop `editHref`).
9. **Tabelle:** Neue Komponente `LeadsTableRowActions` mit Sticky-Right-Cell, Header-Cell ergänzen,
   Row-Click-Propagation stoppen.
10. **Smoke + Lint/Typecheck/Build grün.**
11. **Tests:** `leads-service.test.ts` (Update-Cases), E2E `workspace-leads-edit.e2e.ts`.
12. **Diese Plan-Datei.**

## Betroffene Dateien

**Neu:**

- `src/common/contracts/leads/update-lead-request.dto.ts`
- `src/common/contracts/leads/results/update-lead-result.ts`
- `src/common/contracts/leads/forms/lead-form-values.ts` (umbenannt)
- `src/client/leads/mappers/map-lead-detail-dto-to-lead-form-values.ts`
- `src/client/leads/mappers/map-lead-form-values-to-update-lead-request-dto.ts`
- `src/components/workspace/leads/table/leads-table-row-actions/{component,css}`

**Modifiziert:**

- `src/common/constants/leads/lead-list-query-params.ts`
- `src/app/[locale]/workspace/leads/utils/lead-list-query-string.ts`
- `src/app/[locale]/workspace/leads/utils/lead-list-search-params.ts`
- `src/app/[locale]/workspace/leads/page.tsx`
- `src/components/workspace/leads/form/add-lead-dialog/*` (Rename + Mode-Erweiterung)
- `src/components/workspace/leads/detail/lead-detail-panel/*`
- `src/components/workspace/leads/table/leads-table/*`
- `src/components/workspace/leads/table/leads-table-row/*`
- `src/i18n/dictionaries/workspace/leads/form/{de,en}.json`
- `src/i18n/dictionaries/workspace/leads/table/{de,en}.json`
- `src/i18n/dictionaries/workspace/leads/detail/{de,en}.json`

## Wiederverwendet (nicht neu bauen)

- Server: `updateLead`, `getLeadById`, PATCH-Route, `updateLeadSchema`.
- DTOs: `LeadDetailDto`, bestehender Create-Mapper als Vorlage.
- UI: bestehender Dialog (Layout, Improvements/Social-Profiles-Sections), `FormField`/`FormStatus`/`FormActions`,
  `FontAwesomeIcon`, `Link`.
- URL-Helper: `buildLeadListQueryString`, `buildLeadListCloseHref` (erweitert).

## Verifikation

1. `npm run lint` / `npm run typecheck` / `npm run build` grün.
2. Pencil in Tabellenzeile → Dialog öffnet vorbefüllt, ohne Detail-Panel.
3. Pencil im Detail-Panel-Header → Dialog öffnet vorbefüllt, Detail-Panel bleibt sichtbar.
4. Submit → Status `success.edit`, `router.refresh()`, Tabelle/Panel zeigen neue Werte.
5. Doppelte E-Mail → 409 → `EmailExists`-Status.
6. `?edit=<unknownId>` → Redirect auf `?edit`-freie URL.
7. DE und EN durchklicken — keine Inline-Strings.

## Offene Risiken

- **Sticky-Right:** ggf. Fallback auf reguläre letzte Spalte (siehe Task 9).
- **Form-Reset bei Lead-Wechsel:** `useEffect`-getriebener `reset(mappedValues)` muss greifen.
- **Dictionary-Migration:** Falls bestehende Form-Keys flach sind (`title`, `submit`), entweder umbauen oder neue Keys (
  `titleEdit`, `submitEdit`) ergänzen — vor Task 7 prüfen.

## Aufgeschoben

- **Workspace-E2E `workspace-leads-edit.e2e.ts`:** Erfordert Clerk-Login-Automation, die im `e2e/`-Ordner noch nicht
  existiert. Aktuelle E2Es (`contact-lead-persistence`, `home-section-spacing`, `services-localization`) treffen
  ausschließlich öffentliche Routen. Sobald ein Clerk-Login-Helper für Allowlist-User aufgesetzt ist, gehört dieser
  Edit-Smoke in `e2e/workspace-leads-edit.e2e.ts` (Trigger: Pencil in Row → Dialog öffnet vorbefüllt; Submit →
  `success.edit`; Pencil im Detail-Panel-Header öffnet Dialog).
