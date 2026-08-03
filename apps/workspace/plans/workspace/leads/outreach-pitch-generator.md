# Plan: Outreach-Pitch-Generator (Templates + Profile-Bridge)

## Context

Heute erzeugt die KI die **komplette** Outreach-Nachricht frei:

- `apps/workspace/local-skills/invessiv-outreach-skill/SKILL.md` wird als System-Prompt geladen
  (`outreach-skill-context-service.ts`), Lead-Fakten gehen als JSON hinterher.
- `generate-outreach-message.command-handler.ts` ruft OpenAI, parst `Subject:` / `Message:` per
  `outreach-message-parser.ts` und schreibt nur eine Activity (`MessageDrafted`) — **kein Draft wird gespeichert**.
- UI ist ein blockierendes Modal (`lead-outreach-dialog.tsx`, ausgelöst durch `lead-outreach-trigger.tsx`), ein Lead pro
  Fenster, synchron.

Folge: schwankende Texte, Zeichenlimits nicht erzwingbar, kein Hintergrundbetrieb, nach Reload ist alles weg.

**Ziel:** Fixe Pitch-Templates (`mockups/pitch.txt`) in denen die KI ausschließlich `{{Name}}` und `{{Icebreaker}}`
ersetzt. Der Icebreaker stützt sich auf **echte Profildaten**, die eine Chrome-Extension mit der Browser-Session des
Nutzers holt. Generierung läuft asynchron in einer Queue, Drafts werden persistiert, Bedienung erfolgt aus der
Lead-Tabelle und einer kompakten Leiste oben im Lead-Formular.

### Getroffene Entscheidungen

| Thema           | Entscheidung                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| Rolle der KI    | Erzeugt **nur** `salutationName`, `audience` und `icebreaker` als JSON — nie den Fließtext                     |
| Textquelle      | Feste Templates als **Repo-Dateien** neben dem Skill; kein DB-Editor                                           |
| Anrede          | **Je eine Template-Datei** für Einzelperson und Team (`*.single.txt` / `*.team.txt`)                           |
| Kanäle v1       | **Nur `instagram` + `linkedin`**; `direct_message` entfällt, `email` als TODO                                  |
| Instagram-Daten | Extension ruft `web_profile_info` mit der Session des Nutzers — **kein offener Tab nötig**                     |
| LinkedIn-Daten  | Extension liest das **DOM des bereits offenen Profil-Tabs** — kein zusätzlicher Request an LinkedIn            |
| Fallback        | **Paste-Feld** für private Profile, fehlende Extension, LinkedIn ohne offenen Tab                              |
| Websuche        | **Nicht in v1** — Snippets tragen keine echten Profilinhalte, Halluzinationsrisiko; als TODO notiert           |
| Zeichenlimit    | Server rechnet das Icebreaker-Budget **exakt** aus Templatelänge und Namenslänge; max. 2 Nachversuche          |
| Varianz         | Letzte Icebreaker desselben Leads gehen als Negativliste in den Prompt                                         |
| Persistenz      | Neue Tabelle `lead_outreach_drafts` mit Historie; aktuell = neuester Eintrag pro Lead + Kanal                  |
| Statuswechsel   | **Immer `contacted`**, über einen eigenen atomaren Command-Handler — **nie** über den Formular-Submit          |
| UI Tabelle      | Zustandsspalte + Popover mit Vorschau und Aktionen                                                             |
| UI Formular     | Kompakte Leiste **ganz oben**, unter dem Dialog-Kopf; ausklappbar auf den vollen Text                          |
| Altes Modal     | `lead-outreach-dialog` + `lead-outreach-trigger` werden **gelöscht**, nicht umgebaut                           |
| Extension-Ort   | `apps/profile-bridge` (fällt unter den `apps/*`-Workspace-Glob, kann `@invessiv/common` als Dependency nutzen) |

---

## Architektur-Überblick

