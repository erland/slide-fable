# PPD-003 – Fullständig format- och egenskapsanalys

**Datum:** 2026-10-21 · **Status:** beslutunderlag, inga schema- eller produktionsändringar.  
**Baslinje:** `schemas/ppd.schema.json` anger PPD **0.3.1** med **25** objekttyper, gemensam `$defs.element` och `$defs.style`. PR #56/57 är mergade.

## Sammanfattning och beslut

**Frys inga nya funktioner på antagandet att en egenskap saknas i PPD.** Majoriteten av önskade vanliga formatfunktioner kan redan uttryckas, men stöd i renderare, inspector och exportörer är ojämnt. Föreslagen prioritet: (1) stabilisera förmågesemantik och tester; (2) ge textobjekt yta/ram och införa gemensamma egenskaper; (3) fyll verkliga formatluckor, med bakåtkompatibel migration.

Detta är en **systematisk statisk inventering av samtliga objekttyper** och deras nuvarande schemadefinitioner, inte en körd kompatibilitetscertifiering mot PowerPoint/Keynote eller samtliga renderingar.

## Inventering – samtliga 25 objekttyper

**Schemaförmåga** nedan betyder att typen kan representeras genom `element` och specialfälten. För `process`, `timeline` och `orgChart` är en egen explicit innehållsegenskap inte listad i `$defs.element`; deras innebörd behöver normaliseras. **Gap** är föreslagna granskningspunkter, inte bevis på att allt saknas i dagens runtime.

| Typ | Möjlig representation i PPD 0.3.1 | Behövlig verifiering eller möjlig lucka | Prioritet |
| --- | --- | --- | --- |
| `text` | text/contentRef, rich runs, base typography | Yta/ram på text; overflow/autofit och line/paragraph precedence | P0 |
| `shape` | shapeType, text, fill/stroke, rounded corners | Bredare formgalleri, semantik för textbehållare | P1 |
| `line` | geometry, stroke, width | Linjekapslar, streckning, kopplings-/ändpunktssemantik | P1 |
| `arrow` | geometry, stroke, width | Pilspets-/ändmarkörers normativa format | P1 |
| `connector` | startAnchor/endAnchor, fallback, style | Standardiserad punktgeometri/ankare kontra extensions | P1 |
| `image` | assetRef, crop, focalPoint, fit | Kontroll av stretch/cover/contain-kontrakt och mask | P1 |
| `icon` | assetRef, style | Omfärgning, SVG/fallback och licensmetadata | P2 |
| `group` | children/transform | Grupptransform, koordinatram och arv behöver normativ semantik | P1 |
| `table` | cells/style/rowSpan/colSpan | Ramar per cell, kolumnbredder, autofit och uppdelning | P1 |
| `chart` | chartType/dataset/xAxis/yAxis/legend | Dataserieformat, sekundära axlar och kombinationsdiagram | P1 |
| `callout` | style, text, geometry | Svans/ankare till målelement saknar tydlig kontraktsmodell | P2 |
| `media` | mediaPlayback, assetRef | Poster, undertexter och fallback/export | P2 |
| `link` | link/actions | URL kontra visuell klickyta; statisk export | P2 |
| `component` | componentId/overrides | Overrideregler och rekursionsskydd | P1 |
| `process` | extensions/structured content | Egen semantisk kontraktsdefinition eller konsolidera med semanticDiagram | P2 |
| `timeline` | extensions/structured content | Normativt schema för datum, milstolpar och tidsskala | P2 |
| `orgChart` | extensions/structured content | Normativ modell för hierarki och relationer | P2 |
| `semanticDiagram` | semanticDiagram nodes/edges/layout | Förankrad stil per nod/kant, versionerad layoutsemantik | P1 |
| `equation` | equation sourceFormat/source/altText | Font och redigerbar kontra rasterexport | P2 |
| `vectorPath` | vectorPath | Stroke caps/joins, fill-rule, multipla vägar | P1 |
| `inkStroke` | inkStroke points/brush/color/width | Tryck, lutning, kurvinterpolering och koordinater | P2 |
| `model3D` | model3D | Resursformat, kamerastyrning och fallback | P3 |
| `embeddedObject` | embeddedObject | Sandbox, säkerhet och tillåtet innehåll | P3 |
| `codeBlock` | codeBlock | Syntaxspråk, tema och utskriftsfallback | P2 |
| `map` | map | Integritet, offline-snapshot och externa kartresurser | P3 |

