# SF-NEXT-07b – sammanhängande responsivt egenskapspanelflöde

Datum: 2026-11-08. **Status: COMPLETED – automatiserad verifiering PASS.** Release är fortfarande **NOT_READY**.

## Reproducerat fel och åtgärd

- `src/ui/EditorApp.tsx` innehöll felvänd tillståndslogik i knappen för att visa/dölja egenskapspanelen: vid stängning av panelen kunde `data-panel=properties` ligga kvar fast `data-properties-open=false`. Vid återöppning aktiverades inte alltid motsvarande panelval.
- Knappen använder nu explicit öppna/stäng: stängning sätter `showProperties=false` och går tillbaka till arbetsytan om egenskapsvyn var aktiv; öppning aktiverar både `showProperties=true` och `panel=properties`. Ingen ny panelarkitektur.
- `tests/panel-workflow-browser.mjs` provar sammanhängande arbetsflöde på 1440×900, stående iPad 820×1180 och mobil 390×844: markera form, formatera genom egenskapspanel, växla Bilder/Arbetsyta/Egenskaper med bibehållen markering, stäng/återöppna panel, infoga och ersätta bild med bevarat objekt-ID och selection. Samtliga PASS.
- `package.json` innehåller `test:panel-workflow`; det ordinarie `test:raw` inkluderar detta regressionstest sist.

## Agent Workspace – faktisk verifiering

Node 22, låsta npm-beroenden (`npm ci`), Playwright 1.62.1 och projektmatchad Chromium Headless Shell 151.0.7922.34.

- **Riktad verifiering:** `npm run lint && npm run test:panel-workflow` PASS, `npm run build` PASS. Logg `art_b02d836e-5bce-4cb1-b273-7814156a7134`.
- **Grupp A:** `test:data-ribbon`, `test:export-advanced`, `node --experimental-strip-types --test tests/*.test.mjs` (180/180 PASS), `test:lifecycle`, `test:pwa`, och produktionsbygge. Allt PASS. Logg `art_e84ef98d-dd6a-4424-8278-bb92b9ccc096`.
- **Grupp B:** `test:inline-ux`, `test:insert-gallery`, `test:design-ribbon`, `test:background-ribbon`, `test:start-format`, `test:text-fit-ribbon` och produktionsbygge. Allt PASS. Logg `art_b1a17034-a4bb-4b00-bc8e-0ebdb7e2bd79`.
- **Grupp C:** `test:document-file`, `test:motion-ribbon`, `test:master-layout`, `test:export-geometry`, `test:export-data`, `test:table-split`, `test:panel-workflow` och produktionsbygge. Allt PASS. Logg `art_6bf5b65e-bf52-4a34-a748-1cc1559d6fd2`.

På grund av Agent Workspaces körgräns testades originalets `test:raw` uppdelat i tre arkiv med **endast `scripts.test` temporärt ändrat**. All applikationskod, testkod, `test:raw` och låsta beroenden var identiska. I leveransarkivet är `scripts.test` återställt till ordinarie anrop `node scripts/run-tests-with-browser.cjs`.

**Begränsning:** en fysisk Safari/iPad/iPhone, riktig Office Mac/Windows öppna/redigera/återspara och övriga normativa releasegrindar är inte verifierade av Chromium-körningarna. Nästa steg: SF-NEXT-08 med releaseacceptans och dokumenterad signering; äldre DEV-004 och RG-009 kvarstår utan underlag.