```
Tabellenzeile / Formular-Leiste
  → LeadPitchQueueProvider  (Client, max. 2 parallel, Jitter)
      → profile-bridge-client-service
            → chrome.runtime.sendMessage(EXT_ID, …)
            → Extension: Instagram-API mit Session  |  LinkedIn-DOM des offenen Tabs
            → ProfileSnapshot
      → POST /api/workspace/outreach/pitch   { leadId, channel, snapshot }
            → generate-lead-pitch.command-handler
                 1. Lead laden
                 2. letzte Icebreaker laden (Negativliste)
                 3. pitch-icebreaker-service  → JSON  { salutationName, audience, icebreaker }
                 4. pitch-template-service    → Text rendern
                 5. Längenprüfung → ggf. Nachversuch mit exaktem Budget
                 6. Draft speichern + Activity MessageDrafted
      → Draft im Provider-State → Zeile "bereit"
```

Die Extension kennt **weder** OpenAI-Key **noch** Datenbank. Sie liefert ausschließlich Rohdaten. Der Server-Draft ist
die dauerhafte Wahrheit; der Provider-State ist nur die Sicht der laufenden Sitzung.

---

## Schritte

Jeder Schritt ist einzeln reviewbar und lässt das Repo grün zurück.

### Schritt 1 — Contracts & Konstanten (`packages/common`)

**Ziel:** Alle geteilten Typen stehen, bevor irgendwo Logik gebaut wird. Kein Verhalten ändert sich.

Neu unter `packages/common/src/`:

- `contracts/leads/outreach/profile-snapshot.ts`
  `ProfileSnapshot` (platform, handle, displayName, biography, headline, category, followerCount, isVerified,
  `posts: ProfileSnapshotPost[]`, source, capturedAt) und `ProfileSnapshotPost` (caption, postedAt, likeCount).
- `contracts/leads/outreach/lead-pitch-draft.dto.ts`
  `LeadPitchDraftDto` (id, leadId, channel, audience, salutationName, icebreaker, body, charCount, model, profileSource,
  createdAt).
- `contracts/leads/outreach/generate-pitch-request.dto.ts` / `generate-pitch-result.dto.ts`.
- `constants/leads/outreach/lead-pitch-audiences.ts` — `PitchAudience` (`Single` / `Team`) + Values-Array.
- `constants/leads/outreach/profile-snapshot-sources.ts` — `BridgeApi` / `BridgeDom` / `ManualPaste`.
- `constants/leads/outreach/profile-bridge-error-codes.ts` — `BridgeMissing`, `NotLoggedIn`, `ProfileNotFound`,
  `ProfilePrivate`, `TabNotOpen`, `RateLimited`, `Timeout`, `Internal`.
- `constants/leads/outreach/lead-pitch-error-codes.ts` — `LeadNotFound`, `NoProfileData`, `IcebreakerTooLong`,
  `TemplateInvalid`, `ProviderUnavailable`, `NotConfigured`, `ValidationError`, `Internal`.
- `constants/leads/outreach/lead-pitch-channel-limits.ts` — `PITCH_CHANNEL_LIMITS`
  (`instagram: 995`, `linkedin: 8000`) und `PITCH_ICEBREAKER_TARGET_CHARS = 195`.

Geändert:

- `constants/leads/outreach/lead-outreach-channels.ts` — `DirectMessage` und `Email` entfernen,
  `OUTREACH_CHANNEL_VALUES` auf `[Linkedin, Instagram]` reduzieren.

**Akzeptanz:** `pnpm --filter @invessiv/common typecheck` grün, Konstanten-Tests nach Projektregel (`toEqual` +
Duplikat-Check) vorhanden.

### Schritt 2 — Datenbank

**Ziel:** Drafts sind persistierbar.

- `packages/db/src/record-configuration/lead-outreach-drafts.ts` — `pgTable` mit
  `id`, `lead_id` (FK auf `leads`, `on delete cascade`), `channel`, `audience`, `salutation_name`, `icebreaker`,
  `body`, `char_count`, `model`, `profile_source`, `profile_captured_at`, `created_at`. Check-Constraints für `channel`
  und `audience` aus den Values-Arrays. Index auf `(lead_id, channel, created_at desc)`.
- `packages/db/src/records/lead-outreach-draft-record.ts` (snake_case, DB-nah).
- Migration + Aufnahme in den DB-Smoke.

**Akzeptanz:** `pnpm db:migrate:dev` und `pnpm db:smoke:dev` laufen durch.

