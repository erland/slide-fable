# SF-NEXT-03 – implementation och verifieringsstatus (2026-11-08)

## Ändring

- `src/ui/EditorApp.tsx`: introducerar `openProperties(section)` som atomärt väljer egenskapsflik, öppnar egenskapspanelen och navigerar till den. Animationskommandot i Visa använder samma väg som ribbonens `onDetails`-åtgärder, objektformatering och designlayout.
- `tests/motion-ribbon-browser.mjs`: regressionstest för att öppna Effekter, stänga panelen och öppna den igen via kommandot Övergångar och animeringar. Körs i desktop (1440x900), iPad-porträtt (820x1180) och mobil (390x844).

## Verifiering

- PASS: `node --check tests/motion-ribbon-browser.mjs`.
- PASS: statiska assert-kontroller av helpern och dess anrop.
- BLOCKED (miljö): `npm run build` kan inte slutföras. Det tillgängliga `node_modules` var ofullständigt (`sharp/index.js` saknades); försök med `npm ci` slutfördes inte inom verktygets tidsgräns.
- EJ KÖRT: `npm run lint`, Chromium E2E `npm run test:motion-ribbon`, iPad/WebKit och PWA Preview. Kan inte markeras PASS.

## Nästa åtgärd

Kör `npm ci && npm run lint && npm run build && npm run test:motion-ribbon` i en komplett Node 22/Playwright-miljö. Rätta eventuella testfel och kör om alla grindar. Fullfölj först då SF-NEXT-03.

## Risk

Låg beteenderisk: återanvänder existerande state transitions. Ingen ändring av PPD, rendering eller export. Fortfarande en verifieringsblockerare.
