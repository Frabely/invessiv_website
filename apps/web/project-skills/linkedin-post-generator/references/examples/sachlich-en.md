# Example — tone: sachlich, locale: en

## Inputs

- topic: "Pricing reviews with existing clients"
- expertise: "Strategy consulting for SMBs"
- tone: sachlich
- locale: en

## Generated content

- **headlinePlain:** `Prices do not stay flat — they are renegotiated every year`
- **headlineHtml:** `Prices do not stay flat — they are <em>renegotiated</em> every year`
- **kicker:** `Pricing Strategy`
- **bodyVariant:** `bullets`
- **bullets:**
  1. `Existing clients test the anchor you set years ago.`
  2. `Untouched contracts lose 4–9 % margin per renewal cycle.`
  3. `A documented reason for the change beats any improvised one.`

## Caption

```
Price reviews rarely fail because of the client. They fail because of weak preparation.

Three points that belong in every annual review template: documented service evolution, an external reference value, and a clear trigger for the adjustment. Without those, every review turns into a negotiation — with them, it turns into a notification.

Systemising the preparation pulls you out of reaction mode.
```

Hashtags (JSON array, without leading `#`):
`["PricingStrategy", "B2B", "SalesLeadership", "SMB", "LinkedIn"]`

## Notes

- `kicker` (`Pricing Strategy`) is a thematic label derived from topic + content — NOT the `expertise` input (
  `Strategy consulting for SMBs`) and not a restatement of the headline.
- `<em>` on the sharpest verb (`renegotiated`).
- No first person, no opinion language.
- Hashtags in English; ends with `#LinkedIn`.
- First paragraph („Price reviews rarely fail because of the client.
  They fail because of weak preparation.") = 86 chars — under the
  LinkedIn mobile-clip threshold; complete claim on its own.
- Tone is preserved in `result.json.inputs.tone` but not rendered onto
  the post visual (see SKILL.md §7 „Visual elements deliberately NOT
  present").
