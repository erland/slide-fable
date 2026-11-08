# SF-NEXT-05b – verifiering (2026-11-08)

## Omfattning

- `src/editor/ObjectEditors.tsx`: textfält för serienamn i `ChartEditor`, tillgängliga från både verktygsfältets diagramredigerare och egenskapspanelen. Befintlig `onChange`-väg och PPD `dataset.series[].name` återanvänds.
- `tests/data-ribbon-browser.mjs`: uppdaterad browserregression som ändrar kategori och serienamn, granskar dokumentets data och ångrar ändringarna på desktop, stående surfplatta och mobil.
- Ingen ändring av dokumentformat eller exportlogik.

## Verifierad körning

Agent Workspace med Node.js 22 och Playwright Chromium Headless Shell, på den kodrevision som paketeras i SF-NEXT-05b.

- `npm ci --no-audit --no-fund`: PASS (208 paket).
- `npm test`: PASS; inklusive `PASS data-ribbon desktop`, `PASS data-ribbon ipad-portrait` och `PASS data-ribbon mobile`, övriga regressions-/exporttester.
- `npm run build` som del av projektverifieringen: PASS (TypeScript + Vite, 445 transformerade moduler).
- Tidigare testförsök: två testordningsproblem efter undo (objektmarkeringen tas bort), rättade i browserregressionen. En Agent Workspace-körning nådde verktygets tidsgräns; omkörning PASS.

## Kvarstående begränsningar

- Chromium Headless Shell användes, inte verklig Safari på iPad.
- Releasegrindar och allmänna acceptanskrav är inte avslutade; projektet förblir `NOT_READY`.
- Stor produktionsbundle varnas av Vite men blockerar inte byggningen.
