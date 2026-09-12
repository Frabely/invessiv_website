# Ordner 16 — Mail senden

> **Merge-Einheit 16 von 16** · **Aufwand:** ~1 Tag · **Review-Umfang:** geschätzt ~25 Dateien
> **Setzt voraus:** Ordner 07 (Mail), 12 (Chat), 14 (Verlauf)
> **Migrationen:** keine
> **Priorität:** **niedrigste im Plan.** Kann ohne Folgen entfallen

## Ziel

Wenn eine echte Mail nötig ist, geht sie aus der Kundenakte oder aus dem Portal raus und wird
protokolliert. Der Chat bleibt ausdrücklich der übliche Weg — das hier ist die Ausnahme.

## Tasks in Umsetzungsreihenfolge

| Task | Datei               | Aufwand | Inhalt                                                      |
| ---- | ------------------- | ------- | ----------------------------------------------------------- |
| 31   | `31-mail-senden.md` | M       | Beide Richtungen, Limits, Protokoll in Timeline und Verlauf |

## Nach dem Merge live

Aktion „Mail senden" im Kontextmenü der Kundenakte und im Portal. Ohne konfigurierten Mail-Provider
erscheint sie gar nicht — es gibt also keinen toten Button.

## Warum zuletzt und warum optional

Kein anderer Ordner baut darauf auf. Der Ordner existiert, damit der Weg offen ist, falls sich der
Chat im Alltag als nicht ausreichend erweist. Erweist er sich als ausreichend, wird dieser Ordner
schlicht nie umgesetzt — der Plan endet dann sauber nach Ordner 15.

Der Mail-**Eingang** (BCC-Postfach, Zuordnung zum Kunden) ist ausdrücklich **nicht** Teil davon und
steht in `00-entscheidungen.md` unter „bewusst zurückgestellt".

## Merge-Gate

- [ ] Aus der Kundenakte lässt sich eine Mail an einen Ansprechpartner senden
- [ ] Der Kunde kann aus dem Portal senden, **ohne einen Empfänger zu wählen** — die Adresse kommt
      aus der Konfiguration, ein mitgeschicktes Empfängerfeld wird ignoriert
- [ ] Eine Adresse, die keinem Kontakt des Kunden gehört, wird ohne ausdrückliche Bestätigung abgelehnt
- [ ] Jede gesendete Mail erscheint in der Timeline **und** als Systemnachricht im Verlauf
- [ ] Eine Antwort landet beim jeweils anderen (`Reply-To` korrekt gesetzt)
- [ ] **Der Inhalt wird nie als HTML ausgeführt** (`<script>` erscheint als Zeichenfolge)
- [ ] Limits greifen in beide Richtungen (429 mit `Retry-After`)
- [ ] Fehlgeschlagener Versand verliert den Text nicht und erzeugt **keinen** Protokolleintrag
- [ ] Die Portal-Route erreicht keinen fremden Kunden, auch nicht mit geratener Kennung
- [ ] Die Aktion ist optisch klar der Zweitweg, nicht die naheliegende Wahl
- [ ] Ohne Mail-Konfiguration ist die Aktion nicht vorhanden und die App unverändert lauffähig
- [ ] Alle Texte in DE und EN; mobil, Dark und Light geprüft
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün

## Bewusst noch offen

Nichts. Mit diesem Ordner ist der Plan vollständig.
