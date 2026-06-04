# IM2-Projektordner

# ArtSee

## Team
- Anselm
- Jérôme

## Kurzbeschreibung
ArtSee ist ein interaktiver Kunstbrowser, der die Sammlung des Art Institute of Chicago zugänglich macht. Nutzer:innen können Werke nach Abteilung, Entstehungsjahr und Medium filtern sowie Lieblingswerke speichern. Die Website richtet sich an Kunstbegeisterte, Neugierige und alle, die Kunst auf unkomplizierte Weise entdecken möchten.

Die Website entstand im Rahmen eines persönlichen Projekts mit dem Ziel, Open-Art-APIs sinnvoll nutzbar zu machen und gleichzeitig eine ästhetisch ansprechende, einfach bedienbare Oberfläche zu gestalten.

## Learnings
Während der Umsetzung haben wir viel über den Umgang mit externen APIs und dynamisches Rendering gelernt. Besonders wichtig war das Filtern und Aufbereiten grosser Datensätze sowie die Performance-Optimierung beim Laden von Bildern. Ausserdem haben wir gelernt, wie man eine klare und intuitive UI gestaltet, die ohne grosse Erklärung funktioniert. Dennoch haben wir ein FAQ geschrieben.

## Schwierigkeiten
Die grössten Herausforderungen lagen im Umgang mit der ARTIC-API: Nicht alle Werke verfügen über vollständige Metadaten, was die Filterlogik komplex gemacht hat. Zudem war die Funktionalität des APIs eingeschränkt: Das Anzeigen der Anzahl Werke machte uns Problem. Und: In den API Filtern gab es gleich drei Kategorien für Moderne Kunst, die wir zusammenfassen mussten.

## Known Bugs
- Bei manchen Filterkombinationen werden wenige oder keine Ergebnisse angezeigt, obwohl passende Werke vorhanden wären.
- Die Favoritenfunktion speichert Werke nur lokal im Browser; nach dem Löschen des Caches gehen sie verloren.
- Je nach Browser ist die Hit-Box nicht immer exakt gleich über dem Logo platziert

## Ressourcen
- [Art Institute of Chicago API](https://api.artic.edu/docs/)
- [Claude](https://claude.ai/)
- Web-Vorlagen einzelner Figma-Komponenten
- IM-Dozenten


## Zusätzliches
Stay hydrated :D

PLZZ give us a 6+ :)))