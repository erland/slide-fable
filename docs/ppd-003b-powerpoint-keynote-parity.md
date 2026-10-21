# PPD-003B – Prioriterad funktionsparitet med PowerPoint och Keynote

**Datum:** 2026-10-21 · **Syfte:** få PPD att *kunna uttrycka* vanliga presentationsfunktioner, utan att försöka efterlikna varje specialfunktion. **Ingen schemaändring ingår i denna analys.**

## Underlag och arbetssätt

Jämförelsen utgår från Microsofts offentliga funktionsjämförelse för PowerPoint, Microsofts Office-webbfunktioner och Apples Keynote-handbok, plus PPD 0.3.1 i `schemas/ppd.schema.json` och statiskt granskad editor-/renderer-/exportkod. Källor:
- Microsoft: https://support.microsoft.com/en-us/powerpoint/compare-powerpoint-features-on-different-platforms
- Microsoft Learn: https://learn.microsoft.com/office365/servicedescriptions/office-online-service-description/office-online-service-description
- Apple: https://support.apple.com/en-ca/guide/keynote/tand2703708a/mac

**Prioritet A:** basbehov i vanliga föredrag; **B:** återkommande professionellt presentationsarbete; **C:** avancerat/nisch.  
**Formatstatus:** **Finns** = tydlig representation i 0.3.1; **Delvis** = representation finns men viktig semantik saknas/är ospecificerad; **Lucka** = ingen tydlig normativ representation för efterfrågad vanlig funktion. Detta säger *inte* att editor/export stöder funktionen.

## 1. Funktionsmatris

| Område | Vanlig funktion | Prio | PPD 0.3.1 | Rekommendation |
| --- | --- | :---: | --- | --- |
| Text | Teckenstorlek, färg, typsnitt, fet/kursiv/understrykning | A | Finns (style, runs/marks) | Bibehåll, dokumentera arv och precedence |
| Text | Styckejustering, radavstånd, punkt- och nummerlistor | A | Finns/delvis (paragraphStyle/list) | Testa indrag/hängande indrag, numrering och nivåer |
| Text | Genomstrykning, hyperlänk | B | Finns | Testa export |
| Text | Upphöjd/nedsänkt, markering, bokstavsavstånd | B | Lucka/delvis | Specificera i richRun, separat från elementstil |
| Text | Automatisk textpassning, överflöde, marginaler, lodrät justering | A | Finns/delvis | Fastställ korrekt layoutsemantik och rendering |
| Text | Textrotation/riktning, vertikal skrift | B | Delvis | Utred eget text-direction-fält, inte bara geometrisk rotation |
| Yta/ram | Fyllning, ram, färg, transparens även på textrutor | A | Finns | Implementera konsekvent i renderer/editor/export |
| Yta/ram | Streckade linjer, pilspetsar, line cap/join | A/B | Delvis (extensions), normativ lucka | Definiera standardiserad strokeStyle och markörer |
| Yta/ram | Bild-/gradientfyllning och rundade hörn | B | Finns/delvis | Standardisera scaling/gradientstopp/transform |
| Yta/ram | Skugga och mjuka kanter | B | Finns/delvis (effects) | Testa export och fallback |
| Objekt | Flytta, ändra storlek, rotera, justera och fördela | A | Finns (geometry; align/distribute runtime) | Ingen formatändring för kommandon |
| Objekt | Spegelvänd horisontellt/lodrätt | B | Lucka i enkel geometry | Definiera entydig 2D-transform semantik |
| Objekt | Gruppering, lagerordning, låsning | A | Finns/delvis | Klargör relativa koordinater/grupptransform |
| Former | Rektangel, rundad, oval, pilar, fria former | A | Finns/delvis | Utöka formbibliotek utan att göra shapeType utbytbart i inspector |
| Former | Justerbara handtag på former (callout/pil etc.) | B | Lucka/delvis | Definiera shape adjustments när konkreta typer stöds |
| Bilder | Placering, storlek, beskärning, passning, mask | A | Finns/delvis | Normalisera fit=stretch vs UI fill; test export |
| Bilder | Bildkant, skugga, opacitet och filter | B | Delvis | Samma surface/effect-adapters där lämpligt |
| Tabeller | Celltext, kolumner/rader, cellfyllning, tabellramar | A | Delvis | Beskriv kantlinjer per cell/sida, storlekar och marginaler |
| Tabeller | Sammanfoga celler | B | Finns (spans) | Konsekventa layoutregler |
| Diagram | Stapel, linje, cirkel och seriedata | A | Finns | Gemensamt dataschema och edit/test-paritet |
| Diagram | Serie-/punktfärger, etiketter, axlar, teckenförklaring | B | Delvis (axis/legend fria objekt) | Normativa datastilar och etiketter |
| Diagram | Kombinations-/yt-/punktdiagram | B | Finns typmässigt, runtime varierar | Testa innan UI-aktivering |
| Diagram/SmartArt | Process, organisationsdiagram, tidslinje | B | Delvis (semanticDiagram m.m.) | Samla på semantisk diagrammodell där möjligt |
| Presentation | Temafärger, typsnitt, masters och layouter | A | Finns/delvis | Normativa regler för stil-token och overrides |
| Presentation | Bildbakgrund, storlek, placering av objekt | A | Finns | Testa roundtrip och export |
| Presentation | Anteckningar, dolt bildspel, länkar mellan bilder | A/B | Finns/delvis | Verifiera hyperlink target och anteckningsexport |
| Presentation | Bildövergångar (toning, flytta, upplösning) | B | Finns/delvis | Standardisera litet basutbud och duration/easing |
| Animation | Objekt visas, försvinner eller rör sig, sekvens | B | Delvis (fragments/actions) | **Formatlucka:** normativ animationstidslinje med trigger, start, duration, target |
| Media | Infoga ljud/video med uppspelning och posterbild | B | Delvis | Avgränsa offline/källor, trims/fallback |
| Interaktion | Hyperlänk till URL/bild, klickhandling | B | Finns/delvis | Säker URL-policy och måltyp |
| Tillgänglighet | Alternativtext och läsordning | A | Finns | Export och skärmläsartest |
| Samarbete | Kommentarer, granskningsspår | C | Saknas som normativ modell | Skjut upp: inte nödvändigt för första PPD-målen |
| Special | 3D, Morph/Magic Move, avancerad video, AI | C | Delvis/oklart | Medvetet utanför normalparitet |

