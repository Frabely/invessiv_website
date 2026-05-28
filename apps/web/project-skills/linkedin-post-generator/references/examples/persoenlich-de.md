# Example — tone: persönlich, locale: de

## Inputs

- topic: "Erstgespräche mit potenziellen Kunden"
- expertise: "Coaching für Führungskräfte"
- tone: persönlich
- locale: de

## Generated content

- **headlinePlain:** `Mein bestes Erstgespräch dauerte 14 Minuten — und endete im Auftrag`
- **headlineHtml:** `Mein bestes Erstgespräch dauerte 14 Minuten — und endete im <em>Auftrag</em>`
- **bodyVariant:** `insight`
- **insight:**
  `Wir haben nicht über Methoden gesprochen, sondern über genau eine Situation, die er nicht mehr aushielt. Den Rest hat das Schweigen erledigt.`

## Caption

```
Ich glaubte lange: ein gutes Erstgespräch braucht Struktur und Methodik. Manchmal stimmt das. Meistens stimmt das Gegenteil.

Was wirklich überzeugt: dass ich aufhöre zu performen und stattdessen wirklich hinhöre, was gerade in dieser Person passiert. Die Wendung kommt fast immer aus einem Satz, den ich nicht selbst gesagt habe.

Vielleicht ist das beste Verkaufsgespräch eines, das sich nicht wie Verkauf anfühlt.
```

Hashtags (JSON array, without leading `#`):
`["Führung", "Coaching", "Vertrieb", "Erstgespräch", "LinkedIn"]`

## Notes

- First-person OK, conversational tone.
- Insight extends headline with concrete context, no advice.
- Caption avoids "in der heutigen Zeit", "letztendlich".
- Closing line is a reflection, not a CTA.
- First paragraph („Ich glaubte lange: ein gutes Erstgespräch braucht
  Struktur und Methodik. Manchmal stimmt das. Meistens stimmt das
  Gegenteil.") is 124 chars — under the LinkedIn mobile-clip
  threshold (~140); reads as a complete thought even if clipped.