### Schritt 3 — Skill & Templates (Dateien)

**Ziel:** Die Texte liegen versioniert im Repo, ohne dass schon Code sie liest.

Neu: `apps/workspace/local-skills/invessiv-pitch-skill/`

```
SKILL.md
templates/
  instagram.single.txt   instagram.team.txt
  linkedin.single.txt    linkedin.team.txt
```

- Templates aus `mockups/pitch.txt` übernehmen; Team-Varianten mit „euch/ihr" ausformulieren. Genau zwei Platzhalter:
  `{{Name}}`, `{{Icebreaker}}`.
- `SKILL.md` enthält nur noch: Icebreaker-Regeln (echter Bezug auf Post oder Bio, keine erfundenen Details, kein
  Verkauf, keine Floskel), Namenslogik (Vorname; bei Kanzlei/Praxis/Team `Name-Team`), Team-Erkennung und das
  JSON-Ausgabeschema.
- Alles zu Website-Hinweisen, `improvements`, Betreffzeilen, Sie/du-Matrix und `Subject:`/`Message:`-Contract entfällt.

`mockups/pitch.txt` und `mockups/promt.txt` werden nach der Übernahme gelöscht (Zwischenartefakte).

**Akzeptanz:** Templates enthalten beide Platzhalter, Zeichenzahl der Instagram-Templates ohne Platzhalter lässt
mindestens 195 Zeichen Rest bis 995.

### Schritt 4 — Template-Rendering (Server, ohne KI)

**Ziel:** Rendering und Budgetrechnung sind deterministisch und ohne OpenAI testbar.

- `apps/workspace/src/server/workspace/outreach/services/pitch-template-service.ts`
  - `loadTemplate(channel, audience)` mit Cache, validiert beim Laden beide Platzhalter → sonst `TemplateInvalid`.
  - `render({ channel, audience, salutationName, icebreaker })` → Text.
  - `getIcebreakerBudget({ channel, audience, salutationName })` →
    `PITCH_CHANNEL_LIMITS[channel] − Templatelänge ohne Platzhalter − Namenslänge`, gedeckelt auf
    `PITCH_ICEBREAKER_TARGET_CHARS + Toleranz`.
- `apps/workspace/next.config.ts`: `outputFileTracingIncludes` für `local-skills/**` ergänzen — **ohne das werden die
  Template- und Skill-Dateien im Vercel-Build nicht mitgepackt** (betrifft schon den heutigen Stand).

**Akzeptanz:** Unit-Tests unter `src/server/tests/workspace/outreach/services/` für alle vier Template-Kombinationen,
für die Budgetrechnung und für ein Template ohne Platzhalter.

### Schritt 5 — Icebreaker-Generierung & Command-Handler

**Ziel:** Ein Endpoint erzeugt aus Lead + Snapshot einen fertigen, gespeicherten Draft.

- `services/pitch-icebreaker-service.ts` — OpenAI-Aufruf mit `SKILL.md` als System-Prompt und einem JSON-Schema als
  Antwortformat (`salutationName`, `audience`, `icebreaker`). Eingabe: Snapshot, Lead-Basisdaten, Zeichenbudget als
  Zahl, Negativliste bisheriger Icebreaker. Erhöhte Temperatur für Varianz.
- `command-handler/generate-lead-pitch.command-handler.ts` — Ablauf wie im Architektur-Überblick, inklusive max. 2
  Nachversuchen mit neu berechnetem Budget, danach `IcebreakerTooLong`.
- `query-handler/get-latest-lead-pitch.query-handler.ts` — neuester Draft je Lead + Kanal.
- `generate-lead-pitch.schema.ts` — Zod-Validierung der Route-Payload inklusive Snapshot.
- Routen: `POST` und `GET` unter `app/api/workspace/outreach/pitch/route.ts`;
  `app/api/workspace/outreach/generate/route.ts` wird gelöscht.
  `provider-status/route.ts` bleibt unverändert.
- `lib/workspace/outreach/pitch-api-error.ts` — `Record<LeadPitchErrorCode, string>`, nicht exportierte MESSAGES-Map.

