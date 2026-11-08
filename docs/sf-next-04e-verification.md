# SF-NEXT-04e – avancerad tabell- och diagramparitet

Datum: 2026-11-08. Källa: SF-NEXT-04d verifierade projekt-ZIP.

## Leverans

- `tests/export-advanced-data-browser.mjs`: PPD 0.4-fixtur med en färgsatt tabell (sammanslagen rubrikcell), linjediagram och cirkeldiagram.
- `package.json`: `test:export-advanced` och inkludering i `npm test`. Det nya provet körs först för snabb felidentifiering; befintlig testsekvens bibehålls efteråt.
- Ingen ändring av applikationskod eller exportlogik; det verifierade stödet fanns redan men var inte skyddat av dessa regressionstester.

## Automatiserade kontroller

- Geometri för tre objekt stäms av mellan PPD och redigerarens canvas.
- PPTX innehåller tre native `graphicFrame` med korrekta koordinater.
- Tabellen behåller text, cellbakgrund och `gridSpan=2` som redigerbar OOXML-tabell.
- Linje- och cirkeldiagrammen behåller diagramtyp, dataserier, kategorier och numeriska värden i redigerbar OOXML.
- Rasteriserad PDF kontrolleras för synligt innehåll inom respektive objekts förväntade område.

## Verifieringsresultat

Agent Workspace Node 22 / Playwright Chromium Headless Shell:

- `npm ci` PASS (208 paket)
- `npm test` PASS inklusive `test:export-advanced` och tidigare regressioner
- `npm run build` PASS (TypeScript, Vite, PWA-serviceworker; 445 moduler)
- `node --check tests/export-advanced-data-browser.mjs` PASS

Bortom provets täckning: visuell eller redigeringsmässig acceptans i faktisk Microsoft PowerPoint, på fysisk iPad/Safari samt generell formatparitet för alla tabellstilar och diagramvariationer. PDF-kontrollen mäter förekomst och placering, inte full pixelidentitet.

## Bedömning

SF-NEXT-04e har PASS för den avgränsade automatiska kontrollen. Projektets övergripande releasebedömning kvarstår `NOT_READY`. Nästa prioritering är att återvända till arbetsflödes- och UX-brister samt releasegrindar, inte att oavbrutet utöka exporttesterna.
