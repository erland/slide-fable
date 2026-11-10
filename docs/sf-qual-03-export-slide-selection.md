# SF-QUAL-03 – säker bildselektion och flerbildsexport

## Fynd

Exportens urvalsregel låg tidigare direkt i `exportPresentation` och accepterade alla okända `scope`-värden som om de betydde ”aktuell bild”. PDF, PPTX och bildexport använde denna regel, men de befintliga exportregressionerna fokuserade främst på enskilda bilder och objekttyper. Ett misstag i urvalet kunde därmed ge fel antal sidor, eller i värsta fall oavsiktligt inkludera en dold bild.

## Genomfört

- `selectExportSlides` samlar regeln i en funktion med två giltiga urval: `all` (alla synliga bilder, i ordning) och `current` (endast vald synlig bild).
- Dold, obefintlig eller tom urvalsmängd avvisas med begripligt fel. Okänt urval avvisas uttryckligen i stället för att tyst välja en annan bild.
- Exportens befintliga PDF-/PPTX-/PNG-/JPG-flöde använder samma urvalsregel; inga formatändringar.
- Node-regression testar ordning, dolt innehåll, vald bild och ogiltiga urval.
- Playwright-regressionen bygger en presentation med tre bilder, varav en dold. Den exporterar riktiga PDF-/PPTX-filer för `all` respektive `current` och kontrollerar PDF-sidantal respektive antal PPTX-bilddelar.

## Verifiering och begränsningar

Körning sker i den vanliga CI-kedjan via `tests/*.test.mjs` och `test:export-data`. En grön PR-körning bekräftar urval och grundläggande filstruktur, **inte** att presentationen ser likadan ut efter öppning i faktisk Microsoft PowerPoint eller en oberoende PDF-läsare.

Kvar inom SF-QUAL-03:s bredare kvalitetsspår: riktiga Office Mac/Windows-prov, fristående PDF-läsare, användarscenarier för formatinställningar och visuell jämförelse av flerbildspresentationer. Projektets releasegrindar lämnas oförändrade.
