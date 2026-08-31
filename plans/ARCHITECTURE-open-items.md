# Architecture — Open Items

Bewusste, dokumentierte Abweichungen von Konventionen oder zurückgestellte Refactorings. Jeder Eintrag: Datei/Bereich, Regel-Referenz, Risiko, Next-Step.

---

## 1. Bulk-Handler operieren ohne Per-Row-Ownership-Filter

**Datum:** 2026-05-14
**Bereich:**

- `src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts`
- `src/server/workspace/leads/command-handler/bulk-archive-leads.command-handler.ts`
- `src/server/workspace/leads/command-handler/bulk-delete-leads.command-handler.ts`

**Regel-Referenz:** Code-Review CR #6 (`deletable/CR.md`) — empfiehlt Defense-in-Depth via `where user_id = $callerId` zusätzlich zur Route-Auth, gegen zukünftige IDOR-Vektoren.

**Risiko:** Sobald Multi-Tenancy oder Per-User-Ownership eingeführt wird, könnte ein Client beliebige Lead-UUIDs senden und Cross-Workspace-Mutationen auslösen. Aktuell mitigiert durch Allowlist + Single-Tenant-Design (`src/app/[locale]/workspace/CLAUDE.md`: „Allowlist-User teilen sich den Leads-Workspace, DB-basierte ACL erst wenn >5 User oder dynamische Permissions").

**Next-Step:**

1. Wenn Rollen-Modell oder Multi-User-Trennung kommt → Migration `add user_id to leads` (NOT NULL FK auf Clerk-User-ID-Spalte) + Backfill-Strategie festlegen.
2. Gleichzeitig **alle** Lese-/Schreib-Pfade (Single-Edit, List, Detail, Bulk) auf `where user_id = $caller` umstellen — nicht selektiv nur Bulk.
3. TODO-Marker in den drei Bulk-Handlern verweisen auf diesen Eintrag.

---

## 2. `LeadFormValues.improvements` als `Array<{ value: string }>`

**Datum:** 2026-05-14
**Bereich:** `src/common/contracts/leads/forms/lead-form-values.ts`

**Regel-Referenz:** CR #17.

**Risiko:** Gemappt im Improvements-Section-Controller hin und zurück nach `string[]` — doppelte Repräsentation, zwei Migrationspunkte bei jeder Schema-Änderung.

**Next-Step:** Migration auf `string[]` (Phase 8 des `plans/workspace/leads/bulk-edit-CR-fixes.md`).

---

## 3. `LeadFormValues` mit snake_case-Feldnamen

**Datum:** 2026-05-14
**Bereich:** `src/common/contracts/leads/forms/lead-form-values.ts` (`lead_status`, `social_profiles`)

**Regel-Referenz:** `src/common/CLAUDE.md` — DTOs in `contracts/**/*.ts` müssen camelCase nutzen.

**Risiko:** Konventions-Verstoß, existierend vor CR. Neue Form-Felder ziehen Diskrepanz weiter; Refactoring berührt Form-Defaults, Validierung, Submit-Mapper.

**Next-Step:** Eigenes Refactoring-Ticket nach Bulk-Edit-CR-Cleanup. Migration in dedizierten Commit, da Form-weite Auswirkungen.

---

## 4. Bulk-Edit Performance: per-Lead-Roundtrip-Sequenz

**Datum:** 2026-05-14
**Bereich:** `src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts`

**Regel-Referenz:** CR #8.

**Risiko:** ~3 HTTP-Roundtrips pro Lead × ≤200 Leads = bis ~600 sequenzielle Neon-HTTP-Calls. Latenz spürbar bei großen Bulk-Operationen.

**Next-Step:** Erst bei Bedarf optimieren. Möglicher Plan: ein vorgelagertes `SELECT … WHERE id = ANY($1)` lädt alle Rows in den Speicher, dann pro Lead nur eine Tx mit UPDATE + Activity-INSERT (spart ~200 SELECT-Roundtrips). Würde aber das Race-Re-Read aus CR #2 wieder schwächen — Trade-off in eigener Brainstorm-Session evaluieren.

---

## 5. `apps/workspace` dupliziert die Metadata- und Locale-Pfad-Bausteine der Web-App

**Datum:** 2026-08-30 **Bereich:**

- `apps/workspace/src/lib/seo/page-metadata.ts` — eigene Kopie: exportiertes `createLocaleAlternates`, hartes
  `languages.de` statt `DEFAULT_LOCALE`, kein `createRouteAlternates`
- `apps/workspace/src/lib/navigation/locale-pathname.ts` — Kopie von `apps/web/src/lib/navigation/locale-pathname.ts`
- `apps/workspace/src/components/auth/auth-frame/auth-frame.tsx` (Z. 25–32) — dieselbe Logik ein drittes Mal inline
- `apps/workspace/src/lib/auth/routes.ts`, `workspace-header.tsx`, `workspace-sidebar.tsx`,
  `(app)/leads/page.tsx`, `(auth)/auth-route-metadata.ts` — bauen lokalisierte Pfade per Template-Literal aus
  `locale` und `SITE_ROUTES.X` statt über `createLocalePathname`

**Regel-Referenz:** Root-`AGENTS.md` → Architektur-Prinzipien, „URL-Pfade": lokalisierte Pfade über
`createLocalePathname(SITE_ROUTES.X, locale)`, Canonical und `alternates.languages` über
`createRouteAlternates(SITE_ROUTES.X)`. Ebenda i18n: von der Locale ableitbare Werte als `Record<Locale, …>` unter
`packages/common/src/constants/i18n/`. Beide Regeln wurden am 30.08.2026 im Zuge des Referenzen-Reworks ergänzt und in
`apps/web` umgesetzt; `apps/workspace` wurde bewusst nicht mitgezogen.

**Risiko:** Aktuell gering, aber wachsend. Die Workspace-Routen sind `noindex`, es entsteht also kein SEO-Schaden. Aber
`x-default` zeigt in `apps/workspace` hart auf `languages.de`: kommt eine dritte Locale dazu oder wechselt die
Default-Locale, muss das an zwei Stellen nachgezogen werden — und eine davon wird erfahrungsgemäß vergessen. Dieselbe
Pfad-Logik existiert dreifach (Web-Helper, Workspace-Helper, inline in `auth-frame.tsx`) und kann auseinanderlaufen.

**Next-Step:** Eigener PR, nicht in einem laufenden Feature-Task.

1. Source of Truth festlegen: `createLocalePathname`, `createRouteAlternates`, `DEFAULT_LOCALE` sowie
   `SITE_URL`/`SITE_NAME` nach `packages/common` ziehen — dort liegen bereits `Locale`/`SUPPORTED_LOCALES` und seit dem
   Rework `constants/i18n/OPEN_GRAPH_LOCALE`. `SITE_ROUTES` bleibt app-spezifisch und wird als Parameter übergeben.
2. `apps/web` und `apps/workspace` auf die geteilten Helfer umstellen; die zwei `page-metadata.ts` und zwei
   `locale-pathname.ts` auf je eine reduzieren.
3. Inline-Duplikat in `auth-frame.tsx` entfernen.
4. Gate: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` plus beide App-Builds.

---

## 6. Contact-Rate-Limit zählt nur prozesslokal

**Datum:** 2026-08-31 **Bereich:**

- `apps/web/src/server/services/anti-abuse/contact-rate-limit-service.ts` — `rateLimitStore` ist eine `Map` im
  Modul-Scope (5 Anfragen / 10 Minuten je Identifier)
- Aufrufer: `apps/web/src/app/api/public/contact/route.ts`

**Regel-Referenz:** Root-`AGENTS.md` → Qualitäts-Gates, „Security by default" sowie „jede neue kritische Integration mit
dokumentiertem Fallback". Der Rate-Limit ist als Schutz gemeint, hält seine Zusage im Serverless-Betrieb aber nicht.

**Risiko:** Auf Vercel hat jede Lambda-Instanz ihre eigene `Map`. Effektiv gilt das Limit pro Instanz, nicht global —
bei n gleichzeitigen Instanzen also 5 × n —, und jeder Cold Start setzt den Zähler zurück. Ein verteilter oder auch nur
langsamer Bot läuft daran vorbei. Aktuell trägt der Honeypot im Kontaktformular (`contact-form.tsx`, stiller Erfolg ohne
Signal an den Bot) den eigentlichen Schutz; der Rate-Limit ist eine zweite, schwächere Schicht. Bewusst akzeptiert,
solange kein realer Spam ankommt.

**Next-Step:** Erst handeln, wenn Spam auftritt — kein vorsorglicher Umbau.

1. Auf geteilten Speicher wechseln (Vercel KV oder Upstash Redis), Interface von `checkContactRateLimit` beibehalten,
   damit die Aufrufseite unverändert bleibt.
2. Fallback definieren, wenn der Store nicht erreichbar ist: durchlassen und Fehler loggen — der Rate-Limit darf das
   Kontaktformular nie blockieren.
3. Gate: bestehende Tests zu `contact-rate-limit-service` auf den asynchronen Store anpassen.
