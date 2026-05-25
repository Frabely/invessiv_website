# Todo

## Offen

### project-request-form.tsx hardcoded error codes ersetzen

In `src/components/marketing/home/sections/contact-section/project-request-form/project-request-form.tsx` werden noch
hartcodierte String-Fehlercodes verwendet. Das muss in einem separaten Schritt auf zentrale Error-Code-Konstanten und
ein sauberes Mapping umgestellt werden, aber nicht in diesem Branch.

### Zeitangabe Landingpage überarbeiten

**Aktuell:** `5–10 Tage` an allen Stellen (Hero, Trust, Process, FAQ, Pricing, Meta)

**Offene Frage:** Marktüblich ist „1–2 Wochen". Beides beschreibt denselben Zeitraum, aber die Wochen-Formulierung ist
ehrlicher gegenüber Kunden (Feedback-Latenz liegt fast immer beim Kunden, nicht beim Entwickler) und klingt
professioneller.

**Betroffene Dateien:**

- `src/i18n/dictionaries/landing/hero/{de,en}.json`
- `src/i18n/dictionaries/landing/trust/{de,en}.json`
- `src/i18n/dictionaries/landing/process/{de,en}.json`
- `src/i18n/dictionaries/landing/faq/{de,en}.json`
- `src/i18n/dictionaries/landing/pricing/{de,en}.json`
- `src/i18n/dictionaries/landing/meta/{de,en}.json`
- `.claude/skills/invessiv-landing/SKILL.md`
- Tests: `page.test.tsx`, `landing-structured-data.test.ts`

**Entscheidung steht aus:** Bleibt es bei `5–10 Tage` oder Wechsel auf `1–2 Wochen`?

---

### Zeiten in Home Services-Sektion überarbeiten

Sobald die Zeitangabe für die Landingpage entschieden ist, müssen die Delivery-Werte aller Service-Cards in
`src/i18n/dictionaries/marketing/home.ts` geprüft und ggf. angepasst werden:

| Service      | DE                      | EN                         |
| ------------ | ----------------------- | -------------------------- |
| Landingpage  | `3–10 Tage`             | `3–10 days`                |
| Website      | `10–21 Tage`            | `10–21 days`               |
| Upgrade      | `3–14 Tage`             | `3–14 days`                |
| Wartung      | `24–72h Antwortzeit`    | `24–72h response time`     |
| Prozess-Tool | `stark projektabhängig` | `highly project-dependent` |

Frage: Sind diese Zeitangaben realistisch und konsistent mit der Landing-Positionierung?
