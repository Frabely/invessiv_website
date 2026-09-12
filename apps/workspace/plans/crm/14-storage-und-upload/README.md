# Ordner 14 — Storage-Adapter und sichere Upload-Pipeline

> **Status:** offen · **Abhängigkeiten:** 01, 10 · **Aufwand:** 4–5 Tage · **Reviewziel:** 70–100 Dateien

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`13-storage-adapter.md`](./13-storage-adapter.md) — Package-Contract und Vercel-Blob-Adapter.
- [`14-dateien-datenmodell-upload.md`](./14-dateien-datenmodell-upload.md) — Upload-Sessions,
  Dokumentprüfung, Inspectionstatus und Metadaten.

Der anbieterneutrale Storage-Adapter, Vercel-Blob-Implementierung, Upload-Sessions und serverseitige
Dokumentenprüfung sind produktiv deployt. Noch keine Datei-UI wird verlinkt; die Pipeline ist nur
über Integrationstests und einen standardmäßig deaktivierten Feature-Endpunkt erreichbar. Dadurch
bleibt `master` vollständig nutzbar, ohne einen halben Datei-Flow zu zeigen.

## Storage-Schnittstelle

- `createUpload`, `finalizeUpload`, `createDownloadUrl`, `head`, `copy`, `delete` und
  `deleteMany` als anbieterneutrales Service-Objekt.
- Providerkenntnis ausschließlich im Vercel-Blob-Adapter; Domänenhandler arbeiten mit stabilen
  Storage-Keys, nie mit öffentlichen Provider-URLs.
- Kurzlebige signierte URLs; Downloads erzwingen vor Signatur die DB-Autorisierung.
- Delete idempotent: fehlendes Objekt gilt als bereits erfolgreich entfernt.

## Upload-Sicherheit

- Additive Modelle für `files` und `upload_sessions` entstehen hier zunächst nur mit Kunden- und
  Projekt-Scope. Der Feedback-Scope wird in Ordner 16 kompatibel ergänzt.
- Formate `.pdf`, `.txt`, `.docx`, `.xlsx`, `.pptx`; keine Makro-, Binär-Office-, Bild-, HTML- oder
  Archivformate.
- Prüfung von Dateiname, Extension, normalisiertem MIME, Magic Bytes/Containerstruktur, Größe und
  SHA-256 nach Upload und vor Finalisierung.
- 50 MB je Datei, 20 Dateien/300 MB je Upload-Session; Limits vor und während Verarbeitung erzwingen.
- `inspection_status = unscanned` über No-op-`FileInspectionAdapter`; Interface und Statusmodell
  unterstützen späteren Scanner ohne Schemaumbau.
- Sessionstatus verhindert doppelte Finalisierung. Nicht finalisierte Objekte werden nach 24 Stunden
  über einen idempotenten Job bereinigt.
- Storage- und Metadatenfehler hinterlassen einen reparierbaren Zustand statt verwaister DB-Zeile.

## Merge-Gate

- [ ] Adapter-Contract-Tests laufen gegen In-Memory-Fake und Vercel-Adapter-Mock.
- [ ] Falsche Extension, MIME, Signatur, Office-Container und Größenüberschreitung werden abgelehnt.
- [ ] Doppelte Finalisierung erzeugt genau eine Datei.
- [ ] Abbruch vor/nach Blob-Upload ist bereinigbar.
- [ ] Secret/Token gelangt nicht in Clientbundle, Logs oder Activities.
- [ ] Kein sichtbarer Datei-Link oder Upload-CTA ist aktiviert.

## Rollback

Upload-Feature-Endpunkt deaktivieren und Cleanup-Job weiterlaufen lassen. Bereits finalisierte
Metadaten bleiben erhalten; kein Blob wird beim Deployment-Rollback gelöscht.
