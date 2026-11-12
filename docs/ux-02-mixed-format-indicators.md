# UX-02: Tydlig status för blandad formatering

## Omfattning

När flera markerade objekt har olika färger anger både snabbformateringen (Start/Formatera) och egenskapspanelens gemensamma formatering uttryckligen **Blandade färger**. Om samtliga tillämpliga objekt saknar ett angivet färgvärde visas **Inget värde angivet** eller **Inte angivet**. Inaktiva fält har status **Inga ändringsbara objekt** där den redan visades.

Native färgväljare kräver en konkret färg även när markeringen är blandad. Färgprovet i den situationen är därför en interaktionskontroll, **inte** ett påstående om aktuell färg. Statusen presenteras visuellt och kopplas via `aria-describedby` till kontrollen. Val av färg ändrar fortfarande alla redigerbara valda objekt via befintlig modellfunktion; denna ändring påverkar inte hur data sparas.

## Tester

- Enhetstest av gemensam statuslogik för identiska, blandade, odefinierade och tomma värden.
- Playwright-test på desktop, iPad-porträtt och mobil: välj två objekt med olika fyllningsfärger och verifiera indikatorn i både Start och Formatera.
- Projektets ordinarie test- och bygggrindar.
