---
name: linkedin-post-generator
description: >
  Specification for generating a single LinkedIn post (1080x1080 PNG +
  caption + machine-readable result.json) from a visitor's topic,
  expertise, tone, and locale — as submitted via the
  /[locale]/services/linkedin-post generator form.
  This SKILL.md is the canonical contract. Implementations live in the
  server pipeline (Tasks B3+B4+B7 in apps/web/plans/ai-workflows/
  umsetzungsplan-steps.md) and are also used by Codex for manual,
  local runs. Inputs are restricted to the four content fields;
  email/consent/honeypot are server-side concerns and outside this
  skill's contract.
---

# LinkedIn Post Generator — Skill Specification

This skill specifies exactly **one** deliverable: a single LinkedIn
square post (1080x1080 PNG) + caption + a machine-readable
`result.json`. No carousel, no multi-post run, no Invessiv branding
on the post itself.

**Task references** (`A4`, `B3`, `B4`, …) point to
`apps/web/plans/ai-workflows/umsetzungsplan-steps.md`.

**Two consumers**:

1. **Server pipeline** — `apps/web/src/server/services/generator/linkedin-post/`
   reads this spec, implements it in TypeScript, and is the production path.
2. **Codex local runs** — for manual artefact generation (Example-Section
   A4 screenshots, design previews, manual QA). The LLM follows this
   spec directly.

Both consumers MUST agree on the **deterministic mechanics** for
identical inputs: the same `--seed` selects the same color pair, the
same `topic` yields the same slug, and both write the same file set,
JSON shape, and formatting.

The **copy is intentionally non-deterministic** — headline, body, and
caption are LLM-generated and may (and should) differ on every run,
even for identical inputs and the same `--seed`. The seed fixes only
the color pair, never the wording. Re-running to get a fresh copy
variant is an expected, supported use (see §3). Snapshot tests must
therefore assert structure, schema-validity, and formatting — never
the exact copy wording.

When generating copy, apply the `copywriting` skill principles
(clear, direct, no hype, no buzzwords, no unsupported promises).

---

## 1. Inputs

| Field       | Type   | Max       | Required | Notes                                                                                         |
| ----------- | ------ | --------- | -------- | --------------------------------------------------------------------------------------------- |
| `topic`     | string | 280 chars | yes      | Form textarea — UI label DE „Worum geht's?" / EN „What's it about?"                           |
| `expertise` | string | 120 chars | yes      | Form text input — UI label DE „Deine Rolle oder Branche" / EN „Your role or industry"         |
| `tone`      | enum   | —         | yes      | Wire values `sachlich` \| `persönlich` \| `provokativ` (German strings, regardless of locale) |
| `locale`    | enum   | —         | yes      | `de` \| `en` — determines display labels + copy language                                      |

Wire values for `tone` match
`packages/common/src/contracts/generator/linkedin-post-generator-tone.ts`.
Do not normalize. Only display labels and generated copy switch with
`locale`.

**Fields explicitly NOT received by this skill**: `email`, `consent`,
`company` (honeypot). Those are handled by the upstream API route
(B7) before this skill is invoked.

**Server-side responsibilities (NOT done by this skill)**:

- **PII filtering** — visitor inputs are freetext and may contain
  personal data of third parties (names, client identifiers, contact
  details). The server (B7) MUST sanitize/redact PII before invoking
  the skill. The skill renders inputs verbatim into the PNG, mail
  attachment, and DB record (B5).
