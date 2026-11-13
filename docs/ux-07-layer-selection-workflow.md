# UX-07 – Lager och sammanhängande egenskapsflöde

## Baslinje och fynd
Granskning efter PR #165, se `slide-fable-funktions-och-ux-granskning-2026-11-12.md` i den föregående konversationen. En reproducerbar källkodsbrist identifierades: lagerlistan låg i komponentens gren för **ett markerat objekt**. När markeringen tömdes kunde användaren inte komma åt lagerlistan för att välja objekt igen. Samma sak inträffade vid markering av flera objekt.

## Ändring
- Flyttar samma lagerlista (inklusive kontextmeny och Shift-flermarkering) till en egen sektion på objektfliken, utanför de markeringberoende objektdetaljerna.
- Lagerlistan visas även utan markering och vid flera markerade objekt. Listan avser alltid aktuell bild.
- Befintligt lager-/selektionskommando återanvänds; ingen ny redigeringsväg eller dokumentmodell tillkommer.

## Regression och acceptanskriterier
`tests/panel-workflow-browser.mjs` utökas för desktop 1440×900, iPad-porträtt 820×1180 och mobil 390×844:
1. Redigera form- och helobjektstextformat i egenskapspanelen; samma värden visas på Start-fliken.
2. Avmarkera objektet: lagerlistan är fortsatt tillgänglig.
3. Välj objekt via lagerlistan och ändra ett numeriskt geometrivärde.
4. Byt bild och kontrollera att lagren hör till den nya bilden; återvänd och välj samma objekt igen.
5. Genomför redan befintligt bildimport-/ersättningsflöde och kontrollera att markering och panel är användbara.
6. Inga webbläsarundantag.

## Avgränsning
Ingen generell omdesign av paneler, nya tabellkommandon eller exporter i denna PR. Fysiskt Safari/iPad-test och visuell tillgänglighetsacceptans är fortfarande separata releasegrindar. Automatisk kandidat-CI krävs före merge, men är inte full releaseacceptans.
