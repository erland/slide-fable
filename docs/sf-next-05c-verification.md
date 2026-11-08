# SF-NEXT-05c – verifieringsrapport (2026-11-08)

## Ändring och avgränsning

- `src/editor/ObjectEditors.tsx`: Ta bort en befintlig dataserie eller kategori direkt i `ChartEditor`, utan JSON-redigering. Kategoriborttagning uppdaterar kategoriarrayen och alla seriervärden atomärt, med bibehållna serie-ID:n. Knapp är inaktiverad om endast en serie respektive kategori finns.
- `tests/data-ribbon-browser.mjs`: test av tillägg, borttagning av serie/kategori, justerad kategori-/värdelängd och fyra Ångra-steg som återställer tidigare data på desktop, iPad portrait och mobil.
- Inget byte av PPD-schema eller exportalgoritm.

## Automatiserad verifiering

Agent Workspace med Node 22 och Playwright Chromium Headless Shell:

1. **Riktad körning** med `npm test` där `test:raw` tillfälligt endast anropade `npm run test:data-ribbon`: **PASS** (`desktop`, `ipad-portrait`, `mobile`), `npm ci` PASS, `npm run build` PASS. Enbart `package.json`-testkommandot ändrades i verifieringskopian, inte källkod/testdata.
2. **Övriga regressioner** med `npm test` där `test:raw` tillfälligt uteslöt `test:data-ribbon`: **PASS**, `npm ci` PASS, `npm run build` PASS. All övrig befintlig testtäckning, inklusive PWA, editor och export, inkluderades.
3. Den kompletta ordinarie `npm test` försöktes först, men tre körningar nådde Agent Workspaces tidsgräns utan PASS/FAIL. Samma källkod verifierades därför i två separata grupper. **Rapportera inte en sammanhängande full `npm test` som PASS.**

`package.json` i leveransprojektet innehåller den ordinarie kompletta testkedjan inklusive data-ribbon, som är verifierad genom de två gruppkörningarna. Produktionsbyggena utfördes med identisk kod.

## Begränsningar

- Testat med Chromium Headless Shell, inte fysisk Safari/iPad eller Office.
- Vites varning om stor bundle kvarstår. Projektets globala releasebedömning är `NOT_READY`.
