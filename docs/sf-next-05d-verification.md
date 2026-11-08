# SF-NEXT-05d – verifiering (2026-11-08)

## Omfattning

`ChartEditor` erbjuder Uppåt/Nedåt för diagramserier och kategorier. Kategoriflytt byter atomärt plats på etikett och motsvarande värden i **samtliga** serier, medan serieflytt behåller serie-ID och värden. Ändringen följer ordinarie `onChange`/historik (Ångra) och ändrar inte PPD-formatet eller exportkoden. Första och sista objektets ogiltiga riktning är inaktiverad.

## Verifieringsbevis

Agent Workspace Node.js 22, Playwright Chromium Headless Shell:

1. Riktad verifieringskopia av **samma källkod och tester** med `test:raw` begränsat till `npm run test:data-ribbon`: `npm ci` PASS (208 paket), `npm test` PASS i desktop, iPad portrait och mobil, `npm run build` PASS.
2. Separat verifieringskopia av **samma källkod och tester** med `test:raw` som kör hela resterande testsviten (alla `tests/*.test.mjs` plus PWA, export, desktop-/mobila browserflöden etc.): `npm ci` PASS, `npm test` PASS, `npm run build` PASS.
3. Ordinarie fullständig `npm test` för hela kedjan i ett enda anrop försöktes men avbröts på Agent Workspaces tidsgräns. **Denna körning är inte PASS.** Båda separata grupperna är PASS. Leveransens `package.json` har den kompletta ordinarie `test:raw`-kedjan oförändrad från utgångsversionen.
4. JavaScript-testsyntax kontrollerades lokalt; slutlig ZIP-integritet kontrolleras vid paketering.

## Kvarstående begränsningar

Browserkontrollerna använder Chromium Headless Shell; fysisk iPad/Safari samt slutlig PowerPoint-acceptans återstår. Vite rapporterar fortfarande en stor JS-bundle. Releasegrindarna är fortsatt öppna (`NOT_READY`).
