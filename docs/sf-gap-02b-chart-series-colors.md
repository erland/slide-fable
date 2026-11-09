# SF-GAP-02B – dataseriefärger och Y-axelrubrik

## Leverans
Diagramredigeraren kan nu ändra färgen för varje dataserie i stapel- och linjediagram samt ange rubrik för Y-axeln.

- Den valda serien identifieras med `dataset.series[].id`, inte dess listposition.
- `legend.seriesColors` är en ny valfri, ID-nycklad karta med hex-färger. Den placeras i det redan utökningsbara `legend`-fältet i PPD 0.4.0.
- `yAxis.title` är en valfri sträng på högst 100 tecken från redigerarkontrollen.
- Avsaknad av eget färgval innebär befintlig standardpalett. Ogiltiga färger faller tillbaka till standardpaletten vid rendering.
- Cirkeldiagram behåller befintliga kategorifärger (flera kategorier på en serie). Färger per cirkelsektor ingår inte i detta steg.
- SVG-redigeraren och visuella exporter använder det valda färg-/axelrubriksunderlaget. Native PPTX använder `chartColors` samt `showValAxisTitle/valAxisTitle`.

## PPD-exempel

```json
{
  "legend": {
    "visible": true,
    "showValues": true,
    "seriesColors": {
      "series-123": "#1256ab"
    }
  },
  "yAxis": { "title": "Timmar", "min": 0, "max": 100 }
}
```

## Verifiering
1. `tests/data-ribbon-browser.mjs`: desktop, stående iPad och mobil; ändra serie-färg/Y-axelrubrik, jämför PPD och SVG, flytta serie och verifiera att färgen följer serien.
2. `tests/export-data-parity-browser.mjs`: verifiera valda värden i native redigerbar PPTX-OOXML samtidigt som tidigare tabell/diagram-paritet bevaras.
3. Full kandidatverifiering i GitHub Actions: lint, Node/TypeScript, Python/PPD, Chromium, PDF/PPTX/export, PWA.

## Avgränsningar
Färg per cirkelsektor, avancerad axelgradering, talformat, gridlinjer och andra diagramtyper ingår inte. Den övergripande releasebedömningen för projektet påverkas inte av detta steg; tidigare manuella releasegrindar kvarstår.
