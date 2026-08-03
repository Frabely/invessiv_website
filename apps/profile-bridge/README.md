# Invessiv Profile Bridge

Chrome-Erweiterung, die dem Workspace Profildaten aus deinem eingeloggten Browser liefert. Ohne sie funktioniert der
Pitch-Generator nur über das Paste-Feld.

## Bauen

```bash
pnpm --filter @invessiv/profile-bridge build
```

Ergebnis liegt in `apps/profile-bridge/dist/`.

## Installieren

1. `chrome://extensions` öffnen
2. **Entwicklermodus** oben rechts aktivieren
3. **Entpackte Erweiterung laden** → Ordner `apps/profile-bridge/dist` auswählen
4. Die angezeigte **ID** kopieren

## Im Workspace hinterlegen

Die kopierte ID in `.env.local` des Workspace eintragen:

```
NEXT_PUBLIC_PROFILE_BRIDGE_EXTENSION_ID=<die-id-aus-chrome>
```

Danach den Dev-Server neu starten. Der Modell-Punkt im Pitch-Panel zeigt, ob die Bridge erreichbar ist.

## Stabile Extension-ID

Entpackt geladene Erweiterungen bekommen ihre ID aus dem Ordnerpfad — verschiebst du den Ordner, ändert sich die ID und
du musst die Env-Variable anpassen. Willst du das vermeiden, hinterlege ein festes `key`-Feld in der
`manifest.json`:

1. Erweiterung einmal über **Erweiterung packen** in `chrome://extensions` packen → erzeugt eine `.pem`-Datei
2. Öffentlichen Schlüssel daraus als Base64 extrahieren
3. Als `"key": "<base64>"` in `manifest.json` eintragen und neu bauen

## Was die Erweiterung tut

| Plattform | Vorgehen                                                               | Tab nötig? |
| --------- | ---------------------------------------------------------------------- | ---------- |
| Instagram | Ruft die Profildaten mit deiner Session ab                             | nein       |
| LinkedIn  | Liest den bereits geöffneten Profil-Tab aus, ohne zusätzlichen Request | **ja**     |

Zwischen zwei Abrufen liegt eine Zwangspause mit zufälligem Anteil. Das ist Absicht: Der Instagram-Abruf nutzt die
private Web-API mit deiner echten Session. Bei klickgetriebenem Tempo ist das Risiko gering, ein Anfragen-Burst wäre es
nicht.

## Datenschutz

Die Erweiterung speichert nichts, sendet nichts an Dritte und kennt keine Zugangsdaten. Sie antwortet ausschließlich auf
Anfragen der in `manifest.json` unter `externally_connectable` eingetragenen Workspace-Adressen.
