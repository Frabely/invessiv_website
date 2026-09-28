# Vercel- und Environment-Setup — Dateien (Ordner 14)

Manuelle Schritte für den Owner. Erledigen **vor dem Merge von 14.2** (erste Nutzung in Preview); Production spätestens
vor dem Merge von 14.3. Stand der Vercel-Doku: September 2026 (Private Blob GA, Signed URLs, `@vercel/blob` >= 2.3).

## 1. Zwei private Blob-Stores anlegen

Getrennte Stores, damit Preview- und lokale Testdaten nie neben echten Kundendateien liegen.

| Store                    | Zugriff     | Verbunden mit Environments |
| ------------------------ | ----------- | -------------------------- |
| `invessiv-files-prod`    | **Private** | Production                 |
| `invessiv-files-preview` | **Private** | Preview, Development       |

Dashboard: Workspace-Projekt → **Storage** → **Create Storage** → **Blob** → **Continue** → Zugriff **Private** →
Name vergeben → Environments wie oben auswählen → **Create**.

Alternativ per CLI: `vercel blob create-store invessiv-files-prod --access private` (danach im Dashboard mit dem
Projekt und den Environments verbinden).

> **Wichtig:** Zugriff muss **Private** sein. Ein öffentlicher Store liefert Dateien über dauerhaft gültige URLs aus
> und widerspricht dem Sicherheitsmodell dieses Ordners.

## 2. Environment-Variablen prüfen

Durch das Verbinden setzt Vercel automatisch:

| Variable                  | Herkunft                           | Zweck                                                        |
| ------------------------- | ---------------------------------- | ------------------------------------------------------------ |
| `BLOB_STORE_ID`           | automatisch beim Verbinden         | Store-Kennung für die OIDC-Authentifizierung                 |
| `VERCEL_OIDC_TOKEN`       | automatisch (System-Variable)      | Kurzlebige, rotierende Server-Authentifizierung              |
| `BLOB_READ_WRITE_TOKEN`   | optional, nur wenn ausgewählt      | Langlebiger Fallback; für neue OIDC-Verbindungen nicht nötig |
| `BLOB_WEBHOOK_PUBLIC_KEY` | automatisch durch Store-Verbindung | Aktuell ungenutzt; es ist kein Upload-Callback konfiguriert  |

Manuell im Projekt setzen (alle drei Environments):

| Variable           | Wert          | Hinweis                                                                                         |
| ------------------ | ------------- | ----------------------------------------------------------------------------------------------- |
| `STORAGE_PROVIDER` | `vercel-blob` | Wählt den Adapter. Ohne Wert startet die App, Dateifunktionen melden einen Konfigurationsfehler |

Keine dieser Variablen trägt `NEXT_PUBLIC_`; alle sind ausschließlich serverseitig.

## 3. Lokale Entwicklung

1. `vercel env pull` im Workspace-Projekt ausführen (liest Development → Preview-Store und den lokalen
   `VERCEL_OIDC_TOKEN`).
2. In `apps/workspace/.env.local` prüfen, dass `BLOB_STORE_ID`, `VERCEL_OIDC_TOKEN` und `STORAGE_PROVIDER`
   gesetzt sind. Fehlen die Blob-Variablen, enthält die Store-Verbindung kein **Development** — im Store unter
   **Projects** → ⋯ → **Update Project Connection** ergänzen. Falls lokale OIDC-Authentifizierung nicht verfügbar
   ist, kann `BLOB_READ_WRITE_TOKEN` als lokaler Fallback aus den Store-Einstellungen in `.env.local` gesetzt werden;
   dafür den langlebigen Token nicht zusätzlich für Vercel-Deployments aktivieren.
3. Lokale Uploads landen im Preview-Store. Upload-Callbacks von Vercel erreichen `localhost` nicht; das ist
   unkritisch, weil die Finalisierung über den eigenen `complete`-Aufruf läuft.
4. `.env*.local` bleibt lokal und wird nie als Quelle für committed Werte genutzt.

## 4. Kosten und Überwachung (Pro)

- **Spend Management:** Settings → Billing → Spend Management → Benachrichtigung ab z. B. 20 $ Monatsverbrauch
  aktivieren (optional Webhook).
- **Blob-Observability:** Dashboard → Observability → Blob. Monatliche Sichtprüfung von Speichergröße, Operationen und
  Data Transfer (wird ins Runbook aus Ordner 20c übernommen).
- Richtwerte: Speicher ca. 0,023 $/GB-Monat, Blob Data Transfer ca. 0,05 $/GB (regional). Downloads laufen über
  presigned URLs direkt vom Blob-CDN, nicht über unsere Function; ZIP-Downloads laufen über die Function und kosten
  zusätzlich Fast Data Transfer.
- Das Durchstöbern des Stores im Dashboard zählt als Advanced Operations — sparsam nutzen.

## 5. Abnahme nach dem ersten Deployment (Preview, später Production)

- [ ] Intern eine PDF-, eine Bild- und eine Videodatei hochladen; alle drei erscheinen in der Liste.
- [ ] Vorschau und Download funktionieren; die Download-URL ist nach 5 Minuten ungültig.
- [ ] Im Store-Browser liegen die Objekte unter `customers/<customerId>/<fileId>/…`.
- [ ] Ein direkter Aufruf der Objekt-URL ohne Signatur liefert 403.
- [ ] Eine als `.png` umbenannte HTML-Datei wird abgelehnt und hinterlässt kein Objekt.
- [ ] Preview-Uploads erscheinen **nicht** im Production-Store.

## 6. Rollback

- Portalzugriff abschalten: `portal.files.read`/`portal.files.write` aus `portal_standard` und eigenen Portalrollen
  nehmen.
- Dateifunktionen vollständig abschalten: `STORAGE_PROVIDER` entfernen → Endpunkte melden einen
  Konfigurationsfehler, vorhandene Metadaten und Objekte bleiben erhalten.
- Stores werden bei einem Rollback **nie** gelöscht.
