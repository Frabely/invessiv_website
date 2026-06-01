# Example — tone: provokativ, locale: en

## Inputs

- topic: "IT recruiting"
- expertise: "Tech recruiting for startups"
- tone: provokativ
- locale: en

## Generated content

- **headlinePlain:** `Your job ad is not too long — it is too generic`
- **headlineHtml:** `Your job ad is not too long — it is too <em>generic</em>`
- **kicker:** `Job Ads`
- **bodyVariant:** `insight`
- **insight:**
  `As long as every third posting lists the same stack, the same office dog, and the same benefits, length is not the bottleneck.`

## Caption

```
The "shorter job ads" debate distracts from the real point.

People do not scroll away because an ad has three paragraphs. They scroll away because three paragraphs say nothing.

What actually filters senior tech candidates: honest statements about tech debt, team reality, decision speed. That rarely makes it in, because it is harder to write than a benefits block.

What would change in your posting if you wrote honestly about the next six months?
```

Hashtags (JSON array, without leading `#`):
`["Recruiting", "TechRecruiting", "Startups", "JobAds", "LinkedIn"]`

## Notes

- `kicker` (`Job Ads`) is a thematic label derived from topic + content — NOT the `expertise` input (
  `Tech recruiting for startups`) and not a restatement of the headline.
- Counter-position framed as statement, not question.
- Avoids "Everyone", "Nobody", "Hot take".
- Closing question is open.
- First paragraph („The 'shorter job ads' debate distracts from the
  real point.") = 60 chars — sharp standalone hook before the
  mobile-clip.
- Tone is preserved in `result.json.inputs.tone` but not rendered onto
  the post visual.
