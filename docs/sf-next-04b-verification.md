# SF-NEXT-04b – exportgeometribaslinje

Verifierad 2026-11-08. **SF-NEXT-04b: PASS för avgränsad automatisk verifiering.** SF-NEXT-04 som helhet är inte avslutat och releasebedömningen förblir `NOT_READY`.

## Scope

Chromium-baserat integrationstest `tests/export-geometry-parity-browser.mjs` skapar ett giltigt PPD 0.4-dokument med `blank`-layout och två namngivna rektanglar på fasta koordinater och olika färger. Tre oberoende observationer görs:

1. DOM-mått i editorcanvas normaliserade mot presentationens bredd och höjd jämförs med PPD-källans geometri (tolerans 1,5 procentenheter).
2. PPTX-OOXML kontrolleras mot förväntade `a:off`/`a:ext` för native redigerbara `p:sp`-former (tolerans 100 EMU).
3. PDF rasteriseras med `pdftoppm` till 1600×900. Pixlar i centrum av former kontrolleras mot deras färger, och ett tomt område kontrolleras mot ljus bakgrund (tolerans 12 RGB-steg).

## Verifieringsresultat

- Agent Workspace `ws_e19c168f-40fd-47be-b3d3-011a3ba0f36d`, Node.js 22, Playwright Chromium Headless Shell: `project_verify` **PASSED**.
- `npm ci --no-audit --no-fund`: PASS (208 paket).
- `npm test`: PASS; inkluderar `test:export-geometry` som rapporterade PASS för editor/PPD, PPTX/OOXML och PDF-pixlar.
- Produktionsbyggning (`npm run build`, inkluderar TypeScript): PASS (445 moduler).
- Två tidigare verifieringsförsök stoppades av ogiltig testfixtur (`PPD_040_INVALID: SCHEMA_040`); fixturen korrigerades till `blank`-layout och normaliserat outline-format. Ingen exportkod ändrades.

## Begränsningar

- Testet jämför fasta geometrivärden och sample-pixlar, inte pixelperfekt fullbildsdiff eller visuella textmått.
- Ingen verklig Office-/LibreOffice-visning av PPTX, Safari eller fysisk iPad har testats.
- Matchad Chromium Headless Shell användes; full Chromium-binär var inte tillgänglig i testmiljön.
- `npm run lint` har inte körts separat i detta steg.
- Övriga objekttyper, rotation och formatförluster kvarstår inom SF-NEXT-04 och releaseacceptans.