**Akzeptanz:** Handler-Tests mit gemocktem Icebreaker-Service (Erfolg, Überlänge mit Nachversuch, Provider nicht
konfiguriert, Lead nicht gefunden, leerer Snapshot), Route-Tests für Validierung und Statuscodes.

### Schritt 6 — Atomarer Statuswechsel

**Ziel:** „auf kontaktiert setzen" funktioniert unabhängig vom Formular.

- `command-handler/mark-lead-contacted.command-handler.ts` — setzt `lead_status` auf `contacted`, schreibt Activity, ist
  idempotent.
- `POST /api/workspace/leads/[id]/mark-contacted`.

**Akzeptanz:** Handler-Test inklusive doppeltem Aufruf; kein Formularfeld wird berührt.

### Schritt 7 — Extension `apps/profile-bridge`

**Ziel:** Profildaten kommen ohne manuelles Kopieren an.

- `apps/profile-bridge/` mit `package.json` (`@invessiv/profile-bridge`, Dependency auf `@invessiv/common` für
  `ProfileSnapshot`), `manifest.json` (MV3), `tsconfig.json`, `eslint.config.*`, Build nach `dist/`.
- `manifest.json`: `host_permissions` für `instagram.com` und `linkedin.com`,
  `externally_connectable.matches` für `http://localhost:3001/*` und die Prod-Domain.
- Service Worker:
  - `{ platform: "instagram", handle }` → `web_profile_info` mit `credentials: "include"` und `x-ig-app-id`
    → Normalisierung auf `ProfileSnapshot` (`source: bridge_api`).
  - `{ platform: "linkedin", profileUrl }` → passenden offenen Tab suchen, Content-Script injizieren, Name, Headline,
    Über-mich, aktuelle Position und Aktivitäten-Vorschau lesen (`source: bridge_dom`). Kein offener Tab →
    `TabNotOpen`.
  - `{ type: "ping" }` → Verfügbarkeitsprüfung.
  - Rate-Limit mit Mindestabstand und Jitter pro Plattform; bewusst keine Massen-Schleife.
- `apps/profile-bridge/AGENTS.md` + `CLAUDE.md` mit den Scope-Regeln (keine Secrets, keine Persistenz, nur
  Normalisierung, Rate-Limit-Pflicht).
- `README.md` mit der Anleitung zum Laden der entpackten Erweiterung und zum Eintragen der Extension-ID.

**Akzeptanz:** `pnpm -r lint` und `pnpm -r typecheck` schließen das neue Paket ein; Normalisierungsfunktionen sind mit
gespeicherten Beispiel-Payloads unit-getestet (kein Netzwerk im Test).

### Schritt 8 — Client-Schicht

**Ziel:** Generierung läuft im Hintergrund, Zustand ist an beiden UI-Stellen gleich.

- `client/leads/outreach/profile-bridge-client-service.ts` — `isAvailable()` mit Timeout, `captureProfile(input)`,
  Übersetzung der Bridge-Fehlercodes.
- `client/leads/outreach/lead-pitch-client-service.ts` — Draft erzeugen und laden.
- `client/leads/lead-status-client-service.ts` — `markContacted(leadId)`.
- `components/workspace/leads/pitch/lead-pitch-queue-provider/` — Kontext mit Zustand je `leadId + channel`
  (`idle` / `capturing` / `generating` / `ready` / `error`), Nebenläufigkeit 2, Jitter, Provider-Status einmal pro
  Sitzung geladen.

**Akzeptanz:** Provider-Tests für Reihenfolge, Nebenläufigkeitsgrenze und Fehlerzustände; Service-Tests mit gemocktem
`chrome`-Objekt.

### Schritt 9 — `LeadPitchPanel`

**Ziel:** Eine Komponente, zwei Darstellungen.

- `components/workspace/leads/pitch/lead-pitch-panel/` mit `variant: "compact" | "popover"`. Inhalt: Kanal-Dropdown
  (Standard aus vorhandenen Social-Profilen abgeleitet, beide Kanäle wählbar, Hinweis bei fehlender Profil-URL),
  Modell-Punkt mit Modellname, Zeichenzähler, Textvorschau mit Aufklappen, Aktionen `Kopieren`, `Neu generieren`,
  `Kopieren + kontaktiert`.
