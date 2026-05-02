# Phase 3 — Workspace Leads: Outreach-Message-Generator (Template-basiert)

> **Branch:** `feat/workspace-leads-phase-3`
> **Geschätzter Aufwand:** ~8–10h
> **Abhängigkeiten:** `01-list-and-detail.md` (Detail-Panel, Activities, Lead-Detail-Query); `02-import-export.md` empfohlen für realistische Test-Daten, aber nicht zwingend

## Context

Sobald Leads im Workspace verwaltet werden, soll der nächste Outreach-Schritt erleichtert werden: aus den Lead-Daten (Vorname, Website, Verbesserungsvorschläge, Kategorie) wird ein vorgefertigter Outreach-Text gerendert, den du in LinkedIn (oder andere Kanäle) kopierst und versendest. Phase 3 implementiert das **template-basiert** (vordefinierte Mustache-Style-Templates) — die Claude-API-basierte Personalisierung wird aktuell als Roadmap-Item erfasst, ist aber **nicht** Teil dieser Phase (Budget).

### Geklärte Entscheidungen

| Bereich              | Entscheidung                                                     |
| -------------------- | ---------------------------------------------------------------- |
| Generator-Typ        | Template-basiert + Copy-to-Clipboard                             |
| Activity-Logging     | Bei Render: Activity `type=message_drafted` mit Body in Metadata |
| Tatsächliches Senden | NICHT Teil von P3 (kein Email-/LinkedIn-Send)                    |
| Claude-API-Variante  | Roadmap (siehe unten), Budget aktuell nicht freigegeben          |

---

## Architektur

### Template-System

- Templates als TS-Konstanten unter `src/server/workspace/leads/lead-message-templates/`
- Pro Template: `key`, `localeBodies: Record<SupportedLocale, { subject?, body }>`, `requiredFields: string[]` (z.B. `['email','website_url','improvements']`)
- Mustache-Style-Placeholder: `{{first_name|fallback:'there'}}`, `{{website_url}}`, `{{improvements.0}}`, `{{improvements.1}}`, `{{category}}`
- Initial 3 Templates pro Locale:
  - `linkedin-first-touch` — kurzer LinkedIn-Verbindungs-Pitch
  - `email-follow-up` — längere E-Mail mit Verbesserungs-Hinweisen
  - `discovery-invitation` — Termin-Vorschlag

### Render-Pipeline

```
{ templateKey, leadId, locale }
   → Lead aus DB laden (Reuse: getLeadById)
   → Template aus Registry holen
   → Required-Fields-Check (fehlende Felder → 422 mit Liste)
   → Render Subject + Body mit safe placeholder substitution (kein "undefined" im Output)
   → Activity log (type=message_drafted, body=rendered, metadata={ templateKey, locale })
   → Return { subject, body, templateKey, locale }
```

### Verzeichnisstruktur (Phase 3)

```
src/
├── app/api/workspace/leads/[id]/
│   └── message/route.ts                 # POST
├── components/workspace/leads/
│   └── lead-message-dialog/             # Im Detail-Panel: "Generate message"
├── server/workspace/leads/
│   ├── lead-message-template.service.ts # Render-Logic
│   └── lead-message-templates/
│       ├── index.ts                     # Registry
│       ├── linkedin-first-touch.ts
│       ├── email-follow-up.ts
│       └── discovery-invitation.ts
└── common/contracts/leads/
    └── lead-message-template.dto.ts
```

---

## Tickets

### Templates

#### P3-T1 — Template-Definition + i18n

- **Files:**
  - `src/server/workspace/leads/lead-message-templates/index.ts` (Registry)
  - `src/server/workspace/leads/lead-message-templates/linkedin-first-touch.ts`
  - `src/server/workspace/leads/lead-message-templates/email-follow-up.ts`
  - `src/server/workspace/leads/lead-message-templates/discovery-invitation.ts`
- **Inhalt:** Initial 3 Templates pro Locale (DE + EN parallel)
  - Beispiel `linkedin-first-touch.de`: `Hi {{first_name|fallback:'zusammen'}}, ich habe {{website_url}} angeschaut: {{improvements.0}}, {{improvements.1}}. Wäre ein kurzer Austausch interessant?`
  - Subject nur bei Email-Templates
- **Skills:** `invessiv-landing` (für Tonalität, falls relevant) — sonst keine
- **Akzeptanz:** Templates liegen als TS-Konstanten, getypt; Registry exportiert `getMessageTemplate(key)`
- **Aufwand:** 2h

#### P3-T2 — Template-Render-Service

- **Files:** `src/server/workspace/leads/lead-message-template.service.ts`
- **Inhalt:**
  - `renderMessage({ templateKey, lead, locale }): { subject?, body }`
  - Sicherer Placeholder-Ersatz: `{{field}}` → `lead.field ?? ''`; `{{field|fallback:'X'}}` → `lead.field ?? 'X'`; `{{array.N}}` → `array[N] ?? ''`
  - Required-Fields-Check: gibt `{ ok: false, missing: string[] }` wenn unzureichend
  - Niemals `undefined` im Output
- **Skills:** `superpowers:test-driven-development`
- **Akzeptanz:** Tests für jedes Template mit kompletten + minimalen Lead-Daten; fehlende Required-Fields → erwartete Error-Response
- **Aufwand:** 2h