- **Prompt-injection mitigation** — `topic` and `expertise` flow into
  a downstream Claude API call (B3). The server MUST detect and
  neutralize injection patterns (e.g. „ignore previous instructions",
  „you are now …") before invoking the skill.
- **Anti-brand-collision filtering** — if visitor input contains
  `Invessiv`, `invessiv.com`, `#df9739`, or any other Invessiv-brand
  token, the server MUST reject or replace the input. The skill itself
  renders verbatim and has no defensive parsing.

**Validation** (fail fast, do not invent values):

- Any missing/empty field → stop and report which field.
- `topic` > 280 chars or `expertise` > 120 chars → contract bug,
  stop and report.
- `tone` not in enum → stop.
- `locale` not in {`de`, `en`} → stop.

---

## 2. Invocation Contract

This is a **contract, not a shipped binary** — there is no executable
named `linkedin-post-generator`. The flag interface below is
implemented twice: once by the server-side TypeScript wrapper
(Tasks B3+B4+B7) and once by the Codex run that parses the prompt. Both
implementations MUST honour the same flags and defaults.

The skill accepts inputs via **CLI flags** (server-side TypeScript
wrapper) or via **prompt-extracted values** (Codex). Both must support
the same flags:

```
linkedin-post-generator \
  --topic "<string>" \
  --expertise "<string>" \
  --tone <sachlich|persönlich|provokativ> \
  --locale <de|en> \
  [--out-dir <path>] \
  [--seed <0..9>] \
  [--dry-run]
```

| Flag        | Default                                        | Description                                                                    |
| ----------- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `--out-dir` | `apps/web/linkedin-post-output/<slug>_<date>/` | Where to write output files. Server passes a temp dir; Codex uses the default. |
| `--seed`    | unset → random                                 | Force color-pair index (0–9). Out-of-range → stop with error.                  |
| `--dry-run` | off                                            | Skip Playwright PNG render. HTML, caption, and JSON are still written.         |

For Codex invocations, the LLM parses the user prompt into these four
inputs and the optional flags, then executes the same logic.

---

## 3. Operation Modes

### Default (full render)

Writes all four files to the output folder:

- `post.html`
- `post.png` (1080x1080)
- `caption.txt`
- `result.json`

### `--dry-run`

Writes everything **except** `post.png`:

- `post.html` (still generated — fast, deterministic, useful for snapshot tests)
- `caption.txt`
- `result.json` (with `paths.pngPath = null`, `render.mode = "dry-run"`)

Used by B3 unit tests where Playwright should not be invoked.

### Re-generation semantics

Calling the skill twice with **identical inputs** produces **different
output**:

- The headline and body content are LLM-generated; the LLM is
  non-deterministic across calls.
- The color pair is random unless `--seed N` is passed; `--seed N`
  fixes only the color, not the content.

This is **intended behaviour**, not a defect: re-running produces a
fresh copy variant for the same input, which is desirable. The color
pair is the only stabilizable axis — a caller (e.g. a future UI color
picker) can pin it via `--seed N` while still getting new copy on each
run.

The caller decides whether a re-generation:

- creates a **new** lead row (B5) — recommended for analytics, allows
  per-attempt tracking;
- **replaces** the previous lead's generator artefacts (PNG, caption);
- counts against the rate-limit (B7) — recommended yes, otherwise the
  endpoint is abusable.

The skill itself is stateless and side-effect-free beyond writing the
four output files.

---

## 4. Output Location & File Conventions

```
<out-dir>/
├── post.html        (always)
├── post.png         (full mode only)
├── caption.txt      (always)
└── result.json      (always)
```

Default `<out-dir>` follows this scheme:

```
apps/web/linkedin-post-output/<topic-slug>_<YYYY-MM-DD_HH-mm>/
```

`apps/web/linkedin-post-output/` is git-ignored. Server passes its own
`--out-dir` (temp dir per request, discarded after upload).

### Topic-slug rules (Unicode-safe)

Step order matters — do not strip first:

1. **Lowercase** (Unicode-aware: `Ä` → `ä`).
2. **Transliterate diacritics for German content**:
   `ä` → `ae`, `ö` → `oe`, `ü` → `ue`, `ß` → `ss`,
   `é/è/ê/ë` → `e`, `á/à/â/ã/å` → `a`, `í/ì/î/ï` → `i`,
   `ó/ò/ô/õ` → `o`, `ú/ù/û` → `u`, `ñ` → `n`, `ç` → `c`.
3. **Replace spaces and underscores** with single hyphens.
4. **Strip** all remaining characters except `[a-z0-9-]`.
5. **Collapse** repeated hyphens, **trim** leading/trailing hyphens.
6. **Truncate** to max 40 characters, then re-trim a trailing hyphen.

Examples (apply each rule in order):

- `Preisgespräche mit Bestandskunden` → `preisgespraeche-mit-bestandskunden`
- `IT-Recruiting für Startups (2026!)` → `it-recruiting-fuer-startups-2026`
- `Über uns: 30€/h` → `ueber-uns-30-h` (rule 2 covers `Ü`; rule 4 strips `:`, `€`, `/`; rule 5 collapses)

`<YYYY-MM-DD_HH-mm>` uses **UTC**, zero-padded, to avoid timezone
mismatches between server and local runs.

### File encoding & line endings

- All text files written as **UTF-8 NFC**, **no BOM**, **LF line endings**.
- Trailing newline at end of file.
- String comparisons (tone wire values, locale enum, hashtag-`LinkedIn`-check)
  are **byte-exact against NFC** — do not rely on glyph-tolerant or
  casefold matching. The wire string `persönlich` is `U+0070 U+0065 U+0072
U+0073 U+00F6 U+006E U+006C U+0069 U+0063 U+0068`; treat any other
  Unicode representation as a contract violation.

---

## 5. Programmatic Output Contract — `result.json`

The full JSON Schema lives at `references/result-schema.json`. Validate
against it before declaring success.

### Field ownership — LLM vs. wrapper

`result.json` mixes two sources. Only some fields are produced by the
LLM copy call (Task B3); the rest are assembled by the wrapper (the
server pipeline or the Codex run). For the **API/copy use case the LLM
returns ONLY the fields below**, validated against
`references/content-schema.json` — never the wrapper-owned fields.

| `result.json` field            | Owner   | Notes                                    |
| ------------------------------ | ------- | ---------------------------------------- |
| `content.headlineHtml`         | **LLM** | `<em>` pairs only                        |
| `content.headlinePlain`        | **LLM** | tags stripped                            |
| `content.bodyVariant`          | **LLM** | bullets iff `sachlich`, else insight     |
| `content.insight`              | **LLM** | xor with bullets                         |
| `content.bullets`              | **LLM** | xor with insight                         |
| `caption.body`                 | **LLM** | paragraphs, `\n\n`-joined                |
| `caption.hashtags`             | **LLM** | no leading `#`, last = `LinkedIn`        |
| `content.expertiseDisplay`     | wrapper | `expertise` hard-capped at 60 chars      |
| `inputs.*`                     | wrapper | echoes the four inputs verbatim          |
| `colorPair.*`                  | wrapper | seed/random pick from `color-pairs.json` |
| `paths.*`, `render.*`          | wrapper | filesystem + render metadata             |
| `schemaVersion`, `generatedAt` | wrapper | constant / UTC timestamp                 |

The LLM structured-output contract is therefore a strict subset:
`{ headlineHtml, headlinePlain, bodyVariant, insight, bullets, caption }`.
B3 wires this object into the Claude API call's response schema; the
wrapper then merges it with the wrapper-owned fields and validates the
merged object against `references/result-schema.json`.

**Format requirements** (for deterministic snapshot tests):

- 2-space indentation
- Properties MUST appear in the order declared in the schema's
  `required` arrays. Snapshot tests check byte-for-byte equality;
  re-ordering breaks them even though both forms are JSON-valid.
- UTF-8 NFC, LF line endings, trailing newline
- Timestamps as ISO 8601 in UTC with **second precision, no
  milliseconds**: `YYYY-MM-DDTHH:MM:SSZ` (e.g. `2026-05-28T14:30:12Z`).
  Schema enforces this via regex.

**Top-level shape** (see schema for full details):

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-05-28T14:30:12Z",
  "inputs": {
    "topic": "...",
    "expertise": "...",
    "tone": "...",
    "locale": "..."
  },
  "colorPair": {
    "id": "navy-steel",
    "index": 0,
    "source": "random",
    "primary": "#0F1B2D",
    "secondary": "#1A3355",
    "text": "#E8F1FA",
    "accent": "#5BA3D9"
  },
  "content": {
    "headlineHtml": "...",
    "headlinePlain": "...",
    "bodyVariant": "insight",
    "insight": "...",
    "bullets": null,
    "expertiseDisplay": "..."
  },
  "caption": {
    "body": "paragraph one\n\nparagraph two\n\nclosing line",
    "hashtags": ["Vertrieb", "Preisgespräch", "B2B", "LinkedIn"]
  },
  "paths": {
    "htmlPath": "post.html",
    "pngPath": "post.png",
    "captionPath": "caption.txt"
  },
  "render": {
    "mode": "full",
    "viewportPx": {
      "width": 1080,
      "height": 1080
    },
    "deviceScaleFactor": 1
  }
}
```

**Key semantics**:

- `colorPair.source`: `"seeded"` if `--seed` was passed, `"random"` otherwise.
- `content.expertiseDisplay`: expertise input after **hard char-cap at 60**.
  Stored **unescaped** (HTML-escaping happens at template-substitution
  time). **No appended ellipsis** — visual cropping is done by
  `text-overflow: ellipsis` on `.post__expertise`.
- `content.headlinePlain`: headline with all HTML tags stripped. Used
  for `<title>` and OpenGraph `imageAlt`. **NOT used as mail subject** —
  the mail (B6) MUST use its own locale-aware static string like
  „Dein LinkedIn-Post ist bereit" / „Your LinkedIn post is ready".
  Using a provocative or personal headline as mail subject creates a
  semantic mismatch (visitor reads their own provocation as a subject
  line addressed to them).
- `caption.body`: caption.txt minus the hashtag line. Paragraphs
  separated by `\n\n` (LF only, schema enforces "no `\r`"). Closing
  line is its own paragraph at the end of `body`. **First paragraph
  MUST work as a standalone hook** — see section 9.
- `caption.hashtags`: array of strings **without** leading `#`. Caller
  prepends `#` when rendering. The last element MUST be `LinkedIn`
  (schema enforces _presence_ via `contains`; _position_ is enforced
  by the skill's quality gate).
- `paths`: relative to `<out-dir>`. `pngPath` is `null` in dry-run mode;
  `htmlPath` and `captionPath` stay non-null in both modes.

**Fields previously in the schema, now removed**:

- `content.toneChipLabel` — removed because the tone chip is no longer
  rendered into the visual post (would identify the post as tool-output).
  Callers that need a tone display label can derive it from
  `inputs.tone` + `inputs.locale` using the table in section 7.
- `content.topicDisplay` — removed because the topic kicker is no
  longer rendered into the visual post (visually duplicates the
  headline). The full topic remains available in `inputs.topic`.

---

## 6. Color System

10 predefined dark color pairs defined in
`references/color-pairs.json`. Pick one per run:

- If `--seed N` provided: use index `N`, set `colorPair.source = "seeded"`.
- Otherwise: uniform random integer in `[0, 9]`, set `colorPair.source = "random"`.

The post background uses a 135° linear gradient between `primary` and
`secondary`. `text` and `accent` are co-tuned for legibility against
that gradient — do not swap colors between pairs.

**Forbidden**:

- Inventing new pairs.
- Changing individual color channels.
- Using Invessiv's `#df9739` orange.

---

## 7. HTML Template

The template lives at `templates/post-template.html`. Substitution is
done by literal replacement of bracket-wrapped placeholders.

| Placeholder      | Value                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| `[LOCALE]`       | input `locale` (`de` or `en`)                                            |
| `[BG_START]`     | `pair.primary`                                                           |
| `[BG_END]`       | `pair.secondary`                                                         |
| `[TEXT]`         | `pair.text`                                                              |
| `[ACCENT]`       | `pair.accent`                                                            |
| `[EXPERTISE]`    | `content.expertiseDisplay`, HTML-escaped                                 |
| `[HEADLINE]`     | `content.headlineHtml` (already contains `<em>`; escape everything else) |
| `[BODY_CONTENT]` | insight `<p>` or bullets `<ul>` (see below)                              |

### Visual elements deliberately NOT present

- **No tone chip / tone badge in the visual.** Showing
  „Persönlich" / „Sachlich" / „Provokativ" on the post would identify
  it as tool-output and destroy the lead-magnet value (visitor will
  not post a labelled-as-AI image to their LinkedIn). Tone still
  drives content shape and copy register, and is preserved in
  `result.json.inputs.tone`.
- **No topic kicker line above the headline.** The topic drives the
  headline; rendering both creates visual redundancy and looks
  uneditorial. Topic remains in `result.json.inputs.topic` for
  analytics and lead persistence.
- **No CTA footer ("Weiterlesen ↓" or similar).** Square LinkedIn
  posts have no „next slide" affordance — such CTAs are semantically
  wrong for the format.
- **No watermark, no Invessiv brand mark.** The post is the visitor's;
  any Invessiv branding undermines the lead-magnet promise.

### Tone label mapping (for non-visual consumers)

Although the chip is gone from the visual, callers (mail template,
analytics) may need a locale-aware display label. Derive from
`inputs.tone` + `inputs.locale`:

| `tone` (wire) | `locale = "de"` | `locale = "en"` |
| ------------- | --------------- | --------------- |
| `sachlich`    | `Sachlich`      | `Factual`       |
| `persönlich`  | `Persönlich`    | `Personal`      |
| `provokativ`  | `Provokativ`    | `Provocative`   |

Matches `apps/web/src/i18n/dictionaries/linkedin-post/generator/{de,en}.json`.

### Body variants

- `bodyVariant === "insight"` → `<p class="post__insight">{insight}</p>`
- `bodyVariant === "bullets"` → `<ul class="post__bullets"><li>...</li>×3</ul>`

### HTML escaping

Escape user-provided strings before substitution: `&` → `&amp;`,
`<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `'` → `&#39;`.

Tag policy by field:

- **`headlineHtml`** — generated by this skill, MAY contain `<em>` /
  `</em>` pairs (and only those). Escape everything else; preserve the
  `<em>` pairs intact.
- **`insight`** — **plain text only**, rendered into `<p class="post__insight">`
  as-is after HTML-escaping. No tags allowed; LLM must not emit `<em>`,
  `<strong>`, `<br>`, etc.
- **`bullets[*]`** — **plain text only**, rendered into `<li>`. Same rule
  as `insight`.
- **`expertiseDisplay`** — user-provided, always fully escaped, no
  tag preservation.

### Font strategy

The template uses a system-font cascade with Inter as the preferred
first option. Renderings on macOS (system Inter or SF Pro), Windows
(Segoe UI), and Linux containers (Liberation Sans / DejaVu Sans) will
differ slightly. For production-quality output, the server image must
have `fonts-inter` or `fonts-noto-core` installed. Local-dev and
production renderings will not be byte-identical.

---

## 8. Content Generation by Tone & Locale

**Model (B3):** use a current top-tier Claude model with the API's
structured-output / tool-use mode bound to `references/content-schema.json`,
and a low-to-moderate temperature (≈ 0.5–0.7) — high enough for varied
copy across re-runs (see §3), low enough to keep the quality gate
(§11) passing reliably. Pin the exact model id in B3's server config,
not in this spec, so model upgrades do not require a skill edit.

All copy is in the **request locale**. No Invessiv branding ("Invessiv",
"invessiv.com", "Landingpage" as a service mention) in any visible
string. The post is the visitor's, not Invessiv's.

The `expertise` value steers vocabulary, examples, and assumed reader
expertise. The `topic` value is the post's subject.

**Six worked examples** (one per tone × locale combination) live under
`references/examples/`. Read those before generating new content.

### `sachlich` — fact-based, body = bullets

- **Headline**: thesis or sharp observation as a statement. No question.
  No exclamation mark. No trailing period. May use `<em>` on the
  single sharpest noun/verb.
- **3 bullets**: each ≤ 14 words. Factual, no opinion language
  (no "ich glaube" / "I think"). Cause → effect → consequence when applicable.

### `persönlich` — experience-based, body = insight paragraph

- **Headline**: hook from personal observation. First-person allowed.
  Conversational, not preachy. May use `<em>` on 1–2 emotionally weighted words.
- **Insight (≤ 2 sentences)**: extends headline with specific context,
  not advice. Concrete > abstract.

### `provokativ` — pointed opinion, body = insight paragraph

- **Headline**: clear counter-position as a statement. Respectful.
  May use `<em>` on the contested word.
- **Insight (≤ 2 sentences)**: sharpens the position, does not soften
  with "vielleicht" / "maybe". Names what is at stake.

### Cross-tone rules

| Rule               | DE forbidden                                                    | EN forbidden                                                    | Scope                                                                                                                                |
| ------------------ | --------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Hype               | garantiert, verdoppelt, automatisch, explodiert, viral, perfekt | guaranteed, double your, automatically, explode, viral, perfect | all fields                                                                                                                           |
| Buzz               | Geheimnis, Hack, Trick, Hacks, Tricks                           | secret, hack, trick, hacks, tricks                              | all fields                                                                                                                           |
| Filler             | in der heutigen Zeit, letztendlich, im Endeffekt                | at the end of the day, ultimately, in today's world             | all fields                                                                                                                           |
| Hyperbole pronouns | Alle, Niemand, Jeder, Keiner                                    | Everyone, Nobody, Anyone, No one                                | **headlines only** (always banned); allowed in captions ONLY when describing an observable pattern, never as a universal moral claim |

Hyperbole-pronoun examples to clarify the scope rule:

- ❌ Caption: „Niemand sollte Stundensätze ohne Anlass anheben." — universal claim, banned.
- ✅ Caption: „Niemand scrollt weg, weil eine Anzeige drei Absätze hat." — describes a concrete reader behaviour,
  allowed.

**Length limits** (apply to every tone):

- `headlinePlain`: 40–80 chars target, **hard cap 90**. Validation fails if exceeded.
- `insight`: 90–180 chars target, **hard cap 220**.
- Each bullet: 6–14 words.

**No emoji in the visual HTML post.** Caption may use one sparingly.

If inputs are clearly nonsense (e.g. `topic = "asdf"`), still produce
a plausible post — do not block. The form upstream is the primary spam
gate.

---

## 9. Caption File (`caption.txt`)

Format — paragraphs joined by `\n\n`, hashtag block at the end:

```
<paragraph 1 — STANDALONE HOOK, see rule below>

<paragraph 2 (optional)>

<closing line — invitation or open question, not a hard CTA>

#Tag1 #Tag2 #Tag3 #LinkedIn
```

**Construction from `result.json`**: join `caption.body` paragraphs
(already separated by `\n\n`), then append a blank line and the
hashtag line, which is `caption.hashtags.map(h => "#" + h).join(" ")`.

### First-paragraph hook rule (mobile-critical)

LinkedIn truncates captions after **~140 characters** on mobile
(„… mehr anzeigen" / „… see more"). On desktop the threshold is
similar (~210 chars). Everything after that is hidden behind a click.

The **first paragraph of `caption.body` MUST work as a standalone
hook**:

- ≤ 140 characters (hard rule; longer paragraphs get clipped mid-thought).
- Sets up tension, a concrete observation, or a counter-claim — not a
  greeting („Heute möchte ich euch …"), not a setup („Letzte Woche
  passierte mir …").
- Does NOT repeat the headline verbatim — readers see both.
- Does NOT end with a colon or ellipsis (clipping already creates that
  effect).

### Tone guidance for the caption

- `sachlich`: extend the bullets into 2 short paragraphs with numbers
  or concrete examples. No first person.
- `persönlich`: short anecdote or context. Direct second-person allowed.
- `provokativ`: deepens the position. Names the trade-off. Closes with
  a single open question.

### Hashtag rules

- 3–5 hashtags, derived from `topic` + `expertise`.
- **Locale-aware** wording (DE for `de`, EN for `en`).
- Stored in `result.json` **without** leading `#`. Caller prepends.
- Always end with `LinkedIn` (last array element).
- CamelCase or all-lowercase, never SCREAMING.
- Never include `Invessiv`. Never include `Webdesign`/`WebDesign`
  unless the topic is explicitly web design.

### Caption forbidden phrases

Same as headline lists, plus engagement-bait:

- DE: "Hand aufs Herz", "Mal ehrlich", "Niemand spricht darüber"
- EN: "Let me be honest", "Nobody talks about", "Hot take"

---

## 10. PNG Rendering (Playwright)

**Server pipeline only.** Codex runs that produce examples should
still render PNG, but server enforces the timeout below.

### Performance budget

B4's **8-second hard timeout** applies to the **HTML→PNG step only**.
Content generation (B3, Claude API call) has a separate budget and is
NOT covered by this skill's render timing.

End-to-end timing the visitor experiences (loading state in A5):

| Step                            | Owner     | Typical       | Note                             |
| ------------------------------- | --------- | ------------- | -------------------------------- |
| Form submit + B7 validation     | API route | ~200 ms       |                                  |
| Content generation (Claude API) | B3        | **2–5 s**     | depends on model + load          |
| HTML → PNG (this skill)         | B4        | **1.5–3.5 s** | warm browser pool                |
| Upload PNG to R2/S3             | B4        | ~500 ms       |                                  |
| DB persist + response           | B5/B7     | ~300 ms       |                                  |
| **Total visitor-perceived**     |           | **4–9 s**     | tight against 8 s if pessimistic |

The 8-second cap is therefore close to the upper end of normal — the
loading state in A5 must communicate progress, and the rate-limit
(B7) must prevent a thundering herd that would push the Claude API
into its own throttling.

To stay within the **per-step** budget (B4):

- **Reuse a warm browser pool** — do NOT launch Chromium per request.
- Wait for `document.fonts.ready` after navigation — without this the
  screenshot may capture fallback fonts.
- Do not load remote resources — the template uses only system fonts
  and inline styles.
- Abort the render at 6 s (2 s server margin for upload/persist in B7).

### Single-shot snippet (Codex / local dev)

```ts
import { chromium } from "playwright";
import path from "node:path";

const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(`file://${path.resolve(htmlPath)}`, {
    waitUntil: "load",
    timeout: 6000,
  });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: pngPath,
    clip: { x: 0, y: 0, width: 1080, height: 1080 },
    type: "png",
    omitBackground: false,
  });
} finally {
  await browser.close();
}
```

### Pool pattern (server pipeline B4)

```ts
// Module-level singleton browser, warmed at boot.
const browserPromise = chromium.launch();

