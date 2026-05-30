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

### LinkedIn-Post-Generator: Qualitätsgrenze ohne persönliche Daten

Der Generator liefert technisch saubere, strukturell hochwertige Posts — aber die Copy bleibt **zwangsläufig generisch
**, weil er keine persönlichen Informationen kennt:

- Kein eigenes Branding, keine Logofarben, keine visuelle Identität
- Keine persönliche Stimme, keine konkreten Erfahrungen, keine Referenzen
- Keine Unternehmensfotos, Teambilder oder eigene Bild-Assets
- Keine spezifischen Zahlen, Case Studies oder Kundenzitate

Das ist kein Fehler — es ist die bewusste Grenze des öffentlichen Lead-Magnet-Tools.

**Der Hinweis sollte irgendwo auf der Seite sichtbar sein** (z. B. unterhalb der Beispiele oder im Success-State), damit
Besucher verstehen, warum das Ergebnis noch nicht „nach ihnen" klingt — und was dagegen helfen würde.

**Mögliche Erweiterung: Custom Workflow per Skill**

Ein dedizierter `custom-linkedin-post`-Skill (analog zu `invessiv-social-post`) könnte genau diese Lücke schließen:

- Persönliche Angaben (Stimme, Expertise-Tiefe, Referenzen) als Skill-Kontext
- Eigenes Logo oder Bild-URL als Input — **Bild-Input wäre kein technisches Problem**: der Skill nimmt eine URL oder
  einen lokalen Pfad entgegen und bettet das Bild direkt in das HTML-Template ein; Playwright rendert es pixelgenau in
  den PNG-Export
- Individuelle Farbpalette statt der 10 generischen Paare
- Persistente Persona-Daten (Name, Rolle, Profilbild) für konsistente Posts über mehrere Runs hinweg

Der Skill würde nicht im öffentlichen Generator laufen, sondern als interner Workflow (wie `invessiv-social-post`) —
Besucher, die das Ergebnis sehen, erkennen den Qualitätsunterschied und haben einen konkreten nächsten Schritt: eigenen
Workflow anfragen.

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
