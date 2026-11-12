# UX-01 – Textformateringens reglage (kandidat)

Datum: 2026-11-12. Källa: bifogat projekt-ZIP från användaren. En komplett jämförelse mot senare GitHub-commits har inte genomförts; ändringen är inte pushad.

## Observation

Den större TipTap-textredigeraren använde hårdkodade initialvärden för textstorlek (36) och textfärg (#183641) och saknade bunden markering för styckejustering. När användaren flyttade markören till text med andra egenskaper kunde reglagen visa missvisande värden. Direktredigeringens storleksfält hade också hårdkodat reservvärde.

## Ändring

- Formateringsreglagen hämtar aktuell textstorlek och textfärg ur editorns aktiva textstil.
- När ingen uttrycklig teckenstorlek finns visas ett tomt fält med ”Ärv” i stället för att presentera 36 som faktisk markering.
- Styckejustering visar editorns aktiva styckejustering.
- Färgkontrollerna behåller en giltig HTML-färg som visningsreserv när färgvärdet inte är en hex-färg; visad reservfärg ska inte tolkas som faktisk ärvd färg.

## Kontroller

- TSX-syntax/transpilering: PASS med lokalt tillgänglig TypeScript-kompilator.
- Full TypeScript-typkontroll, byggning och browseracceptans: EJ KÖRD / MILJÖBLOCKERAD eftersom `npm ci` inte kunde slutföras och projektberoenden saknas i den lokala körningen.
- Ingen ny release- eller produktionsacceptans tillskriven.

## Återstående acceptans

1. Kör `npm ci`, `npm run build` och `npm run test:inline-ux` i normal CI-miljö.
2. Kontrollera manuellt att byte av markering mellan två textruns med olika storlek/färg och styckejustering uppdaterar verktygen utan att ändra texten.
3. Verifiera fokus och textmarkering efter ändring från formateringsreglage på Safari/iPad.


## Riktat regressionstest – 12 november 2026

Filen `tests/inline-text-browser.mjs` har utökats med en kontroll av två textavsnitt med olika storlek och färg.

Agent Workspace (Node 22, Playwright/Chromium) verifierade installation, och tidigare ordinarie tester godkändes fram till det utökade `test:inline-ux`. Den nya kontrollen **FAIL**:

- I den faktiska DOM:en visas `Alfa ` med 32 px och `#cc0000` samt `Beta` med 44 px och `#0000cc`.
- Vid försök att flytta markören från `Beta` till `Alfa` visas fortfarande 44 i storleksreglaget, både efter tangentbordsförflyttning och direkt klick enligt testet.
- Möjlig fokus-/markeringseffekt måste undersökas innan det kan fastställas om det är en faktisk produktdefekt eller testproblem.
- Ingen PR har skapats. Steget får inte markeras färdigt förrän regressionstestet passerar och fullständig verifiering har gjorts om.

## Reparationsförsök och testresultat (fortsättning)

- Ett nytt webbläsartest placerar markören explicit inne i `Alfa` respektive `Beta` i DOM och utlöser `selectionchange`. Detta ersätter det tidigare osäkra antagandet att ett vanligt klick/tangenttryck flyttade markören.
- RichEditor-kandidaten uppdaterar React även på TipTaps `onSelectionUpdate` utöver `onTransaction` för att undvika att markeringar missas vid renderingen.
- Agent Workspace, Node 22/Playwright Chromium, körde `npm test`: **FAIL**. Testet väntar förgäves på att storleksreglaget ska visa 32 px efter markörflyttning. Tidigare ordinarie tester går igenom fram till det nya testet.
- Agent Workspace körde projektbyggning: **PASS**.
- Den här kandidatens beteende är **inte godkänt**, och en PR ska därför inte skapas eller mergas förrän grundorsaken är klarlagd och testsviten passerar.
- Fortsatt felsökning bör instrumentera TipTaps `state.selection`, `storedMarks`, DOM-markeringens `anchorNode` samt det värde som `getAttributes('textStyle')` returnerar vid varje interaktion. Kontrollera om reglagen själva förändrar fokus/markering, och återställ inte godkänd status genom att endast ta bort testet.

## Regression verification – 2026-11-12

The initial UX-01 regression failed because the scripted caret navigation did not select the expected text run. A later Playwright click near the left edge was intercepted by the canvas resize handle. The updated browser regression clicks inside each formatted run (away from resize handles), then checks that the size and color controls follow the actual caret. This is a test-fixture correction, not evidence of a text-formatting defect. The separate onSelectionUpdate refresh is retained as a defensive signal for selection-only changes.

## Final verifiering 2026-11-12

**UX-01: PASS i Agent Workspace (Node 22).** Regressionstestet med realistiska musinteraktioner verifierar att storleks- och färgreglagen följer markören när den flyttas mellan två olika formaterade textavsnitt. Hela `npm test` och `npm run build` passerade för samma kandidat. Tidigare FAIL-observationer ovan är historik över de ersatta testmetoderna, inte kvarstående fel.

Playwright använder i denna miljö den matchande Chromium Headless Shell-versionen, medan projektets startscript fortfarande varnar för att en full Chromium-binär saknas. Safari och fysisk iPad är inte testade och kräver separat acceptans inför release.