export async function renderPng(htmlPath: string, pngPath: string) {
  const browser = await browserPromise;
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
    deviceScaleFactor: 1,
  });
  try {
    const page = await context.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: "load", timeout: 6000 });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: pngPath,
      clip: { x: 0, y: 0, width: 1080, height: 1080 },
      type: "png",
    });
  } finally {
    await context.close();
  }
}
```

On render timeout, the server returns `RENDER_TIMEOUT` (B4) and still
persists the lead (B5). This skill does not handle that — it is the
calling code's responsibility.

### Installation

```
pnpm --filter @invessiv/web add -D playwright
pnpm --filter @invessiv/web exec playwright install chromium
```

In dry-run mode skip this — Playwright is not required.

---

## 11. Quality Gate

Run all checks before declaring success.

### Always (both modes)

- [ ] Output folder exists at the resolved `<out-dir>`.
- [ ] `result.json` is valid against `references/result-schema.json`
      (run the schema validator — many checks below are also schema-enforced).
- [ ] `result.json.schemaVersion === 1`.
- [ ] `result.json.generatedAt` matches `YYYY-MM-DDTHH:MM:SSZ` (no ms).
- [ ] `result.json.inputs` echoes the four inputs verbatim (NFC byte-exact).
- [ ] `result.json.colorPair.index` ∈ `[0, 9]`.
- [ ] `result.json.colorPair.source === "seeded"` iff `--seed` was passed.
- [ ] `bodyVariant === "bullets"` iff `tone === "sachlich"`; else `"insight"`.
- [ ] Exactly one of `content.insight` / `content.bullets` is non-null.
- [ ] `content.headlinePlain.length <= 90` (hard cap).
- [ ] `content.headlinePlain` contains no `<` or `>`.
- [ ] `content.insight` (if non-null) contains no HTML tags at all.
- [ ] Each `content.bullets[i]` (if non-null) is plain text, **6–14 words**.
- [ ] `content.expertiseDisplay.length <= 60`.
- [ ] `caption.hashtags` has 3–5 items and the **last** item is `"LinkedIn"`.
- [ ] `caption.body` contains no `\r` characters.
- [ ] First paragraph of `caption.body` ≤ 140 chars (LinkedIn mobile-clip rule).
- [ ] First paragraph does NOT repeat `headlinePlain` verbatim.
- [ ] Property order in `result.json` matches the schema's `required` arrays.
- [ ] No `Invessiv` / `invessiv.com` / `#df9739` anywhere in `result.json`.
- [ ] No forbidden phrases (section 8) in `headlinePlain`, `insight`, `bullets`, or `caption.body`.
- [ ] `post.html` valid HTML — every `[PLACEHOLDER]` replaced.
- [ ] `<html lang="...">` matches input `locale`.
- [ ] `post.html` contains NO tone-chip element, NO topic kicker, NO CTA footer (see section 7 „Visual elements
      deliberately NOT present").
- [ ] `caption.txt` ends with the hashtag line and a trailing newline.

### Full mode only

- [ ] Folder contains `post.html`, `post.png`, `caption.txt`, `result.json`.
- [ ] `post.png` is exactly `1080 x 1080` px (verify with `file post.png`
      or equivalent).
- [ ] `result.json.render.mode === "full"`.
- [ ] `result.json.paths.pngPath` is non-null.

### Dry-run mode only

- [ ] Folder contains `post.html`, `caption.txt`, `result.json` (no `post.png`).
- [ ] `result.json.render.mode === "dry-run"`.
- [ ] `result.json.paths.pngPath === null`.

---

## 12. File Map

```
linkedin-post-generator/
├── SKILL.md                          ← this file (specification)
├── templates/
│   └── post-template.html            ← canonical HTML template
├── references/
│   ├── color-pairs.json              ← 10 predefined dark pairs
│   ├── content-schema.json           ← JSON Schema for the LLM copy call (B3)
│   ├── result-schema.json            ← JSON Schema for the full result.json
│   └── examples/
│       ├── sachlich-de.md
│       ├── persoenlich-de.md
│       ├── provokativ-de.md
│       ├── sachlich-en.md
│       ├── persoenlich-en.md
│       └── provokativ-en.md
└── agents/
    └── openai.yaml                   ← minimal metadata for hosted runs
```