### API + UI

#### P3-T3 — API-Route `POST /api/workspace/leads/[id]/message`

- **Files:** `src/app/api/workspace/leads/[id]/message/route.ts`
- **Inhalt:**
  - Body: `{ templateKey, locale }` → Returns `{ subject?, body, templateKey, locale }`
  - Loggt Activity `type=message_drafted` mit gerendertem Body in `metadata`
  - 404 wenn Lead nicht existiert; 422 wenn Required-Fields fehlen (mit Liste)
  - Nutzt `withWorkspaceApiAuth`
- **Akzeptanz:** Tests für valid render, missing fields, non-existing lead, unauthorized
- **Aufwand:** 1,5h

#### P3-T4 — UI: `<LeadMessageDialog>` im Detail-Panel

- **Files:**
  - `src/components/workspace/leads/lead-message-dialog/` (neu)
  - `src/components/workspace/leads/lead-detail-panel/` (Edit: "Generate message"-Button hinzufügen)
- **Inhalt:**
  - Button "Generate message" öffnet Modal
  - Template-Picker (Liste mit Beschreibung) → "Generate" → POST → Editierbares Textarea (Subject + Body)
  - "Copy to Clipboard" Button → `navigator.clipboard.writeText(...)` → Toast "Kopiert"
  - Activity wird bereits beim Render-API-Call angelegt (kein doppelter Call beim Copy)
  - Bei 422 (missing fields): Hinweis "Bitte ergänze: …" mit Liste der fehlenden Felder + Link zum Edit-Form
- **Skills:** `frontend-design:frontend-design`
- **Akzeptanz:** Mit Test-Lead Click "Generate" → Text erscheint mit Lead-Daten gefüllt → Copy funktioniert (manuell verifizieren); fehlende Felder werden korrekt gemeldet
- **Aufwand:** 2,5h

### Pre-Merge

#### P3-T5 — Pre-Merge-Gate

- **Inhalt:** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` grün; manueller Test mit min. 3 Leads (komplette Daten + minimale Daten); Code-Review per `superpowers:requesting-code-review`
- **Aufwand:** 0,5h

---

## Verifikation (End-to-End-Akzeptanz Phase 3)

1. Alle Phase-1-Gates weiterhin grün
2. Im Detail-Panel: "Generate message" → Template-Picker zeigt 3 Templates → jedes funktioniert
3. Generierter Text enthält tatsächliche Lead-Daten (Vorname/Fallback, Website, Verbesserungen)
4. Bei Lead ohne `website_url` für `email-follow-up`: 422-Hinweis mit Feld-Liste
5. Copy-Action erzeugt Toast "Kopiert" + Clipboard-Inhalt entspricht Textarea
6. Im Activity-Stream des Leads erscheint nach Render ein `message_drafted`-Eintrag mit Locale + Template-Key in Metadata

## Reuse-Punkte

- `withWorkspaceApiAuth` (aus P1-T13)
- `getLeadById` (aus P1-T9)
- `append-lead-activity` (aus P1-T10)
- `lead-detail-panel` (aus P1-T23) — Erweiterung um "Generate message"-Button
- i18n-Pattern aus `src/i18n/dictionaries/workspace/leads/` (aus P1-T17) — Texte für Modal/Toast

## Skill-Übersicht (Phase 3)

| Skill                                        | Tickets                         |
| -------------------------------------------- | ------------------------------- |
| `invessiv-landing`                           | T1 (Tonalität der Templates)    |
| `superpowers:test-driven-development`        | T2, T3                          |
| `superpowers:verification-before-completion` | T5                              |
| `superpowers:requesting-code-review`         | T5                              |
| `frontend-design:frontend-design`            | T4                              |
| `superpowers:systematic-debugging`           | bei Bugs während Implementation |

---

## Roadmap (post-Phase-3)

| Feature                                  | Trigger                                           | Notiz                                                                                                                                                     |
| ---------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Claude-API-basierte Personalisierung** | Wenn Template-Output zu generisch                 | `claude-api`-Skill nutzen, prompt-caching für Lead-Kontext, Cost-Cap pro Call. Ergänzt `template-render-service` um optionalen `mode: 'template' \| 'ai'` |
| Bulk Owner-Zuweisung + Tags-Bulk         | Sobald >1 User auf Allowlist / Outreach-Kampagnen | UI-Erweiterung der Bulk-Bar                                                                                                                               |
| Soft-Delete + Trash                      | Wenn versehentliches Löschen passiert             | `deleted_at` Spalte + Filter                                                                                                                              |
| Owner als Clerk-User-Ref                 | Wenn >1 User berechtigt                           | Migration `owner` → `owner_clerk_id`                                                                                                                      |
| "View full profile" als eigene Page      | Wenn Detail-Panel zu klein                        | `/[locale]/workspace/leads/[id]/page.tsx`                                                                                                                 |
| E-Mail-Send via Resend                   | Wenn manuelles Copy-to-Clipboard nervt            | `sendMail`-Service (`src/server/services/mail/`) reusable                                                                                                 |
| Activity: Inline-Note schreiben          | UX-Verbesserung im Detail-Panel                   | Form + API                                                                                                                                                |
| Excel/.xlsx-Import                       | Falls CSV nicht reicht                            | `xlsx` lib oder Server-Konvertierung                                                                                                                      |
