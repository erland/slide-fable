# SF-NEXT-04d – tabell- och diagramparitet

Nytt Chromium-baserat integrationstest `tests/export-data-parity-browser.mjs`, inkluderat i `npm test` via `test:export-data`.

Provet skapar en giltig PPD 0.4-presentation med en tabell med tre rader och ett stapeldiagram med två kategorier. Det jämför canvas- och PPTX-geometri, kontrollerar att tabell och diagram exporteras som redigerbara OOXML-objekt och att kategorier och värden återfinns i diagrammets XML. En rasteriserad PDF kontrolleras för synligt innehåll i båda förväntade områdena.

Begränsningar: inget Office-renderingstest, ingen pixel-för-pixel-paritet, ingen automatisk verifiering av faktisk Excel-redigering av diagramdataserier, och inget Safari-test på fysisk iPad. PDF-kontrollen upptäcker synlighets- och placeringsfel men inte alla färg-, typsnitts- eller layoutskillnader.

Verifiering 2026-11-08 (Agent Workspace, Node 22 / Playwright):
- `npm ci` PASS (208 beroenden).
- `npm test` PASS inklusive ny `test:export-data` och tidigare browserregressioner.
- `npm run build` PASS (TypeScript och Vite, 445 moduler).
- PNG av PDF skapad med `pdftoppm`, och kontroll av bildpunkter inom tabellens och diagrammets områden PASS.
- Chromium Headless Shell användes; full Chromium/WebKit/Safari och riktig PowerPoint-rendering återstår för releasegranskning.
- Ingen applikationskod ändrad; endast test, package-script och dokumentation.

Resultat: SF-NEXT-04d är godkänt enligt automatiserad verifiering, men projektets releasebedömning är fortsatt `NOT_READY`.
