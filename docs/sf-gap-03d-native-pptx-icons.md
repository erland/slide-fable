# SF-GAP-03D – native redigerbara PowerPoint-ikoner

## Funktion
De nio inbyggda Slide Fable-ikonerna (dator, databas, moln, nätverk, person, arbetsgrupp, säkerhet, inställningar och process) exporteras i profilen `editable-first` som **native PowerPoint-friformer** i stället för rasterbilder. Ikonerna går därmed att välja, flytta, storleksändra, rotera och ändra linjefärg/linjebredd i PowerPoint.

## Metod
`src/export/nativeIconGeometry.ts` känner endast igen ikonbibliotekets egna kanoniska sökvägar och `vectorPath`-objekt med 100×100-viewBox och `closed:false`. SVG-kommandon översätts till PowerPoints `custGeom`-punkter: linjer, separata delbanor och kubiska Bézier-kurvor bevaras. SVG-ellipsbågar approximeras med begränsat antal punkter, vilket kan ge små visuella skillnader i kurvor.

Native PowerPoint-former infogas via PptxGenJS befintliga stöd för `CUSTOM_GEOMETRY`. Objektens position, dimensioner, rotation och redigerbara linjeegenskaper bevaras. Okända/egna SVG-paths fortsätter att exporteras via befintlig säker rasterfallback. Käll-PPD förändras inte och inget nytt paketberoende införs.

## Kontroller
- `tests/native-icons-pptx-browser.mjs` exporterar de nio ikonerna och kontrollerar PPTX-slide-XML: `a:custGeom`, objectName och anpassad konturfärg; testar även fortsatt rasterfallback för okänd vektor.
- Testet körs via `npm run test:native-icons` som del av `npm run test:raw`.
- Full kandidatverifiering via GitHub Actions inkluderar dessutom befintliga PPD, PDF/HTML, PWA, mobil och redigeringsregressioner.

## Begränsningar
Native PowerPoint-friformer är redigerbara som objekt och konturer, men inte nödvändigtvis som de ursprungliga ikonernas enskilda SVG-kommandon i PowerPoints vanliga formredigering. Ellipsbågar får en måttlig geometrisk approximation. Fysiska PowerPoint-miljöer (Mac/Windows) omfattas inte av automatiska OOXML-tester och kräver separat manuell acceptans.
