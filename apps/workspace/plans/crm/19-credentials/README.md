# Ordner 19 — Verschlüsselte Zugangsdaten

> **Status:** offen · **Abhängigkeiten:** 03, 04 · **Aufwand:** 3–4 Tage · **Reviewziel:** 50–80 Dateien

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`17-credentials-crypto.md`](./17-credentials-crypto.md) — Envelope-Format, AAD,
  Schlüsselring und Rotation.
- [`18-credentials-ui.md`](./18-credentials-ui.md) — Metadatenliste, Einzel-Reveal,
  Berechtigung und Audit.

Jedes Mitglied kann Standard-Logins sicher anlegen, ändern und entfernen und sie maskiert sehen.
Aufdecken und Kopieren dürfen nur der Owner und ausdrücklich freigegebene Mitglieder, immer für
genau einen Datensatz. Listen entschlüsseln nie; jeder sensible Zugriff ist im Security-Audit
nachvollziehbar. Es gibt keinerlei Portaloberfläche oder Portalendpunkt.

## Kryptografie und Schlüssel

- Additive Credential-Migration, Drizzle-Modell und öffentliche Metadaten-Contracts entstehen in
  diesem Ordner; verschlüsselte Persistenztypen bleiben serverseitig.
- AES-256-GCM je verschlüsseltem Feld mit zufälligem 96-Bit-Nonce und Auth-Tag.
- Versioniertes Envelope enthält Format-, Algorithmus- und Schlüsselversion, aber keinen Schlüssel.
- AAD bindet Kunde, Credential-ID, Feldname und Formatversion und verhindert Ciphertext-Verschiebung.
- Master-Key aus server-only Vercel-Env; Start/Write/Rekey schlägt bei fehlendem oder ungültigem Key
  geschlossen fehl.
- Schlüsselring kann alte Versionen entschlüsseln; Rotation schreibt über einen wiederholbaren,
  resumierbaren Job neue Envelopes. Offline-Key-Sicherung ist Produktiv-Gate.
- Adaptergrenze erlaubt späteren Secret-Manager ohne DTO- oder Tabellentausch.

## Rechte und UI

- Felder: Titel, Login-URL, Benutzername, Passwort und verschlüsselte Notiz.
- Liste liefert ausschließlich ID, Titel, URL, Änderungsdatum und Berechtigungsstatus.
- Reveal-Endpunkt entschlüsselt genau einen Eintrag und setzt `no-store`; kein Bulk-Export.
- UI maskiert Werte standardmäßig und entfernt Klartext nach 30 Sekunden beziehungsweise beim
  Fokusverlust aus dem React-State.
- Anzeigen, Kopieren, Ändern, Löschen und fehlgeschlagener Zugriff werden ohne Geheimwert auditiert.
- Kein TOTP, keine freien Geheimfelder und keine Portalteilung.

## Merge-Gate

- [ ] Manipulierter Ciphertext, Tag, AAD oder falscher Key schlägt sicher fehl.
- [ ] Listen-, Activity-, Error- und Log-Ausgaben enthalten keinen Klartext.
- [ ] User ohne effektive Permission `credentials.reveal` wird beim Aufdecken nach internem Standard abgewiesen,
      kann mit `credentials.write` aber weiterhin anlegen und bearbeiten.
- [ ] Owner- und Credential-Manager-Rolle gewähren `credentials.reveal`; Rollenentzug wirkt beim nächsten Request.
- [ ] Keyrotation ist nach Abbruch fortsetzbar und idempotent.
- [ ] Browser-Cache, Server-Cache und Analytics erhalten keine Reveal-Antwort.
- [ ] Fehlende Offline-Sicherung blockiert dokumentiert den ersten Produktiveintrag.

## Rollback

Credentials-Navigation deaktivieren. Verschlüsselte Zeilen bleiben lesbar, solange der alte
Schlüsselring erhalten bleibt; Schlüsselversionen werden niemals beim Code-Rollback gelöscht.
