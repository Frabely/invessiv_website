# AGENTS.md - Web Client Layer

## Geltungsbereich

Diese Regeln gelten für alle Dateien unter `apps/web/src/client/`.

## Zweck

Der `client`-Layer bündelt browserseitige Services, die von UI-Komponenten aufgerufen werden.

## Grundregeln

- Client-seitige Service-Module exportieren bevorzugt ein benanntes Service-Objekt mit klaren Methoden.
- Einzelne Submit-/Fetch-Funktionen werden intern gehalten und nicht zusätzlich als freie Exports veröffentlicht.
- Public Client APIs bleiben schlank: API-Aufrufer importieren das Service-Objekt und nutzen dessen Methoden.
- Service-Dateien enthalten die Fetch-/Submit-Logik und die Response-Validierung; Signaturen bleiben typisiert und nah
  am Shared DTO.
- Neue Client-Services gehören in fachlich passende Unterordner, nicht in Sammeldateien.
- Tests liegen direkt neben der Implementierung.
- Unnötige Pfad- oder Struktur-Duplikate im Client-Baum sind zu vermeiden und bei Umbauten zu bereinigen.