- `components/workspace/leads/pitch/lead-pitch-paste-fallback/` — erscheint bei `BridgeMissing`, `ProfilePrivate`
  oder `TabNotOpen`; eingefügter Text wird zu einem Snapshot mit `source: manual_paste`.
- i18n: neues Dictionary `workspace/leads/pitch/{de,en}.json`; `workspace/leads/outreach/*` entfällt.

**Akzeptanz:** Komponententests für Kanalwechsel, Kopieren, Fehlerzustand mit Fallback, Tastaturbedienbarkeit und
sichtbaren Fokus.

### Schritt 10 — Tabelle

**Ziel:** Anstoßen und Kopieren ohne Ansichtswechsel.

- `lead-summary.dto` um `latestPitch: { channel, createdAt } | null` erweitern; Query-Handler und Mapping-Service
  entsprechend anpassen (Mapping-Test nach Projektregel Pflicht).
- Neue Zelle `components/workspace/leads/pitch/lead-pitch-row-cell/` mit den Zuständen `—`, `läuft`, `bereit`,
  `Fehler`; Klick öffnet das Popover.
- `leads-table-row-actions.tsx`: alten Outreach-Trigger entfernen.

**Akzeptanz:** Zeilen-Tests je Zustand; Popover schließt mit Escape und gibt den Fokus zurück.

### Schritt 11 — Lead-Formular

**Ziel:** Voller Blick auf den Pitch ohne Scrollen, ohne das Formular aufzublähen.

- Neue Section-Komponente `components/workspace/leads/form/lead-form-pitch-section/`, eingehängt **direkt unter dem
  Dialog-Kopf**, über allen Feldern. Nur im Bearbeiten-Modus sichtbar.
- Nutzt `LeadPitchPanel` in der Variante `compact`; zwei Zeilen Vorschau, Aufklappen zeigt den vollständigen,
  editierbaren Text.
- `Kopieren + kontaktiert` ruft den atomaren Handler und zieht das Statusfeld im Formular optimistisch nach — **kein**
  `handleSubmit`.
- Der bisherige Outreach-Trigger im Formular entfällt.

**Akzeptanz:** Formular-Tests: Section fehlt im Anlegen-Modus; Shortcut ändert den Status, ohne andere Felder zu
speichern; ungespeicherte Feldänderungen bleiben ungespeichert.

### Schritt 12 — Abbau & Gates

**Ziel:** Keine Reste der alten Lösung.

Zu löschen:

- `components/workspace/leads/outreach/**` (Dialog, Trigger, Tests, CSS)
- `server/workspace/outreach/services/outreach-message-parser.ts`,
  `outreach-skill-context-service.ts`, `outreach-ai-service.ts` (durch die neuen Services ersetzt)
- `server/workspace/outreach/command-handler/generate-outreach-message.command-handler.ts`,
  `generate-outreach-message.schema.ts`
- `app/api/workspace/outreach/generate/route.ts`
- `client/leads/outreach/lead-outreach-generation-service.*`
- `local-skills/invessiv-outreach-skill/**`
- `constants/leads/outreach/lead-outreach-channel-profiles.ts`, `lead-outreach-copy-targets.ts`,
  `lead-outreach-trigger-variants.ts`, `lead-outreach-error-codes.ts`
- `contracts/leads/outreach/generate-outreach-request.dto.ts`, `generate-outreach-result.dto.ts`,
  `outreach-lead-facts.ts` und `patterns/leads/outreach/sanitize-lead-facts.ts`, falls kein anderer Nutzer bleibt
- zugehörige Tests unter `src/server/tests/workspace/outreach/**`
- `mockups/pitch.txt`, `mockups/promt.txt`

