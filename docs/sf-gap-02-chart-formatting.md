# SF-GAP-02 – grundläggande diagramformatering

## Omfattning
Valda stapel-, linje- och cirkeldiagram kan visa/dölja teckenförklaring och värdeetiketter. Stapel- och linjediagram kan dessutom få manuella minimum- och maximumvärden på Y-axeln.

Kontrollerna finns i den befintliga diagramredigeraren, både i ribbonens kontextverktyg och i objektets egenskapspanel. Ändringar använder samma `updateElement`-flöde som övriga objektegenskaper och kan ångras.

## Format och standardvärden
PPD 0.4.0:s befintliga, utökbara `legend`- och `yAxis`-objekt används utan schemabyte:

```json
{
  "legend": { "visible": false, "showValues": false },
  "yAxis": { "min": -5, "max": 120 }
}
```

Frånvaro av `legend.visible` eller `legend.showValues` innebär `true`, enligt tidigare beteende för staplar och cirkeldiagram. Avsaknad av axelgräns innebär automatisk skala. Y-axeln kan bara ändras för stapel- och linjediagram. Skalan får inte innehålla omkastade gränser när båda anges.

## Presentation och export
- Den interaktiva SVG-vyn använder inställningarna. Linjediagram visar också numeriska värdeetiketter när de är aktiverade.
- PPTX-export av vanliga, redigerbara diagram använder motsvarande `showLegend`, `showValue`, `valAxisMinVal` och `valAxisMaxVal`.
- PDF och fristående HTML är visuella/renderade exportflöden och följer därför SVG-presentationen.
- Mer avancerade dataetiketter, färger per serie, logaritmiska skalor, kombinationsdiagram och exakta Microsoft Office-layoutregler ingår inte i detta steg.

## Verifiering
- `tests/data-ribbon-browser.mjs`: sätt och återställ legend, värdeetiketter och axelgränser i desktop, iPad-porträtt och mobil; kontrollera PPD och diagramgeometri.
- `tests/export-data-parity-browser.mjs`: exportera native PPTX och läs OOXML för valda legend-, värde- och axelinställningar.
- Full kandidatverifiering via GitHub Actions krävs på PR-HEAD innan steget är klart.

Projektets övergripande releaseberedskap är fortsatt `NOT_READY` tills separata manuella releasegrindar är uppfyllda.
