# Todo

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
