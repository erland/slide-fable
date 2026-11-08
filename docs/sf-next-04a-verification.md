# SF-NEXT-04a – verifiering 2026-11-08

## Omfattning

Semantiska diagram i PPTX: vänster-/uppåtriktade kanter kunde ge negativa linjedimensioner. `src/export/diagramLine.ts` normaliserar dimensionerna och behåller endpoint-riktning med flip-flaggor. `pptxWriter.ts` använder funktionen.

## Evidens

- Lokal körning: `node --experimental-strip-types --test tests/diagram-export.test.mjs` – PASS, 2 testfall (inklusive åtta riktningsvarianter).
- Agent Workspace: workspace `ws_78b61316-a74f-40f4-8e03-5800b9ca911f`, Node 22 + Playwright Chromium Headless Shell.
- `npm ci --no-audit --no-fund` – PASS, 208 paket.
- `npm test` – PASS, inklusive webbläsarflöden med desktop, iPad portrait och mobil viewport.
- Produktionsbygge under `project_verify` – PASS, Vite byggde 445 moduler.

## Avgränsningar

- Playwright rapporterade att full Chromium-binär inte var tillgänglig; körningen använde matchad headless shell. Verklig Safari/Apple-hårdvara testades inte.
- `npm run lint` har inte körts separat inom denna verifiering.
- De nya testen provar koordinatberäkning och flaggor, inte en referensbild eller verklig redigering i PowerPoint. Ytterligare Office-acceptans och bredare PDF/PPTX-paritet återstår.
- Releasebedömningen ändras inte: NOT_READY.
