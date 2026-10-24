# Markenbilder erzeugen

Die gemeinsame Logo-Quelle steht in `common/constants/brand/brand-assets.json` und wird von Website und Export-Skripten gelesen. Die SVG wird vollständig eingepasst, einschließlich des abgesetzten Punkts. `favicon-background.png` ist der von Moritz bereitgestellte Hintergrund.

Aus dem Repository-Root:

```sh
pnpm --filter @invessiv/web assets:brand
pnpm --filter @invessiv/web assets:og
pnpm --filter @invessiv/web exec vitest run scripts/brand-assets.test.mjs
```

Für die OG-Bilder muss die Web-App laufen (standardmäßig `http://localhost:3000`, alternativ `OG_PREVIEW_URL`). Der Export verwendet deren geladene Fonts, die Hero-Fotografie und vorhandene DE-/EN-Dictionaries. Das Layout steht in `scripts/og-images.css`.

Ausgaben: Favicons (PNG/ICO), Apple-/PWA-Icons, quadratische Markenlogos unter `public/brand`, OG-Bilder für Home, Referenzen und Services sowie quadratische Home-Vorschauen unter `public/og`. Bestehende Bild-URLs bleiben als aktualisierte Exporte erhalten.

Nach dem Export alle Sprachvarianten visuell prüfen. Die Asset-Tests prüfen Formate, ICO-Offsets und den sicheren Abstand des vollständigen Logos bei rundem Zuschnitt. Die quadratische Home-Vorschau ist über `WebPage.primaryImageOfPage` verknüpft; das Organisationslogo bleibt das reine Markenbild. Die tatsächliche Anzeige in Suchergebnissen entscheidet Google nach dem erneuten Crawling.
