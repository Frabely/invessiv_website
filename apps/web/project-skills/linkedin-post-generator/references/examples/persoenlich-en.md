# Example — tone: persönlich, locale: en

## Inputs

- topic: "First meetings with potential clients"
- expertise: "Executive coaching"
- tone: persönlich
- locale: en

## Generated content

- **headlinePlain:** `My best first meeting lasted 14 minutes — and closed the deal`
- **headlineHtml:** `My best first meeting lasted 14 minutes — and closed the <em>deal</em>`
- **kicker:** `Trust in Sales`
- **bodyVariant:** `insight`
- **insight:**
  `We did not talk about methods, but about one specific situation he could no longer tolerate. The silence after did the rest.`

## Caption

```
For years I believed a good first meeting needs structure and method. Most often the opposite is true.

What actually convinces: when I stop performing and really listen to what is happening with this person right now. The turning point almost always comes from a sentence I did not say myself.

Maybe the best sales conversation is one that does not feel like sales.
```

Hashtags (JSON array, without leading `#`):
`["Leadership", "Coaching", "Sales", "FirstMeeting", "LinkedIn"]`

## Notes

- `kicker` (`Trust in Sales`) is a thematic label derived from topic + content — NOT the `expertise` input (
  `Executive coaching`) and not a restatement of the headline.
- First-person used, conversational.
- Avoids "at the end of the day", "ultimately".
- Closing line is reflective, not a CTA.
- First paragraph („For years I believed a good first meeting needs
  structure and method. Most often the opposite is true.") = 103 chars
  — under the LinkedIn mobile-clip threshold.
- Tone is preserved in `result.json.inputs.tone` but not rendered onto
  the post visual.
