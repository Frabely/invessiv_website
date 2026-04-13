# Todo

## Stack Rework

- Next.js + Prisma als saubere Zielarchitektur fuer Datenzugriff und DB-Modelle umsetzen.
- Dabei die Datenmodelle klar von UI und Route-Logik trennen und den bestehenden Code schrittweise migrieren.

## I18n Dictionary Rework

- `src/i18n/dictionaries/marketing/home.ts` und ggf. weitere verbleibende Dictionary-`*.ts`-Dateien auf das JSON-Schema umstellen.
- Zielstruktur pro Dictionary: `<sinnvollerName>.de.json` und `<sinnvollerName>.en.json`.
- Vor einer Umstellung prüfen, welche Loader-, Typisierungs- und Importpfade in `src/i18n/get-dictionary.ts` sowie den aufrufenden Modulen angepasst werden muessen.
- Dieses Thema jetzt nicht im laufenden Contact-Form-Task umsetzen, sondern als separates Rework behandeln.

## Src-Struktur Rework

- Die Ordnerstruktur in `src` insgesamt neu schneiden.
- In `src/app` soll unter dem aktuellen `[locale]` ein Ordner `(marketing)` eingefuehrt werden.
- Alles, was aktuell direkt unter `src/app/[locale]` fuer den Marketing-Bereich liegt, soll nach `src/app/[locale]/(marketing)` verschoben werden.
- Der `api`-Ordner in `src/app` bleibt bestehen.
- Zusaetzlich soll es in `src/app` einen separaten Bereich wie `management` oder `dashboard` geben.
- Neben `src/app` soll es einen gemeinsamen Ordner wie `src/lib` oder `src/shared` geben.
- In diesen gemeinsamen Ordner soll sinnvoll strukturiert alles verschoben werden, was aktuell neben `src/app` liegt, mit Ausnahme von `server`.
- Die Struktur von Sections klarer trennen: eine Section bleibt ein eigener Feature-Ordner, z. B. fuer `contact-section` mit section-spezifischer Logik und Zusammensetzung.
- Zusaetzlich soll es innerhalb solcher Bereiche einen klaren Unterordner fuer Komponenten geben, wenn mehrere Teilkomponenten zu einer Section gehoeren.
- Dabei zwischen section-spezifischen Teilkomponenten und wirklich wiederverwendbaren Elementen unterscheiden.
- Wirklich wiederverwendbare Elemente wie Feldhuellen, Actions, Shells oder Status-Bausteine sollen nicht implizit im Section-Ordner versteckt bleiben, sondern in einen passenden gemeinsamen Komponentenbereich verschoben oder dort neu geschnitten werden.
- Dieses Thema jetzt nicht im laufenden Task umsetzen, sondern als separates Struktur-Rework behandeln.

## AGENTS.md Struktur-Rework

- Die `AGENTS.md`-Dateien im Projekt sauber auf Root, `src/app`, `src/components`, `src/i18n` und `src/server` verteilen.
- Die Inhalte in den Bereichsdateien auf die jeweils passende Domäne verschlanken und doppelte Regeln aus den Unterordnern entfernen.
- Die Root-`AGENTS.md` als globale Übersicht und Verweis auf die Bereichsdateien behalten.
- Dieses Thema nicht implizit nebenbei weiter umbauen, sondern als eigenes Struktur-Rework behandeln.

## Contact Form Follow-Up

- Die Form-Bezeichnungen im Code sind an mindestens einer Stelle vertauscht: Form 2 soll fachlich die E-Mail-Form sein, Form 3 der Call-Pfad. Das spaeter gezielt konsistent bereinigen, aber nicht im laufenden Schritt mit umbauen.
- Pruefen, ob `CONTACT_REQUEST_KINDS` statt als `as const`-Array kuenftig besser als `const`-Objekt mit abgeleiteter Liste modelliert werden sollte, um lesbarere Zugriffe wie `ContactRequestKind.ProjectRequest` zu ermoeglichen, ohne ein echtes TypeScript-`enum` einzufuehren.
- `src/server/services/contact/*` als verbleibende technische Hilfen schrittweise in eine saubere Contact-Domaenenstruktur ueberfuehren.
- `src/features/contact/*` den Altbestand vollstaendig in `client/` und `shared/` schneiden.
- Die Contact-Testlandschaft schichtbezogen statt komponentenuebergreifend neu ordnen.
- Die bestehende Contact-Ordnerstruktur zwischen `features/contact`, `server/services/contact` und der Route langfristig bereinigen.
- Alte gemischte Services weiter in klarere Handler- und Infrastruktur-Grenzen zerlegen, falls nach dem aktuellen Upgrade noch noetig.
- Den verbleibenden Contact-Altbestand konsistent in die Zielstruktur ueberfuehren, aber als separates Nachfolge-Rework behandeln.
- `src/server/services/contact/contact-lead-metadata.ts` als komplette Datei spaeter gezielt reviewen, besonders die Typen, Prepared-Write-Strukturen und die Trennung zwischen fachlichem Modell und DB-Insert-Vorbereitung.
- In `src/server/services/contact/contact-lead-metadata.ts` und angrenzenden Persistenzpfaden `createdAt` und `updatedAt` spaeter von ISO-Strings auf `Date` umstellen; aktuell funktioniert der Insert so, aber intern waeren `Date`-Werte semantisch und typseitig sauberer.

## CRM DB felder für Stueer

- vier Felder einbauen: Land, B2B/B2C, Firma ja/nein, USt-IdNr.

## Hero visual Verbesserung

- im hero visual die maus als "Lampe" anzeigen und beim visual shatten einfügen abhängig von der maus position
