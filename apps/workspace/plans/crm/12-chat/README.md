# Ordner 12 — Chat

> **Merge-Einheit 12 von 16** · **Aufwand:** ~3 Tage · **Review-Umfang:** geschätzt ~100 Dateien
> **Setzt voraus:** Ordner 06 (Projekte), 07 (Mail), 08 (Portal), 10 (Einreichungen)
> **Migrationen:** `0032_create_conversations`, `0033_add_notification_columns`

## Ziel

Eine durchlaufende Unterhaltung je Kunde, auf beiden Seiten mit demselben Verlauf. Statt
Echtzeit-Infrastruktur gibt es gebündelte Mail-Benachrichtigungen.

## Tasks in Umsetzungsreihenfolge

| Task | Datei                           | Aufwand | Inhalt                                                            |
| ---- | ------------------------------- | ------- | ----------------------------------------------------------------- |
| 24   | `24-nachrichten-datenmodell.md` | M       | `conversations`, `messages`, Lesestand, Systemnachrichten         |
| 25   | `25-chat-im-crm.md`             | M       | Geteilte Verlaufskomponente, Sektion, Sammelbereich, Zähler       |
| 26   | `26-chat-im-portal.md`          | M       | Kundenseite, Bündelung der Benachrichtigungen in beide Richtungen |

## Nach dem Merge live

Nachrichten-Sektion im Kundendetail, neuer Menüpunkt „Nachrichten" mit Zähler, Portalbereich
„Nachrichten", Systemnachrichten bei Phasenwechseln, Benachrichtigungsmails in beide Richtungen.

## Warum diese Tasks zusammen

Zwingend, nicht bequem:

- 24 allein sind Endpunkte ohne Oberfläche
- 25 ohne 26 bedeutet, dass **der Kunde die Nachrichten nicht sehen kann** — man schreibt ins Leere.
  Task 25 muss das im leeren Zustand ausdrücklich dazusagen, was ein klares Zeichen dafür ist, dass
  der Zustand nicht in den `master` gehört

Erst mit 26 ist der Kanal in beide Richtungen offen und die Benachrichtigung schließt die Lücke, die
das Fehlen von Echtzeit-Updates hinterlässt.

## Merge-Gate

- [ ] Je Kunde entsteht höchstens **eine** Unterhaltung; zwei parallele Aufrufe erzeugen genau eine
- [ ] Eigene Nachrichten zählen nie als ungelesen; Systemnachrichten ebenfalls nicht
- [ ] Blättern über den Cursor überspringt und wiederholt keine Nachricht
- [ ] Bearbeiten nur eigene Nachricht und nur binnen 15 Minuten (danach 409); fremde ergibt 404
- [ ] Systemnachrichten lassen sich weder bearbeiten noch löschen
- [ ] Nach dem Löschen ist der Inhalt in der Datenbank **nicht mehr vorhanden**
- [ ] Lesestand wird nie zurückgesetzt (ein älterer Zeitstempel überschreibt keinen neueren)
- [ ] **Nachrichteninhalte werden nie als HTML ausgeführt** (`<img onerror=…>` erscheint als Text)
- [ ] Ein ungesendeter Entwurf überlebt das Neuladen; blockierter `localStorage` wirft nicht
- [ ] Drei Nachrichten binnen fünf Minuten lösen genau **eine** Mail aus; nach 16 Minuten wieder eine
- [ ] Ein gerade aktiver Kunde bekommt keine Mail; abgeschaltete Benachrichtigung verhindert Versand
- [ ] Mailfehler verhindert das Speichern der Nachricht nicht
- [ ] Mehr als 30 Nachrichten je Stunde ergeben 429 mit `Retry-After`
- [ ] Ein Portalnutzer erreicht keine fremde Unterhaltung (404)
- [ ] Ein Fehler beim Anhängen einer Systemnachricht bricht den Phasenwechsel **nicht** ab
- [ ] Auf Mobil verdeckt die Bildschirmtastatur das Eingabefeld nicht
- [ ] Keine N+1-Abfrage für Vorschau und Zähler; ein Abfragefehler lässt die Seite intakt
- [ ] Alle Texte in DE und EN; mobil, Dark und Light geprüft
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün

## Bewusst noch offen

Anhänge im Chat sind bewusst nicht enthalten — Dateien laufen über den Upload-Bereich. Der leere
Zustand verweist darauf. Der Mail-Eingang bleibt außerhalb des Plans (siehe `00-entscheidungen.md`).
