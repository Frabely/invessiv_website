# Ordner 10 — Portal-Einreichungen und Downloads

> **Merge-Einheit 10 von 16** · **Aufwand:** ~3 Tage · **Review-Umfang:** geschätzt ~90 Dateien
> **Setzt voraus:** Ordner 07 (Mail), 08 (Portal), 09 (Dateien)
> **Migrationen:** `0030_create_customer_submissions`

## Ziel

Der Kern des Portals: der Kunde lädt gebündelt Dateien hoch, schreibt sein Feedback, holt sich
freigegebene Ergebnisse — und du liest, beantwortest und setzt den Status. Damit ist der
Feedback-Kreislauf geschlossen.

## Tasks in Umsetzungsreihenfolge

| Task | Datei                          | Aufwand | Inhalt                                                           |
| ---- | ------------------------------ | ------- | ---------------------------------------------------------------- |
| 22   | `22-portal-upload-feedback.md` | L       | Einreichung (Dateien + Freitext), Download freigegebener Dateien |
| 23   | `23-submissions-im-crm.md`     | M       | Eingang mit Ungelesen-Zähler, Statusdialog, Antworttext          |

## Nach dem Merge live

Portalbereiche „Einreichen" und „Dateien", Schnellzugriffe im Dashboard; intern ein neuer Menüpunkt
„Eingang" mit Zähler, Einreichungs-Sektion im Kundendetail und Statusdialog.

## Warum diese Tasks zusammen

Task 22 ohne 23 hieße: Einreichungen liegen in der Datenbank, und der einzige Hinweis darauf ist
eine Mail — genau die Zettelwirtschaft, die das System abschaffen soll. Erst zusammen ist der Kreis
vollständig: einreichen, benachrichtigen, lesen, antworten, im Portal sehen.

## Merge-Gate

- [ ] Der Kunde lädt mehrere Dateien hoch und schreibt Feedback; beides überlebt das Neuladen
- [ ] Zwei parallele Anfragen erzeugen genau **einen** Entwurf
- [ ] Absenden setzt den Status und sperrt die Einreichung; Änderung danach ergibt 409
- [ ] 20.001 Zeichen werden abgelehnt, 20.000 akzeptiert; Umlaute und Emoji kommen unverändert zurück
- [ ] Portal-Limits greifen, auch wenn das interne Limit höher liegt; die 31. Datei wird abgelehnt
- [ ] Upload in eine fremde Einreichung ergibt 404, in eine abgesendete 409
- [ ] Mehr als fünf Einreichungen je Stunde ergeben 429 mit `Retry-After`
- [ ] Eine leere Einreichung lässt sich nicht absenden
- [ ] Fehlgeschlagener Mailversand verhindert das Absenden **nicht**
- [ ] **Eine nicht freigegebene Datei ist über keinen Portal-Endpunkt erreichbar**, auch nicht mit
      geratener Kennung (404, keine Existenzbestätigung)
- [ ] Das Portal-Archiv enthält ausschließlich freigegebene Dateien
- [ ] Ohne freigegebene Dateien erscheint der Bereich „Dateien" gar nicht
- [ ] Der Freitext wird **niemals** als HTML ausgeführt (`<script>`, Markdown erscheinen als Zeichenfolge)
- [ ] Öffnen setzt `read_at`, ändert aber den Status **nicht** automatisch
- [ ] Ungültige Statusübergänge (`draft` → `accepted`) sind nicht möglich
- [ ] Entwürfe erscheinen im Eingang nie; der Zähler verschwindet, wenn nichts offen ist
- [ ] Alle Texte in DE und EN; mobil, Dark und Light geprüft
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün

## Bewusst noch offen

Chat (Ordner 12). Einreichungen sind ab hier vollständig — Rückmeldung läuft über den Antworttext am
Statuswechsel.
