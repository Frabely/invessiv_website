# Vor dem Merge: `feat/portal-ui-optimierung` – Mobil-Test Chat

Auf einem echten Gerät prüfen, mindestens **iPhone (Safari)**, wenn möglich zusätzlich Android (Chrome).
Portal-Dashboard mit einem Kontakt öffnen, der `portal.messages.read`, `portal.messages.write` und
`portal.files.write` hat.

## Chat öffnen

- [ ] Unten rechts erscheint ein runder Chat-Button mit Abstand zum Bildschirmrand, kein Balken am unteren Rand.
- [ ] **Ein Tipp auf den Button öffnet den Chat sofort**, ohne dass zuerst die Safari-Leiste oder die
      Wischgeste reagiert. Auch nach dem Scrollen im Dashboard noch einmal prüfen.
- [ ] Bei ungelesenen Nachrichten steht der Zähler am Button und ist vollständig sichtbar.
- [ ] Der geöffnete Chat liegt über dem Button, rechtsbündig, und ragt links nicht aus dem Bildschirm.
- [ ] Ein erneuter Tipp auf den Button schließt den Chat.
- [ ] Die letzte Dashboard-Karte wird vom Button nicht verdeckt, wenn ganz nach unten gescrollt ist.
- [ ] Unter dem Eingabefeld ist kein leerer Streifen mehr.
- [ ] Senden-Button und Eingabefeld sind gleich hoch; der Papierflieger wirkt mittig im Kreis.
- [ ] „Deine Nachricht …“ steht vertikal mittig im Feld.
- [ ] Ins Feld tippen: Die Tastatur öffnet sich, Eingabefeld und Senden-Button bleiben sichtbar und bedienbar.
- [ ] Eine Textnachricht senden: Sie erscheint im Verlauf, das Feld ist danach leer.
- [ ] Mehrzeiliger Text: Das Feld wächst mit und bleibt scrollbar; der Senden-Button bleibt unten bündig.

## Datei im Chat hochladen

- [ ] Auf 📎 („Datei anhängen“) tippen: Die Auswahl „Neue Datei hochladen“ / „Vorhandene Datei wählen“ öffnet sich.
- [ ] **Neue Datei hochladen:** Foto aus der Mediathek wählen. Der Upload läuft durch, die Datei erscheint als
      Anhang unter dem Eingabefeld.
- [ ] Neue Datei hochladen mit einem **direkt aufgenommenen Foto** (Kamera).
- [ ] Neue Datei hochladen mit einem **PDF aus „Dateien“**.
- [ ] **Vorhandene Datei wählen:** Liste lädt, eine Datei auswählen, „Anhängen“: Sie erscheint als Anhang.
- [ ] Anhang vor dem Senden wieder entfernen.
- [ ] Nachricht mit Anhang senden: Der Hinweis zur Freigabe erscheint, danach steht die Nachricht mit Anhang im
      Verlauf.
- [ ] Den gesendeten Anhang im Verlauf antippen: Öffnen oder Herunterladen funktioniert.
- [ ] Die hochgeladene Datei steht im Dateibereich unter „Von dir“.
- [ ] Grenze prüfen: Mehr Anhänge als erlaubt wählen, dann erscheint „Höchstens … Anhänge pro Nachricht.“
- [ ] Alle Dialoge (Hochladen, Auswahl, Freigabe) lassen sich mobil vollständig bedienen und schließen, nichts
      liegt hinter der Tastatur oder außerhalb des Bildschirms.

## Header und Menü

- [ ] Header zeigt mobil Logo, „Hallo {Name}“, Profil und Menü-Button; kein Theme- und kein Sprachschalter.
- [ ] Langer Vorname wird mit „…“ gekürzt und schiebt Profil und Menü nicht aus dem Bild.
- [ ] Im Menü stehen beschriftete Zeilen untereinander, ohne Trennlinie: „Projekt“, „Darstellung“, „Sprache“;
      Beschriftung links, Auswahl rechts.
- [ ] Kontakt mit nur **einem** Projekt: keine Zeile „Projekt“. Mit mehreren: Auswahl öffnet sich vollständig im
      Dialog, Wechsel lädt das gewählte Projekt.
- [ ] Kontakt mit **einer** Firma: kein Firmenname im Menü. Kontakt mit **mehreren** Firmen: Firmenwechsel im Menü
      vorhanden und funktioniert.
- [ ] Darstellung im Menü umschalten: Theme wechselt sofort.
- [ ] Sprache im Menü öffnen: Die Auswahl liegt vollständig im Dialog; Wechsel lädt die Seite in der anderen Sprache.
- [ ] Owner-Sicht: keine Begrüßung im Header, Owner-Hinweis im Menü.

## CRM-Cockpit (intern, mobil)

- [ ] Kundencockpit auf dem Handy öffnen: Chat ist ein runder Button unten rechts, kein Balken unter dem Inhalt.
- [ ] Antippen öffnet den Chat über dem Button; erneutes Antippen schließt ihn.
- [ ] Nachricht senden und eine Datei anhängen funktioniert wie im Portal.
- [ ] Ende der Kundenspalte wird nicht vom Button verdeckt.
- [ ] Desktop-Cockpit unverändert: Chat-Leiste rechts, ab 1400 px Panel fest daneben.

## Falls der Chat-Button auf iOS weiterhin nicht reagiert

Zweiter Verdacht: Der Dock ist `position: fixed`, liegt aber im scrollenden `.main` der `PortalShell`. Dann den
Dock aus diesem Scroll-Container herausziehen (eigener Umbau, nicht Teil dieses Branches).