## 2. Formatkandidater för närtid

Följande är **rekommenderade kontrakt att specificera**, inte fält som redan införts:

1. **Konturer och ändmarkörer (A/B):** kanonisk modell för dash pattern, lineCap, lineJoin, start/end marker och markörskalning. Utgå från hur dagens `extensions` och renderare kodar dessa för att undvika dubbla representationer.
2. **Textformat (B):** richRun för superscript/subscript, highlight och letterSpacing; explicit textDirection endast vid verifierat användarfall. Bibehåll separation element/paragraph/run.
3. **2D-transform (B):** normativ flipX/flipY eller specificerad transformmatris, tillsammans med tydliga regler för geometri och gruppkoordinater.
4. **Tabelllayout (A/B):** kolumnbredder, radhöjder, cellmarginaler, cellkanter (per sida) och tabellstilar. Kolla om befintliga cell-stilar kan uttrycka detta innan nya fält.
5. **Diagramstil (B):** standardiserad serie-/punktstil, dataetiketter, enheter och sekundäraxlar, med begränsade redigerbara basfall.
6. **Objektanimation (B):** en minimal tidslinje med målobjekt, trigger (onClick/withPrevious/afterPrevious), delay/duration, effekt; skild från bildövergångar och statiska interaktioner.

**Inte schemaändringar:** inspector-sektioner, multiselektion/mixed-values, align/distribute-kommando, formatpensel, undo-stack och formtypens UI-immutabilitet.

## 3. Risker och beroenden

- Schemat låter många typ–specialfältkombinationer passera. Stärk förmågevalideringen stegvis och behåll stöd för tidigare filer.
- En JSON-giltig fill/stroke är inte likvärdig med en korrekt PowerPoint-export. Ge varje ny egenskap test-fixture för `validateFull`, save/reopen, browser-rendering och PDF/PPTX, inklusive förlustrappport.
- Prioritera **A före B**. Gemensam fill/stroke på textrutor och normalisering av bildfit ger användarnytta utan schemaändring. De sex formatkandidaterna ska inte automatiskt släppas i en stor brytande version.
- För en eventuell `0.3.2`: skriv ADR, JSON-exempel, validering, migration av 0.3.1, och fallback per egenskap. Undvik att lova full import-/exportparitet med Keynote eller PowerPoint.

## 4. Rekommenderat beslut nu

Godkänn denna matris som **funktionellt omfång för vanliga presentationer**. Definiera sedan detaljerade förslag i mindre separata kontrakt: först konturer/ändmarkörer och tabelllayout (tydlig vardagsnytta), därefter typografitillägg och objektanimation. Behåll dagens 0.3.1 tills förslagen och migrations-/exportkraven är kvalitetssäkrade.