**Notera:** Schemat använder ett gemensamt element med `type`-enum och valfria specialistfält. Därför kan även semantiskt orimliga kombinationer vara strukturellt giltiga (t.ex. `type: image` med `chartType`). En **typ–förmågevalidering** bör införas i applikationskontraktet, inte nödvändigtvis som omedelbart brytande JSON-schemaändring.

## Egenskapsfamiljer – generell gap- och förmågematris

| Familj | PPD 0.3.1 | Applikation / gap | Förslag |
| --- | --- | --- | --- |
| Identitet/lager | id, name, zIndex, visible, locked | Generiska knappar och lagerlista | Gemensam förmåga |
| Placering | geometry x/y/width/height/rotation, transform | Rotation och grupptransform behöver korsprov | Gemensam förmåga, undvik att kopiera geometry över olika objekt |
| Yta | style.fill färg/token/opacitet/gradient/assetRef | Textytor tillåtna men renderaren begränsar fill till shape/callout | Gemensam surface-förmåga, med 'ingen fyllning' |
| Kontur | style.stroke, strokeWidth, cornerRadius | Textkontur tillåten men inte renderad; avancerade dash/cap/join behöver granskning | P0 UI/renderer; separat formatförslag för linjeformat |
| Typografi | fontToken, fontFamily, fontSize, fontWeight, color, align, lineSpacing | Saknar enhetlig multi-edit; richRun/paragraphStyle prioritet | Gemensam textförmåga |
| Rich text | text/contentRef, paragraphs/runs/marks | Inline-format får ej skrivas över av elementstil | Innehålls- och karaktärsformat separeras |
| Textlayout | padding, verticalAlign, richText overflow/autoFit | Form/text bör dela textbehållare | Först runtimeadapter, testa overflow |
| Effekt | effects shadow/blur/glow/softEdge etc | Schema ger fler effekter än CSS-renderaren tolkar | Deklarera support per renderer/export |
| Transparens | style.opacity, fill.opacity | Olika nivåer (element/fyllning) | Behåll separat semantik |
| Tillgänglighet | accessibility altText/decorative/role/readingOrder | Semantik varierar mellan objekt/export | Gemensam förmåga |
| Interaktioner | actions event/kind/target/url | PDF/PPTX statiska enligt preflight | Export-policy och tydlig varning |
| Media/bild | fit/crop/focalPoint/mask/assetRef | `fit` i element tillåter `stretch`; editor använder också `fill` vilket inte är giltigt där | **Verifierad kontraktsmismatch**: harmonisera UI och schema |
| Tabell | cells, tableCell.style/span | Kolumnmått/kantformatering per sida behöver utredas | Testa innan ev schemautökning |
| Diagram | dataset/chartType/axis/legend | Schema stödjer bar,line,pie,area,scatter,combo; editorn väljer endast bar,line,pie | Utöka UI/renderstöd före format |
| Semantik | semanticDiagram, equation, vectorPath etc | Specialstrukturer finns, men olika exportfallback | Separata adapters |
| Tema/master | styleRef, layout/placeholder overrides | Inheritance/precedens ej fullt dokumenterad | Normativ stilupplösning med fixtures |
| Grupp/komponent | children, componentId, overrides, transform | Konflikt mellan id-referenser och rektangel/transform | Normativt arv och constraints |
| Export | editability/exportPolicy, fallbackAssetRef | `preflight` bedömer många avancerade typer som raster/hybrid | Verifiera faktiskt exportutfall, inte bara preflight |

## Konkreta fynd ur kodbasen

1. **Textbakgrund/ram:** `$defs.style` innehåller `fill/stroke/strokeWidth`, men `src/editor/Renderer.tsx` begränsar `elementStyle`-tilldelning till `['shape','callout']`. Detta är **runtimegap, inte formatgap**.
2. **Bildpassning:** schema `element.fit` tillåter `contain|cover|stretch`, medan `src/ui/EditorApp.tsx` erbjuder `cover|contain|fill`. Det är en faktisk kod–schema-mismatch; välj kanoniskt `stretch` och mappa eventuella äldre `fill`.
3. **Konturstilar:** `style` listar `stroke` och `strokeWidth` men ingen explicit `strokeDasharray`, `lineCap` eller `lineJoin`. Om vi vill stödja vanliga PPT-linjestilar interoperabelt är detta ett **troligt formatgap**, som behöver konkret kontraktsförslag och migrering.
4. **Objektbegränsningar:** `$defs.element` saknar i huvudsak villkor på typ–specialfält. Vi bör verifiera typbindning i runtime innan vi inför strikta `oneOf`-begränsningar i schema (risk för äldre filer/extensions).
5. **Schema vs UI:** `chartType` tillåter sex varianter men diagramväljaren i `EditorApp.tsx` endast tre. Detta är en produkt-/renderingslucka, inte ett nytt PPD-fält.
6. **Fallback/export:** `src/export/plan.ts` klassificerar effekter och avancerade typer till raster/hybrid; verklig dataförlust och formateringsparitet är **inte verifierade** av klassificeringen.
7. **Arv:** `effective()` slår samman tema/styleRef, objektstil och layoutbindningarnas overrides. Regler för blandade värden måste skilja ärvda och lokala egenskaper.

