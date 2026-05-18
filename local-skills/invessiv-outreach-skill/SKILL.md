---
name: invessiv-outreach-skill
description:
  Use this skill when Moritz needs a cautious, individualized German first outreach message for Invessiv about websites, landing pages, or online presence leads. The skill decides whether to use website-based improvements: if a website exists, it may use up to two concrete hints; if no website exists, it should stay generic-but-individual and mention pilot projects at fair entry pricing. Produce a neutral subject line and a plain-text copyable message without markdown code fences; on LinkedIn, address the person with a first-name greeting like "Hallo Susann" instead of Herr/Frau.
---

# Invessiv Outreach Skill

Use this skill for first outreach messages for Moritz / Invessiv around websites, landing pages, and online presence.

## Goal

Create a message that:

- sounds natural, not copied
- stays cautious and Germany-appropriate
- does not pitch directly
- asks for permission first
- mentions at most two concrete, relevant improvement hints
- feels individually written for the person, industry, website, or profile
- avoids aggressive sales language

## Required Inputs

Use the available context in this order:

- name
- company
- role
- website
- LinkedIn context
- industry
- observed details or improvement points
- preferred tone: relaxed or formal
- preferred address: `Sie`, `du`, or decide yourself
- whether a website exists
- whether the person connected first

If important information is missing, infer conservatively from context.

## Core Logic

### If a website exists

Use the website as the main source.

1. Look at the website briefly.
2. Pick up to two concrete but respectful hints.
3. Do not list more than two hints.
4. Do not sell a solution.
5. Ask permission to explain what you mean.
6. Make it clear that the note is based on the website, not on a generic guess.

Good angles:

- the first section is not clear enough
- the page shows too much at once
- the next step is not prominent enough
- the contact path feels a bit indirect
- multiple contact options may distract
- different audiences or services are not clearly separated
- the positioning could come through earlier

### If no website exists

Use a deliberately more generic but still individual message.

- do not pretend to have reviewed a website
- do not invent concrete website feedback
- lean on role, industry, profile, or LinkedIn context
- mention that you currently offer pilot projects at fair entry pricing
- keep the tone calm and low pressure
- ask if it is okay to briefly say what you have in mind

### If the person connected first

Start more personally:

- thank them for the invitation
- mention that you took the connection as a reason to look at the site or profile
- then add one real observation

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

## Address and Salutation

- On LinkedIn, use a first-name greeting if available: `Hallo Susann,`
- Do not use `Herr/Frau` in LinkedIn salutations.
- If the first name is missing, use `Hallo,` or another neutral greeting.
- Keep the body in `Sie` or `du` according to the profile fit and context.

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
- if the person connected first
- clearly personal LinkedIn profiles

When in doubt, use `Sie` in the body and a neutral first-name LinkedIn greeting.

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

## Output Contract

The output must follow this structure exactly:

```text
Subject: <neutral subject line>

Message:
<plain text body>
```

Rules for the output contract:

- Output exactly one `Subject:` line.
- Output exactly one `Message:` line.
- Put a blank line between subject and message.
- The body must start immediately on the next line after `Message:`.
- Do not put the subject again anywhere in the body.
- Do not output any other labels, bullets, headings, or commentary.
- Do not wrap either block in markdown code fences.
- Do not use `Message: ```...````, ever.
- Do not use quotes around the subject or body.
- Do not place the body on the same line as `Message:`.
- The first non-empty line of the body should be the greeting.

## Language Rules

- Do not mention numbers unless needed.
- Do not promise results too early.
- Mention no more than two concrete hints.
- Do not copy the website headline verbatim.
- Keep the ending permission-based.
- Do not wrap the message in markdown code fences.
- Output the message as plain text so it can be copied directly.
- Never emit `Message: ```...````, even if the content itself contains line breaks.
- If no website exists, mention pilot projects at fair entry pricing in a calm, non-pushy way.
- If a subject is present in the source material, keep it only in the subject line and not in the body.

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

## Quality Check

Before output, verify:

1. Does it sound individual?
2. Is there a real connection to the person, company, website, or profile?
3. Is it not directly selling?
4. Is it asking for permission?
5. Is no more than two concrete hints mentioned?
6. Does it avoid harsh criticism?
7. Is the subject neutral?
8. Is the address choice appropriate?
9. Are aggressive terms avoided?
10. Would it read naturally on LinkedIn without extra context?
11. Is the message plain text, without triple backticks?
12. On LinkedIn, does the salutation use a first name instead of Herr/Frau?
13. If a website exists, is the message based on that website?
14. If no website exists, is the message generic-but-individual and does it mention pilot projects at fair entry
    pricing?
15. Is the subject only in the subject line and not repeated in the body?
16. Is the body starting directly after `Message:` with a greeting, not another label?

## References

Use these files when you need concrete phrasing or examples:

- `references/templates.md`
- `references/examples.md`
- `references/improvement_phrases.md`
