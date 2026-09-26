# Ordner 15a — Medien-Assets und freier Portal-Upload

> **Status:** offen · **Abhängigkeiten:** 12b, 13, 14, 15 · **Aufwand:** 2–3 Tage · **Reviewziel:** 60–80 Dateien

> **Portal-Fundament (Neuzuschnitt 23.09.2026):** Seiten über `requirePortalActor(locale, customerId)`, Endpunkte über
> `withPortalActor`, jede Portal-Query über `portalAccessCondition`, jede Portal-Mutation über `portalCanOn` (alles
> aus Task 49). Eigene Portal-Permissions dieses Ordners, in `portal_standard` ergänzt: `portal.assets.write` (Assets hochladen, Medienlinks anlegen); Lesen über `portal.files.read` aus Ordner 15.
> Navigation: „Medien“ (`/portal/[customerId]/assets`) in `PORTAL_NAV_ITEMS` mit `requiredPermission`. Negativtests zusätzlich für fehlende
> Portal-Permission.

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`43-medien-assets-und-freier-upload.md`](./43-medien-assets-und-freier-upload.md) — Bild- und
  Videotypen, Limits je Art, Medienlink für große Dateien, rundenfreier Portal-Upload und
  Portalseite „Dateien & Assets".

Nach dem Merge kann der Kunde Logo, Bilder und kurze Videos selbst ins Portal laden, ohne dass dafür
eine Feedbackrunde verbraucht wird — und sieht seine eigenen Uploads dort wieder. Intern erscheinen
sie in der Dateiliste aus Ordner 15 mit Vorschau.

## Warum eigene Einheit, und warum vor Ordner 16

Der einzige Portal-Schreibpfad für Dateien war bis hierher das Absenden einer Feedbackrunde
(Task 22). Onboarding-Assets über diesen Weg würden Runden aus dem Kontingent verbrauchen und an ein
Projekt gebunden sein, dessen Runde nach dem Absenden unveränderlich ist. Der rundenfreie Pfad
entsteht deshalb **vorher** und einmal; Ordner 16 bindet die Upload-Session danach nur noch an die
Runde, statt einen zweiten Pfad zu bauen.

## Ausdrückliche Änderungen an früheren Entscheidungen

- **Dateitypen (Ordner 14):** Bilder und Videos waren ausgeschlossen. Sie sind jetzt erlaubt, mit
  Limits je Medienart und eigener Signaturprüfung. `.svg` bleibt ausgeschlossen.
- **Sichtbarkeit (Ordner 14):** „Neue Dateien sind intern" gilt weiter für interne Uploads. Eine vom
  Kunden selbst hochgeladene Datei ist für diesen Kunden sichtbar, ohne Freigabe — er hat sie
  geschickt. Die Portalabfrage prüft `visible_to_customer = true OR uploaded_by_side = 'customer'`.

## Regeln

- Limits liegen als `UPLOAD_LIMIT_BY_KIND` in `packages/common`, nicht als Zahl an drei Stellen.
- Jede Medienart hat Erweiterung, normalisierten MIME-Typ **und** Dateisignatur zu bestehen.
- Große Videos laufen über einen Medienlink statt über den Blob-Store; der Server ruft die URL nie ab.
- Der Portal-Upload erzeugt Dateien mit `category = 'asset'`, niemals mit Rundenbezug.
- Videos sind vom Sammel-ZIP ausgeschlossen; die Einzeldatei bleibt herunterladbar.

## Portal-Widget (aus Ordner 13)

Im Dashboard-Widget `files` (Registry `PORTAL_WIDGET_LAYOUT`, seit Ordner 15 mit echtem Reiter „Von uns“) stellt
dieser Ordner den Reiter **„Von Ihnen“** auf echte Daten um: eigene Uploads inklusive Medien, herunterladbar, ohne
Löschen oder Bearbeiten — eine Aktualisierung ist eine neue Datei. Keine eigene Dashboard-Karte außerhalb der
Registry.

## Merge-Gate

- [ ] Portal-Widget `files`, Reiter „Von Ihnen“, von Mock auf echte Daten umgestellt (Registry ohne Mock-Anteil;
      Permission `portal.files.read`); kein Lösch- oder Bearbeitungsweg im Widget.
- [ ] Signaturtest je erlaubtem Typ, inklusive Ablehnung einer als `.png` benannten HTML-Datei.
- [ ] `.svg` und makrofähige Formate werden abgelehnt, mit Test.
- [ ] Überschreiten des Limits der jeweiligen Art wird vor dem Upload abgelehnt, nicht danach.
- [ ] Portal-Upload ohne Runde erzeugt keine `feedback_rounds`-Zeile und verbraucht kein Kontingent.
- [ ] Cross-Customer-Negativtest: fremde `customerId` im Pfad antwortet 404 mit echter Session.
- [ ] Der Kunde sieht seine eigenen Uploads, aber keine internen Dateien ohne Freigabe.
- [ ] Medienlink akzeptiert nur `https`; der Server führt keinen Abruf der URL aus (SSRF).
- [ ] `next/image` rendert Vorschauen; HEIC fällt sichtbar auf eine Dateikachel zurück.
- [ ] Betriebsnotiz zum Blob-Speicherverbrauch ist für das Runbook in Ordner 20c vorbereitet.

## Rollback

`UPLOAD_LIMIT_BY_KIND` auf die Dokumenttypen zurücksetzen und `portal.assets.write` aus `portal_standard`
und eigenen Portalrollen nehmen; der Navigationseintrag verschwindet damit. Bereits hochgeladene Dateien bleiben lesbar; der Feedbackrunden-Pfad ist unberührt.
