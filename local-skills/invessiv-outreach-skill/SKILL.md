---
name: invessiv-outreach-skill
description: Use this skill when Moritz needs a cautious, individualized LinkedIn first message for Invessiv outreach in German, especially for websites, landing pages, or online presence leads. It covers cases with an existing website or no website and always produces a neutral subject line plus a copyable message.
---

# Invessiv Outreach Skill

Use this skill for first outreach messages for Moritz / Invessiv around websites, landing pages, and online presence.

## Goal

Create a message that:

- sounds natural, not copied
- stays cautious and Germany-appropriate
- does not pitch directly
- asks for permission first
- mentions at most one concrete improvement point
- feels individually written for the person, company, website, or profile
- avoids aggressive sales language

## Required Inputs

Use the available context in this order:

- display name
- company name
- website URL
- whether a website exists
- category label or similar industry hint
- notes or observations
- optional improvements
- owner or sender name
- channel
- include improvements flag
- additional context note

If important information is missing, infer conservatively from the available fields.

## Core Logic

### If a website exists

Focus on the first impression and the visitor path.

1. Pick one concrete but respectful point.
2. Do not list multiple issues.
3. Do not sell a solution.
4. Ask permission to explain what you mean.

Good angles:

- the first section is not clear enough
- the page shows too much at once
- the next step is not prominent enough
- the contact path feels a bit indirect
- multiple contact options may distract
- different audiences or services are not clearly separated
- the positioning could come through earlier

### If no website exists

Use a calm pilot-project angle.

- mention that no clear website was found
- do not ask for case studies
- frame it as a possible small, clear first website
- keep the tone low pressure
- ask if it is okay to briefly say what you have in mind

## Tone

Should sound:

- calm
- human
- direct
- restrained
- specific
- respectful

Should not sound:

- promotional
- preachy
- overly analytical
- generic
- like a sales script
- like a website audit

## Address Choice

Use `Sie` for:

- managing directors
- construction companies
- finance and insurance brokers
- formal profiles
- classic B2B
- uncertain cases

Use `du` for:

- younger or casual profiles
- coaches, creatives, photographers
- clearly personal LinkedIn profiles

When in doubt, use `Sie`.

## Subject Line Rules

The subject must be neutral and non-promotional.

Good subjects:

- Kurzer Gedanke zu Ihrer Website
- Kurze Beobachtung zu Ihrer Website
- Kurzer Gedanke zu [Firma]
- Kurz zu Ihrem Auftritt
- Kurzer Gedanke zu Ihrem Profil

Avoid:

- Mehr Anfragen über Ihre Website
- Website-Optimierung
- Landingpage für mehr Kunden
- Kostenloses Website-Audit
- Neue Kunden über Ihre Website

## Language Rules

- Do not mention numbers unless needed.
- Do not promise results too early.
- Mention only one concrete point.
- Do not copy the website headline verbatim.
- Keep the ending permission-based.

Standard endings:

- `Wäre es okay, wenn ich Ihnen kurz sage, was ich meine?`
- `Falls du magst, kann ich dir kurz sagen, was ich meine.`
- `Falls das grundsätzlich interessant für Sie ist, kann ich Ihnen gern kurz sagen, was ich mir bei Ihnen vorstellen könnte.`

## Signature

Usually:

```text
Viele Grüße
Moritz
```

More formal:

```text
Viele Grüße
Moritz von Invessiv
```

## Output Format

Always output:

1. Subject
2. Message as a copyable text block
3. Optional short alternative, only if useful

## Quality Check

Before output, verify:

1. Does it sound individual?
2. Is there a real connection to the person, company, website, or profile?
3. Is it not directly selling?
4. Is it asking for permission?
5. Is only one concrete point mentioned?
6. Does it avoid harsh criticism?
7. Is the subject neutral?
8. Is the address choice appropriate?
9. Are aggressive terms avoided?
10. Would it read naturally on LinkedIn without extra context?

## References

Use these files when you need concrete phrasing or examples:

- `references/templates.md`
- `references/examples.md`
- `references/improvement_phrases.md`
