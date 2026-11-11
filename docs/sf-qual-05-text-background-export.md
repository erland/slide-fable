# SF-QUAL-05 – formaterad text på färgad bakgrund vid export

## Syfte

Utöka den befintliga visuella textregressionen med ett vanligt presentationsfall: flerradig text med fet och kursiv formatering som ligger ovanpå en färgad form. Kontrollera att både textens placering och bakgrundens färg följer med i PDF och att texten och bakgrundsformen förblir redigerbara i PPTX.

## Avgränsad förändring

- Den befintliga PPD-fixturen i `tests/text-export-parity-browser.mjs` får en färgad rektangel bakom den redan verifierade texten.
- Nuvarande kontroller för textkrympning, radbrytning, textens färg-/utbredningsmått och svenska tecken behålls.
- Editor- och PDF-raster jämförs i en stabil punkt inne i bakgrundsformen, men utanför texten och ramens antialiasing.
- PPTX-innehållet ska bevara formen med dess fyllningsfärg och den befintliga redigerbara formaterade texten.
- Workflowens snabba källkontroller får ett `node --check` för just detta browser-test innan den dyrare Chromium-verifieringen.

## Acceptans och begränsningar

Den ordinarie PR-verifieringen ska passera. Detta är en avgränsad regressionskontroll för färgad bakgrund + text, inte ett fullständigt pixelidentiskt test av all text- och formrendering. Olika fontmotorer kräver fortfarande separata toleranser och verklig PowerPoint-verifiering på Mac/Windows förblir en manuell releasegrind.

Ingen ändring görs i presentationsformat, redigerings- eller exportmotor. Testresultatet avser enbart det kontrollerade referensfallet.