## Vad formatet bör klara under nästa utvecklingsfas

**P0 (måste fungera för grundläggande slide-redigering):** textruta och form med oberoende textfärg, yt-/bakgrundsfärg, ramfärg/tjocklek, opacitet; geometri/rotation; typografi; tydlig textlayout och bevarande av rich runs; undo/redo och återläsning. Representation finns, så börja med editor/renderare och tester.

**P1 (för jämförbarhet med PowerPoint/Keynote):** linjedash/linjekapslar/ändar, formatpensel, objektjustering/fördelning, avancerad formgeometri, bildmask/beskärning, tabellcellkanter, diagramseriestilar, stabil grupp-/komponentsemantik, stilar från tema/master. Vissa kan kräva formatutökningar (framför allt linje-/kontursemantik); besluta först efter fixtures.

**P2/P3 (avancerat/beroende på prioritering):** animation/övergångsscenarier, mediaförtitt/undertexter, kodblock och karta offline, 3D och inbäddade objekt; specificera säkerhet, determinism och exportfallback innan stöd utlovas.

## Föreslagna formatbeslut

| Beslut | Åtgärd nu | Eventuell PPD-ändring |
| --- | --- | --- |
| Stöd bakgrund och ram på textrutor | Ändra renderare/egenskapspanel + regressionstester | **Ingen** |
| Gemensamma egenskaper för blandade typer | Förmågeadapter + transaktionslager | **Ingen** |
| Blandade/ärvda värden | Endast UI-/runtime-status | **Ingen** |
| Bild `fit:fill` | Normalisera till giltigt `stretch`, migrering för äldre data i runtime | Normalt **ingen** |
| Dash/cap/join och ändmarkörer | Skapa test-fixtures, kartlägg befintliga extensions/export | **Kandidat** till 0.3.2 |
| Fullständiga tabellkanter/kolumnmått | Ange realistiska användarfall och intern modell | **Möjlig**, ej beslutad |
| Typstyrd validering | Mjuk varning och runtime-regler först | Starkare schema först vid versionsbeslut |
| Avancerad semantik i process/timeline/orgChart | Välj återbruk av `semanticDiagram` kontra specialiserade modeller | **Möjlig**, ej beslutad |
| Versionering | Låt 0.3.1 ligga kvar tills konkreta ändringar är specificerade och bakåtkompatibilitet dokumenterad | Vid verklig schemaförändring |

## Rekommenderad nästa följd

1. **PPD-004:** kontrakts- och interop-fixtures för föreslagna formatluckor (stroke/dash/cap/join, bildfit och tabellkant). Specificera endast formatfält som behövs för riktiga funktioner.
2. **UX-005:** förmågebaserad egenskapsredigerare (inklusive textbakgrund/ram) med positiva webbtester och PPD-roundtrip.
3. **UX-006:** multiredigering med blandade värden, låsning, en undo-transaktion.
4. **Export-001:** PDF/PPTX-paritetstester för stödda P0/P1-egenskaper och explicit förlustrapport.
5. **PPD-formatrevision:** bara för bevisat otillräckliga representationer; uppdatera då JSON Schema, referensfiler, migrationssteg och exportkontrakt tillsammans.

## Acceptanskriterier före formatändring

Varje föreslaget nytt PPD-fält måste ha: (1) konkret användarfall, (2) schemaexempel och validerad fixture, (3) renderer-/exportsemantik, (4) roundtrip-/undo-test, (5) kompatibilitets- och migrationsbeslut, (6) känd fallback på läsare som inte förstår fältet. Undvik UI-beroende transient fält i dokumentformatet.

## Begränsning

Denna PR är en systematisk analys av schema, modell, editor, browser-renderer och exportplaneringslogik. Den utgör **inte** en körd fullständig PDF/PPTX-feature-testsvit eller en fältnivårevision av alla exportadaptrar. Den sistnämnda bör göras i Export-001. Inga PPD-fält har tillkommit eller ändrats.
