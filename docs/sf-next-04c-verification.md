# SF-NEXT-04c – Exportparitet: rotation och inbäddad bild

**Status: PASS för automatiserad verifiering, 2026-11-08.** Delsteget är avslutat; SF-NEXT-04 som helhet samt releaseacceptansen är inte avslutade (`NOT_READY`).

## Omfattning

`tests/export-geometry-parity-browser.mjs` utökar SF-NEXT-04b med:

- En 30-graders roterad form. Jämför centrumkoordinater i redigerarens DOM med PPD-modellen (DOM-bounds inkluderar rotation). Kontrollerar native `p:sp` i PPTX med väntade `a:off`, `a:ext` och `a:xfrm rot` (grader × 60 000).
- En inbäddad, ogenomskinlig PNG med deterministisk färg. Kontrollerar geometri i redigeraren, native `p:pic`-koordinater, bildmedia i PPTX samt färg i PDF-rasteriseringen.
- De tidigare två rektanglarnas geometri- och PDF-färgkontroller är oförändrade.

Inga produktionsfiler ändrades. Textparitet har sedan tidigare ett separat test (`tests/text-export-parity-browser.mjs`). Tabell-/diagramparitet och avancerade effekter ingår inte i detta avgränsade delsteg.

## Verifiering

- Agent Workspace: `ws_ea63cddc-8812-4dff-b21c-930a04bbd52f` med Node 22 och Playwright Chromium Headless Shell. (Korrigerad slutleverans verifieras separat.)
- `npm ci`: PASS, 208 paket.
- `npm test`: PASS, inklusive samtliga befintliga tester och nyutökade `test:export-geometry`.
- `npm run build` inklusive TypeScript: PASS, 445 Vite-moduler.
- Den första levererade testversionen gav FAIL eftersom testets regex mot `ppt/media/` inte hittade mediafilerna, trots att de fanns i PPTX. Den korrigerade kontrollen följer nu bildens `r:embed`-id via `slide1.xml.rels`, kontrollerar att målets mediefil finns och validerar PNG/JPEG-signaturen. Diagnoskörningen med denna kontroll gav PASS. Felet låg i testet, inte i exporten.

## Kvarstående risker

- Riktig Microsoft PowerPoint-/Keynote-rendering har inte utförts, och ingen fysisk iPad/Safari har testats.
- Testning av PNG-färg i ett provställe ersätter inte pixelperfekt bildjämförelse.
- Full Chromium-binär matchande Playwright-versionen saknas i denna Agent Workspace-miljö; verifieringen använde Chromium Headless Shell. Detta måste kompletteras innan releaseacceptans.
- `npm run lint` kördes inte separat i Agent Workspace; TypeScript och bygg samt `npm test` passerade.
- Vite rapporterar befintlig varning för stor JavaScript-bundle.
