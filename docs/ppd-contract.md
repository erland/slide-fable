# Slide Fable PPD-kontrakt 0.3.1

Fastställt för DEV-001 2026-10-19. Projektlokal profil, inte en publicerad extern
PPD-standard. Produktversion och schemaVersion är separata. Bifogat 0.3.0-schema
och specifikationer ligger oförändrade i reference. Det nya schemat finns i
`schemas/ppd.schema.json`; maskinell referens i `scripts/ppd_contract.py`.

## Strukturell kompatibilitet
0.3.1 preciserar 0.3.0: canonical geometry ersätter box, name är tillåtet,
connector införs med två objektankare, och image/icon/group/chart/table/component
måste ha respektive typad payload. Text har exakt en av text/contentRef. SVG-bana
och SVG-dokument måste ha matchande payload. Ändringarna är versionerade eftersom
de både lägger till fält och skärper tidigare tillåtna strukturer.

0.3.0 läses med originalschemat och migreras på en kopia, följt av ny validering.
Det bifogade exemplet fortsätter därför att accepteras via migrationsvägen. Det
är ett minimalt datakontraktsexempel och är inte färdigt för publicering/layout.
Ingen nuvarande implementation får ge sken av att PWA-importen är byggd: Python-
kontrollen är ett exekverbart facit att senare jämföra TypeScript-kärnan mot.

## Profiler och förhandling
| Profil/klassning | Betydelse |
|---|---|
| core | Schema, JCS-kompatibel data och specificerade semantiska regler; inte renderingsgodkännande |
| offline-single-file | core plus inbäddade resursbytes/hashar, publiceringsmetadata, geometri och källhash |
| editable_candidate | Version/features ser kompatibla ut; full validering återstår |
| read_only | Rå originaldata bevaras; får inte omskrivas/exporteras som ny redigerad modell |
| blocked | Fel format, okänd obligatorisk feature eller för hög minReaderVersion |

Läsförhandling stöder verifierad 0.3.0→0.3.1 samt 0.3.1. Version 0.1/0.2 och
framtida versioner erbjuds endast som bevarat original i läsläge. Att faktiskt
rendera fallback kräver separat säkerhetsvalidering i DEV-004. read_only är aldrig
en säkerhetsstämpel. Okänd obligatorisk feature blockerar även om fallback finns.
Den här kontrollen renderar inga objekt och hämtar aldrig nätresurser.

Reader/editorprofilen för första MVP omfattar bar/line/pie. area/scatter/combo är
strukturellt kända men ger begränsat läsläge i förhandlingen; de får inte tyst
konverteras. Övriga kända framtidstyper kan beskrivas av basschemat men deras
redigering/rendering ska deklareras via kapabilitetsmatris i senare implementation.

## Namnrymder och referenser
- Slides, masters, components och sektioner har var sin dokumentvid namnrymd.
- Visuella element-ID:n är unika över slides, master, layouter och komponentdefinitioner.
  En runtime-instans får ett separat, härlett renderings-ID utan att ändra modell-ID.
- Layout-ID:n är unika inom master; platshållar-ID:n inom layout; slots inom komponent.
- Innehållsblock är unika inom slide inklusive nästlade block. contentRef är exakt
  block-ID eller `blockId#text`, `blockId#title`, `blockId#body` för existerande fält.
  Punkten är tillåten i ett ID och får därför inte användas som implicit fältdelare.
- Stycke-ID:n är lokala till respektive rich-text-objekt. Nod- och kant-ID:n är
  lokala till diagram. Datasetkolumner och serier har var sina lokala namnrymder.
- Gruppbarn och objektankare pekar inom samma scene. Gruppcykler, dubbla barn och
  flera primära föräldrar avvisas. Komponentdefinitioner får inte skapa expansionscykler.
- assetRef/poster/fallback/captions/renderedAssetRef pekar i assets. Asset-ID är
  samlingens nyckel. Section/master/layout/style/placeholder/fragment kontrolleras.
- navigate-slide pekar på slide; show-hide/play-media på objekt, där play-media
  kräver media-typ. Actions är deklarationer, aldrig godtycklig JavaScript.

Tabellens cell-ID:n ska vara unika inom tabellen och cellspänn måste ligga inom
tabellens rutnät. Full grid/merge-validering tillhör DEV-010; detta steg fastställer
regeln men verifierar inte tabellayout. Detsamma gäller grupptransformmatematik,
datasetvärdens fulla typkompatibilitet och font-/textmätning i kommande kärna/editor.

## Geometri och källans identitet
Canonical geometry är x/y/width/height/rotation i logiska enheter. width/height
får inte vara negativa; synliga nollstora objekt ska diagnostiseras i renderaren.
Procentuell objektgeometri är inte med i denna profil. Ingen implicit skärmberoende
konvertering görs. Arrayordningen i slides styr visning; order är en äldre cache
som normaliseras vid kommande editoroperationer. Element sorteras på zIndex
(standard 0), med arrayordning som stabil sekundärnyckel.

| Källfält | Migration från verifierad 0.3.0 |
|---|---|
| box utan geometry | Flytta värdet till geometry |
| både box och geometry, lika | Behåll geometry, ta bort alias |
| både box och geometry, olika | Stoppa med GEOMETRY_CONFLICT |
| assetRef, rich runs/marks, id, ordning, extensions | Bevara oförändrat |
| assetId, marks-array och andra illustrativa äldre former | Avvisas av källschemat; ingen gissad konvertering |
| build | Ta bort härledd cache efter modellmigration; regenerera först vid export |

Samma modell ska ge samma SHA-256 oavsett JSON-objektens nyckelordning eller
harmlösa skillnader i numerisk notation. Använd RFC 8785 (JCS), UTF-8 och SHA-256
över rotobjektet utan hela build. Hashen är 64 gemena hextecken utan prefix.
Arrays behåller ordning. Ingen Unicode-normalisering görs. Dubbla JSON-nycklar,
NaN/Infinity, ogiltig Unicode och heltal utanför JCS-implementationens säkra
intervall avvisas. Hash är integritetskontroll, inte signatur eller äkthetsbevis.

## Publiceringskontrakt
Basschemat accepterar minimal metadata; offlineprofilen kräver provenance,
build.selfContained=true, geometry för alla objekt och korrekt sourceModelHash.
Varje asset måste ha embedded, matchande MIME/data-URI, base64 och SHA-256 över
avkodade bytes. Startprofilens tillåtna MIME är PNG/JPEG/WebP/SVG och WOFF2.
Inga ljud/video/3D-resurser utges som publiceringsstödda i denna första profil.
Resursbudget: högst 10 MiB per asset och 25 MiB totalt avkodad data. Det är
produktens pilotgränser, inte allmänna PPD-gränser. File-size och avkodad bildstorlek
måste dessutom begränsas i den framtida browserimportern före stora allokeringar.

## Säkerhets- och verifieringsgräns
Referenskontrollen avvisar specifika SVG-risker med konservativ element-/attributlista,
DTD, script, foreignObject, händelseattribut och externa URL-referenser. Den är
ingen komplett produktionssanerare och validerar inte all SVG-path-grammatik.
LaTeX/MathML hålls som källa; säker matematikrenderare, rekursions-/storleksgränser,
URI/MIME-sniffning och HTML-parserns inerthet ska bevisas i DEV-002/004.
En modell som klarar core får därför aldrig renderas som betrodd HTML direkt.
Okända extensions bevaras som opaka data utan att tolkas som kod eller referenser.
JSON-roundtrip och migrationsintegritet testas nu. HTML-, PDF- och PPTX-roundtrip
är fortfarande senare leveranssteg.
