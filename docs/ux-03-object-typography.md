# UX-03: Objektomfattande textformat i egenskapspanelen

## Syfte
Användaren ska kunna justera textstorlek och textfärg för hela ett text- eller formobjekt utan att lämna egenskapspanelen. Befintlig direktredigering används för att formatera enskilda ord eller stycken.

## Beteende
- Reglagen återanvänder `formatValues` och `store.formatSelected` precis som Start-flikens formatering.
- Om flera textrader eller textkörningar har olika storlek visas "Blandade värden". För färger visas "Blandade färger".
- Färgkontrollens fallback är bara ett HTML-krav; status visar när värdena är blandade. Ingen ändring görs förrän användaren aktivt väljer en färg.
- Inställningarna påverkar hela objektets text, även rik text.
- Låsta objekt och skrivskyddat läge är inte redigerbara.

## Verifiering
`tests/panel-workflow-browser.mjs` verifierar objektstorlek, färg och synkronisering med Start-fliken för desktop, iPad-porträtt och mobil. Fullständig CI krävs före merge.
