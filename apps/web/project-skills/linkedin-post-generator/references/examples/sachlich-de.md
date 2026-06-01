# Example — tone: sachlich, locale: de

## Inputs

- topic: "Preisgespräche mit Bestandskunden"
- expertise: "Strategieberatung für KMU"
- tone: sachlich
- locale: de

## Generated content

- **headlinePlain:** `Preise stagnieren nicht — sie werden jedes Jahr neu verhandelt`
- **headlineHtml:** `Preise stagnieren nicht — sie werden jedes Jahr neu <em>verhandelt</em>`
- **kicker:** `Preisverhandlung`
- **bodyVariant:** `bullets`
- **bullets:**
  1. `Bestandskunden testen den Anker, den du vor Jahren gesetzt hast.`
  2. `Wer Konditionen nicht aktiv steuert, verliert pro Vertrag 4–9 % Marge.`
  3. `Ein dokumentierter Preisanlass schlägt jede spontane Begründung.`

## Caption

```
Preisanpassungen scheitern selten am Kunden. Sie scheitern an fehlender Vorbereitung.

Drei Punkte, die in jeder Jahresgespräch-Vorlage stehen sollten: dokumentierte Leistungsentwicklung, externer Referenzwert, klarer Anlass für die Anpassung. Ohne diese drei Bausteine wird jede Anpassung zur Verhandlung — mit ihnen zur Mitteilung.

Wer die Vorbereitung systematisiert, kommt aus dem Reaktionsmodus heraus.
```

Hashtags (JSON array, without leading `#`):
`["Preisstrategie", "B2B", "Vertriebsführung", "KMU", "LinkedIn"]`

## Notes

- `kicker` (`Preisverhandlung`) is a thematic label derived from topic + content — NOT the `expertise` input (
  `Strategieberatung für KMU`) and not a restatement of the headline.
- Headline uses `<em>` on the sharpest verb (`verhandelt`).
- Three bullets, each ≤ 14 words, factual, no opinion language.
- Caption avoids first-person, names a concrete framework (3 Punkte).
- No forbidden phrases ("garantiert", "verdoppelt", etc.).
- First paragraph („Preisanpassungen scheitern selten am Kunden. Sie
  scheitern an fehlender Vorbereitung.") = 89 chars, works as
  standalone hook before LinkedIn's mobile-clip at ~140 chars.
