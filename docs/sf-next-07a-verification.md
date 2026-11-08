# SF-NEXT-07a – Dela sammanslagen tabellcell: slutverifiering

Datum: 2026-11-08. Källbas: komplett projekt-ZIP från SF-NEXT-07a. **Status: COMPLETED – automatiserad verifiering PASS.** Produktrelease förblir **NOT_READY**.

## Levererat

- `src/editor/tableCells.ts`: dela horisontellt sammanslagen cell (`colSpan > 1`), bevara ursprunglig identitet, innehåll och formatering; återställ den logiska tabellbredden med nya, unika cell-ID. Osäkra vertikala eller inkonsekventa spann avvisas utan mutation.
- `src/editor/ObjectEditors.tsx`: åtkomligt **Dela cell**-kommando och inaktivering när delning inte är säker.
- `tests/table-split.test.mjs`: tre enhetstester.
- `tests/table-split-browser.mjs`: Chromium-regression i desktop, stående iPad och mobil; sammanfogning/delning, Ångra/Gör om, återläsning, inbyggd redigerbar tabell i PPTX/OOXML.
- `package.json`: browserregressionen ingår i `npm test` via `test:raw`.

## Verifiering i Agent Workspace – Node 22 / Playwright Chromium Headless Shell 151.0.7922.34

Originalets `npm test` utför alla tester sekventiellt och översteg byggtjänstens tidsgräns för loggströmning. **Samma applikationskod, låsta beroenden och testfiler** kördes därför i separata verifieringsarkiv. Endast `package.json`-kommandot `scripts.test` ändrades till respektive delmängd i verifieringsarkiven; leverans-ZIP behåller originalkommandot. Alla kontroller PASS:

1. **Riktat steg:** `npm run lint`, `node --experimental-strip-types --test tests/table-split.test.mjs`, `npm run test:table-split` – PASS inklusive tre browserstorlekar. Riktad Agent Workspace-verifiering PASS 2026-11-08.
2. **Grupp A:** `test:data-ribbon`, `test:export-advanced`, `node --experimental-strip-types --test tests/*.test.mjs` (**180/180 PASS**), `test:lifecycle`, `test:pwa` – PASS. Loggartifakt `art_05f71404-6063-47af-905d-8950d9041b52`.
3. **Grupp B:** `test:inline-ux`, `test:insert-gallery`, `test:design-ribbon`, `test:background-ribbon`, `test:start-format`, `test:text-fit-ribbon` – PASS. Loggartifakt `art_520f19bc-46dd-439c-a73c-28e50c5bdcf3`.
4. **Grupp C:** `test:document-file`, `test:motion-ribbon`, `test:master-layout`, `test:export-geometry`, `test:export-data`, `test:table-split` – PASS. Loggartifakt `art_de907201-7a28-4a40-b297-e81275dcc31c`.
5. **Produktionsbygge:** Agent Workspace `npm ci` och projektets `npm run build` (inkl. TypeScript `tsc --noEmit` och Vite) – PASS med samma applikationskod. Samtliga tre grupper ovan avslutades också med build PASS.

**Täckningsnotering:** Grupperna A–C omfattar samtliga delkommandon i originalets `test:raw`. Den riktade körningen inkluderar separat lint. De tre nya enhetstesterna ingår både i riktad körning och i de 180 enhetstesterna. Ingen sammanhängande enskild `npm test`-process har fått PASS; verifieringsbeviset är den sammanlagda täckningen i oberoende PASS-grupper.

## Kvar inför release

Ingen verifierad automatisk blockerare för SF-NEXT-07a. Faktisk PowerPoint-redigering på Mac/Windows, fysisk iPad/iPhone och Safari/WebKit-acceptans samt äldre DEV-004–015 och RG-001–010 kvarstår som releasekrav, inte som oslutna kodtester i 07a.

**Nästa utvecklingssteg: SF-NEXT-07b – sammanhängande objektmarkerings- och egenskapspanelflöden.** Release `NOT_READY`.