Dann: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build`.
`.env.example` prüfen (`OPENAI_MODEL` bleibt, keine neuen Variablen erwartet).

---

## Fehlerfälle

| Fall                                | Verhalten                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| Extension nicht installiert         | Zustand `Fehler` mit Hinweis + Paste-Fallback                                     |
| Instagram nicht eingeloggt          | Hinweis „bei Instagram anmelden", kein Retry-Sturm                                |
| Profil privat oder nicht gefunden   | Paste-Fallback anbieten                                                           |
| LinkedIn-Tab nicht offen            | Hinweis mit Link, der das Profil in einem neuen Tab öffnet, danach erneut möglich |
| Snapshot ohne Bio und ohne Posts    | Abbruch mit `NoProfileData` — **kein** generischer Icebreaker                     |
| Icebreaker nach 2 Versuchen zu lang | `IcebreakerTooLong`, Draft wird nicht gespeichert                                 |
| OpenAI nicht erreichbar             | `ProviderUnavailable`, Modell-Punkt wird rot                                      |
| Kein `OPENAI_API_KEY`               | `NotConfigured`, Generieren-Knopf deaktiviert mit Begründung                      |

---

## Risiken

- **ToS von Instagram:** Der Abruf nutzt die private Web-API mit der eigenen Session. Bei klickgetriebenem Tempo gering,
  aber nicht null — schlimmstenfalls ein Checkpoint auf dem Account. Gegenmaßnahmen: Rate-Limit, Jitter, keine
  Massen-Schleife, Nebenläufigkeit maximal 2.
- **Fragilität:** Ändert Instagram die Antwortform, bricht die Normalisierung. Sichtbar als `Fehler`-Zustand, nicht als
  stiller Fehltext; Paste-Fallback greift sofort.
- **Rollback:** Schritte 1–6 sind ohne UI-Wirkung. Ab Schritt 10/11 ist der Rückweg das Zurückrollen des Branches; die
  Migration ist additiv, die Tabelle stört bei einem Rollback nicht.

---

## Umsetzungsstand (2026-07-26)

Alle zwölf Schritte sind umgesetzt. Gates grün: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`
(1215 Tests) und `pnpm --filter @invessiv/workspace build`. Migration `0020` ist auf `development`
angewendet, `pnpm db:smoke:dev` sieht die Tabelle.

Abweichungen vom Plan:

- **Neues `PitchChannel` statt Beschneidung von `OutreachChannel`.** Hätte man `OutreachChannel` sofort auf zwei Werte
  reduziert, wären `CHANNEL_PROFILES` und das alte Modal bis Schritt 12 rot geblieben. Stattdessen kam
  `PitchChannel` (`instagram`, `linkedin`) neu dazu; `OutreachChannel` ist in Schritt 12 komplett entfallen. Jeder
  Zwischenstand blieb dadurch grün.
- **Icebreaker-Budget liegt bei 192–195 Zeichen**, nicht exakt 195: Die Instagram-Templates sind 776 (single) bzw. 779
  (team) Zeichen lang, die Namensreserve steht auf 24. Das Team-Template lässt daher 192 Zeichen.
- **`outputFileTracingIncludes`** ist auf `"/api/workspace/outreach/**"` begrenzt statt global — nur diese Routen lesen
  die Skill-Dateien.
- **`@types/chrome` und `esbuild`** kamen als Dev-Dependencies für `apps/profile-bridge` dazu. Ohne Bundler ließe sich
  der Service Worker die Contracts aus `@invessiv/common` nicht teilen.
- **Ein Test entfiel ersatzlos:** „does not trigger row navigation when the outreach button receives Space" in
  `leads-table-row.test.tsx`. Der bewachte Button existiert nicht mehr; das Äquivalent deckt jetzt
  `lead-pitch-row-cell.test.tsx` ab.

## Offene Punkte

- **LinkedIn-Verbindungsanfrage:** Die Notiz erlaubt nur 300 Zeichen; der Template-Text passt dort nicht hinein. v1
  behandelt LinkedIn als Nachricht an eine bestehende Verbindung. Falls du zuerst connectest, braucht es später ein
  eigenes Kurz-Template und den Status `connection_requested`.
- **Prod-Domain der Extension:** `externally_connectable` braucht die konkrete Workspace-Domain — muss vor Schritt 7
  feststehen.
- **Extension-ID:** Bei entpackt geladenen Erweiterungen ändert sie sich ohne festen `key` im Manifest. Für stabile
  Kommunikation einen `key` setzen.

Ergänzende Folgethemen liegen in `plans/workspace/leads/Todos.md` (E-Mail-Kanal, Websuch-Quelle).
