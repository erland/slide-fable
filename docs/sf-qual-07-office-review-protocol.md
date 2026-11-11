# SF-QUAL-07 – protokoll för manuell exportacceptans

Detta protokoll följer referenspaketet med `acceptance.ppd.json`, `acceptance.pdf`, `acceptance.pptx` och `manifest.json`. Filerna är genererade från samma källpresentation. **Inga manuella prov är förhandsgodkända.**

## Förutsättningar

Anteckna prövningsdatum, testare, operativsystem och version, applikation/version (PowerPoint Mac/Windows, PDF-läsare), käll-commit och SHA-256 från manifestet. Bevara originalfilerna oförändrade. Gör varje redigeringsprov på en **kopia** av PPTX och bevara den omsparade filen tillsammans med skärmbilder.

## Referensbilder för jämförelse

Paketet innehåller `pdf-reference-1.png`, `pdf-reference-2.png` och `pdf-reference-3.png` i 1280 × 720 pixlar. Bilderna är **rasteriseringar av samma PDF som levereras i paketet**, inte oberoende skärmbilder från Slide Fables redigerare eller från PowerPoint.

Använd dem som snabb översikt när du granskar PPTX i PowerPoint. Jämför sidornas layout, färger, bildinnehåll och eventuella textförskjutningar. Dokumentera skillnader mot både PDF-referensen och originalets PPD-innehåll. Om PDF och PowerPoint visar samma fel är det inte bevis för att Slide Fables redigerare visar rätt – felet kan finnas i exporten.

Det finns också `editor-reference-1.png` till `editor-reference-3.png` – tagna direkt från presentationsytan i Slide Fables Chromium-redigerare och normaliserade till samma 1280 × 720-upplösning. Dessa är **inte** skapade från PDF:n. Jämför först *redigerare mot PDF* för att hitta exportskillnader, och därefter *PDF och redigerare mot PowerPoint* för att se om Office introducerar en ytterligare skillnad. Verklig PowerPoint-skärmbild ska läggas till manuellt i granskningsprotokollet, aldrig simuleras.

Kontrollera också filernas SHA-256 i `manifest.json` så att granskningen gäller samma referenspaket.

## Automatisk avvikelserapport (SF-QUAL-10)

Paketet innehåller också `difference-report.md`, `difference-report.json` och `difference-1.png` till `difference-3.png`. Rapporterna jämför de självständigt renderade redigerar- och PDF-bilderna, med färgskillnader per bild. Röda områden visar pixlar där någon färgkanal avviker med **mer än 24 av 255**; grått ligger inom toleransen.

**Rapporten är diagnostisk.** Skillnader i typsnittsrasterisering och kantutjämning räknas också, och ingen acceptansgräns för hela bilden har beslutats. Öppna originalbilderna sida vid sida och ange konkreta layout- eller innehållsfel i protokollet. Rapporten representerar inte PowerPoints egen rendering.

## Testobjekt

| Bild | Objekt | Kontroll |
|---|---|---|
| 1 – Text och former | Svensk rubrik med ÅÄÖ, löptext, färgad bakgrund, färgblock | Geometri, radbrytning, fontsubstitution och redigerbar text/form |
| 2 – Inbäddad bild och grafik | Inbäddad PNG och separat färgad form | Bildproportioner, placering, bildinnehåll, att bilden kan väljas och redigeras |
| 3 – Tabell och diagram | Sammanslagen tabellrubrik, värden 42/73, stapeldiagram Norr/Söder | Dataserie, tabellceller, cellspan, formatering och separat redigering |

## RG-006 – PowerPoint för Mac och Windows

För **varje plattform** dokumenteras:

- [ ] PPTX öppnar utan varning om filreparation eller förlorat innehåll.
- [ ] Alla tre bilder visas i rätt ordning.
- [ ] Rubriken ÅÄÖ och löptext visas, går att markera och textredigera.
- [ ] Formen och den inbäddade bilden går att välja separat.
- [ ] Tabellen går att redigera cellvis och den sammanslagna rubriken finns kvar.
- [ ] Stapeldiagrammet har kategorierna Norr/Söder och värdena 42/73; data kan ändras i PowerPoint.
- [ ] Presentationen kan sparas om till en separat PPTX och öppnas igen utan reparation.
- [ ] Visuella avvikelser mot källan har dokumenterats per bild/objekt, inklusive typsnittsersättning.

För varje fel: ange bild och objekt-ID (från PPD), förväntat resultat, faktiskt resultat, allvarlighetsgrad, skärmbild och eventuell omsparad PPTX. En avvikelse får inte döljas genom att markera ett annat prov som godkänt.

## RG-008 – fristående PDF-läsare

Testa i exempelvis macOS Förhandsvisning och/eller Adobe Acrobat. Anteckna exakt läsare och version.

- [ ] PDF öppnas utan fel och innehåller tre sidor i 16:9.
- [ ] Svenska ÅÄÖ visas korrekt och text kan markeras/sökas.
- [ ] Bakgrund, former och inbäddad bild visas på rätt platser.
- [ ] Tabell och diagram är läsbara och inte avklippta.
- [ ] Avvikelser dokumenteras med skärmbilder eller sidreferenser.

## Resultat (fylls i efter verkligt prov)

| Fält | Värde |
|---|---|
| Datum och testare | Ej genomfört |
| PowerPoint Mac, version och utfall | EJ TESTAT |
| PowerPoint Windows, version och utfall | EJ TESTAT |
| Oberoende PDF-läsare, version och utfall | EJ TESTAT |
| Kritiska avvikelser / länk till evidens | Ej bedömt |
| RG-006 | PENDING |
| RG-008 | PENDING |
| Övergripande releasebeslut | NOT_READY |

**Viktigt:** Grön CI och giltiga OOXML-delar bevisar endast maskinell grundstruktur. Först en dokumenterad, faktisk testkörning kan stödja manuell acceptans.
