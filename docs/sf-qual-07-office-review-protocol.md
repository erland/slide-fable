# SF-QUAL-07 – protokoll för manuell exportacceptans

Detta protokoll följer referenspaketet med `acceptance.ppd.json`, `acceptance.pdf`, `acceptance.pptx` och `manifest.json`. Filerna är genererade från samma källpresentation. **Inga manuella prov är förhandsgodkända.**

## Förutsättningar

Anteckna prövningsdatum, testare, operativsystem och version, applikation/version (PowerPoint Mac/Windows, PDF-läsare), käll-commit och SHA-256 från manifestet. Bevara originalfilerna oförändrade. Gör varje redigeringsprov på en **kopia** av PPTX och bevara den omsparade filen tillsammans med skärmbilder.

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
